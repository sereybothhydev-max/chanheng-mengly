/**
 * POST /api/media/delete  { items: [{ id, token }] }
 *
 * Lets a guest delete photos/videos they uploaded themselves. Each item must
 * carry the owner key their phone received at upload time (see owner-token.ts).
 * Items with a missing or wrong key are silently skipped.
 */
import { NextResponse } from "next/server";
import { deleteMediaByIds } from "@/lib/media-delete";
import { isValidOwnerToken } from "@/lib/owner-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { items?: unknown };
  const items = Array.isArray(body.items) ? body.items.slice(0, 200) : [];

  const ids = items
    .filter(
      (it): it is { id: string; token: string } =>
        !!it &&
        typeof (it as { id?: unknown }).id === "string" &&
        UUID_RE.test((it as { id: string }).id) &&
        isValidOwnerToken((it as { id: string }).id, (it as { token?: unknown }).token),
    )
    .map((it) => it.id);

  if (ids.length === 0) {
    return NextResponse.json({ error: "អ្នកអាចលុបបានតែរូបដែលអ្នកបានបង្ហោះប៉ុណ្ណោះ។" }, { status: 403 });
  }

  try {
    const deleted = await deleteMediaByIds(ids);
    return NextResponse.json({ deleted });
  } catch (err) {
    console.error("[media/delete]", err);
    return NextResponse.json({ error: "លុបមិនបានសម្រេច — សូមព្យាយាមម្តងទៀត។" }, { status: 500 });
  }
}
