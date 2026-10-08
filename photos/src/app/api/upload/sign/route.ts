/**
 * STEP 1 of an upload: POST /api/upload/sign
 *
 * The phone sends the name/type/size of each file it wants to upload.
 * We validate them, invent a safe random file path for each, and hand back a
 * one-time "signed upload URL" per file. The phone then uploads directly to
 * Supabase Storage — the file bytes never pass through Vercel.
 */
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { STORAGE_BUCKET, UPLOAD_LIMITS } from "@/lib/config";
import { kn } from "@/lib/khmer";
import { mapPool } from "@/lib/pool";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { SignedUpload } from "@/lib/types";
import { extensionFor, validateFile } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignRequest = {
  files?: { name?: unknown; type?: unknown; size?: unknown; wantsThumb?: unknown }[];
};

export async function POST(req: Request) {
  let body: SignRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "សំណើមិនត្រឹមត្រូវ។" }, { status: 400 });
  }

  const files = Array.isArray(body.files) ? body.files : [];
  if (files.length === 0) {
    return NextResponse.json({ error: "មិនទាន់បានជ្រើសឯកសារទេ។" }, { status: 400 });
  }
  if (files.length > UPLOAD_LIMITS.maxFilesPerBatch) {
    return NextResponse.json(
      { error: `អាចចែករំលែកបានអតិបរមា ${kn(UPLOAD_LIMITS.maxFilesPerBatch)} ឯកសារក្នុងមួយលើក។` },
      { status: 400 },
    );
  }

  // Validate everything first — reject the whole batch on any bad file.
  const prepared: { path: string; thumbPath: string | null; mime: string; kind: "image" | "video" }[] = [];
  for (const f of files) {
    const result = validateFile({
      name: String(f.name ?? "file"),
      type: String(f.type ?? ""),
      size: Number(f.size),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    // The server picks the file name — guests never control storage paths.
    const id = randomUUID();
    prepared.push({
      path: `uploads/${id}.${extensionFor(result.mime)}`,
      thumbPath: f.wantsThumb === true && result.kind === "image" ? `thumbs/${id}.jpg` : null,
      mime: result.mime,
      kind: result.kind,
    });
  }

  try {
    const storage = getSupabaseAdmin().storage.from(STORAGE_BUCKET);

    // 8 at a time keeps a 50-file batch quick without flooding Supabase.
    const uploads: SignedUpload[] = await mapPool(prepared, 8, async (p) => {
        const main = await storage.createSignedUploadUrl(p.path);
        if (main.error) throw main.error;

        let thumbSignedUrl: string | null = null;
        if (p.thumbPath) {
          const thumb = await storage.createSignedUploadUrl(p.thumbPath);
          if (!thumb.error) thumbSignedUrl = thumb.data.signedUrl;
        }

        return {
          path: p.path,
          mime: p.mime,
          kind: p.kind,
          signedUrl: main.data.signedUrl,
          thumbPath: thumbSignedUrl ? p.thumbPath : null,
          thumbSignedUrl,
        };
    });

    return NextResponse.json({ uploads });
  } catch (err) {
    console.error("[upload/sign]", err);
    return NextResponse.json(
      { error: "មិនអាចរៀបចំការបង្ហោះបានទេ។ សូមព្យាយាមម្តងទៀតបន្តិចទៀត។" },
      { status: 500 },
    );
  }
}
