/**
 * Admin-only media endpoints (require the session cookie).
 *   GET    /api/admin/media            → every item (for review + download)
 *   DELETE /api/admin/media { ids }    → delete files from Storage + rows
 */
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { deleteMediaByIds } from "@/lib/media-delete";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { MediaItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const unauthorized = () => NextResponse.json({ error: "សូមចូលម្តងទៀត។" }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return unauthorized();

  try {
    const supabase = getSupabaseAdmin();
    const all: MediaItem[] = [];
    const PAGE = 1000; // Supabase returns at most 1000 rows per request
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      all.push(...((data ?? []) as MediaItem[]));
      if (!data || data.length < PAGE) break;
    }
    return NextResponse.json({ items: all });
  } catch (err) {
    console.error("[admin/media GET]", err);
    return NextResponse.json({ error: "មិនអាចផ្ទុករូបភាពបានទេ។" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return unauthorized();

  const { ids } = (await req.json().catch(() => ({}))) as { ids?: unknown };
  const validIds = Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string" && UUID_RE.test(id)).slice(0, 500)
    : [];
  if (validIds.length === 0) return NextResponse.json({ error: "មិនទាន់បានជ្រើសអ្វីទេ។" }, { status: 400 });

  try {
    const deleted = await deleteMediaByIds(validIds);
    return NextResponse.json({ deleted: deleted.length });
  } catch (err) {
    console.error("[admin/media DELETE]", err);
    return NextResponse.json({ error: "លុបមិនបានសម្រេច — សូមព្យាយាមម្តងទៀត។" }, { status: 500 });
  }
}
