/**
 * Shared server helper: delete media rows AND their files from Storage.
 * Used by the couple's dashboard and by guests deleting their own uploads.
 */
import "server-only";
import { STORAGE_BUCKET } from "./config";
import { getSupabaseAdmin } from "./supabase-admin";

export async function deleteMediaByIds(ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const supabase = getSupabaseAdmin();

  const { data: rows, error: selectError } = await supabase
    .from("media")
    .select("id, storage_path, thumb_path")
    .in("id", ids);
  if (selectError) throw selectError;
  if (!rows?.length) return [];

  const paths = rows.flatMap((r) => [r.storage_path, r.thumb_path]).filter(Boolean) as string[];
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    if (storageError) throw storageError;
  }

  const found = rows.map((r) => r.id as string);
  // Deleting the rows also removes them live from every open gallery (Realtime).
  const { error: deleteError } = await supabase.from("media").delete().in("id", found);
  if (deleteError) throw deleteError;

  return found;
}
