/**
 * STEP 2 of an upload: POST /api/upload/complete
 *
 * After the phone finishes uploading, it tells us which files arrived plus
 * the guest's (optional) name and message. We double-check each file really
 * exists in Storage — and read its REAL size and type from Supabase rather
 * than trusting the browser — then add it to the gallery table. Realtime
 * then pushes it to every open phone.
 */
import { NextResponse } from "next/server";
import { STORAGE_BUCKET, UPLOAD_LIMITS } from "@/lib/config";
import { ownerToken } from "@/lib/owner-token";
import { mapPool } from "@/lib/pool";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { cleanText, kindOf } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PATH_RE = /^uploads\/([0-9a-f-]{36})\.(jpg|png|webp|gif|heic|heif|mp4|mov|webm)$/;

type CompleteRequest = {
  items?: { path?: unknown; thumbPath?: unknown }[];
  guestName?: unknown;
  message?: unknown;
};

export async function POST(req: Request) {
  let body: CompleteRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "សំណើមិនត្រឹមត្រូវ។" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items.slice(0, UPLOAD_LIMITS.maxFilesPerBatch) : [];
  if (items.length === 0) return NextResponse.json({ error: "គ្មានអ្វីត្រូវរក្សាទុកទេ។" }, { status: 400 });

  const guestName = cleanText(body.guestName, UPLOAD_LIMITS.maxNameLength);
  const message = cleanText(body.message, UPLOAD_LIMITS.maxMessageLength);

  try {
    const supabase = getSupabaseAdmin();
    const storage = supabase.storage.from(STORAGE_BUCKET);
    const now = Date.now();

    const rows = (
      await mapPool(items, 8, async (item, index) => {
          const path = typeof item.path === "string" ? item.path : "";
          const match = PATH_RE.exec(path);
          if (!match) return null;

          // Does the file actually exist? What are its real size and type?
          const info = await storage.info(path);
          if (info.error || !info.data) return null;

          const mime = (info.data.contentType ?? "").split(";")[0].trim().toLowerCase();
          const size = Number(info.data.size ?? 0);
          const kind = kindOf(mime);
          const maxBytes = kind === "video" ? UPLOAD_LIMITS.maxVideoBytes : UPLOAD_LIMITS.maxImageBytes;

          if (!kind || size <= 0 || size > maxBytes) {
            await storage.remove([path]); // not allowed → clean it up
            return null;
          }

          // Optional thumbnail must belong to the same upload id.
          let thumbPath: string | null = null;
          const expectedThumb = `thumbs/${match[1]}.jpg`;
          if (item.thumbPath === expectedThumb) {
            const thumbInfo = await storage.info(expectedThumb);
            if (!thumbInfo.error && thumbInfo.data) thumbPath = expectedThumb;
          }

          return {
            storage_path: path,
            thumb_path: thumbPath,
            media_type: kind,
            mime_type: mime,
            size_bytes: size,
            guest_name: guestName,
            message,
            // +index ms keeps a batch in a stable order in the gallery
            created_at: new Date(now + index).toISOString(),
          };
      })
    ).filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "គ្មានឯកសារណាមួយបង្ហោះបានចប់ទេ។ សូមព្យាយាមម្តងទៀត។" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("media")
      .upsert(rows, { onConflict: "storage_path", ignoreDuplicates: true })
      .select();
    if (error) throw error;

    // One owner key per new item, so this guest's phone can delete it later.
    const tokens = Object.fromEntries((data ?? []).map((row) => [row.id as string, ownerToken(row.id as string)]));
    return NextResponse.json({ items: data ?? [], tokens });
  } catch (err) {
    console.error("[upload/complete]", err);
    return NextResponse.json(
      { error: "ឯកសាររបស់អ្នកបានបង្ហោះហើយ ប៉ុន្តែមិនអាចបន្ថែមទៅវិចិត្រសាលបានទេ។ សូមព្យាយាមម្តងទៀត។" },
      { status: 500 },
    );
  }
}
