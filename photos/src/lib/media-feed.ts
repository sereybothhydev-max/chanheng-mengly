/**
 * Reading the gallery + listening for live changes (browser side).
 */
import { getSupabase } from "./supabase-browser";
import type { MediaItem } from "./types";

/** Newest-first page of media. Pass `before` (a created_at) to get older items. */
export async function fetchMediaPage(opts: { limit: number; before?: string }): Promise<MediaItem[]> {
  let query = getSupabase()
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(opts.limit);
  if (opts.before) query = query.lt("created_at", opts.before);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MediaItem[];
}

/**
 * Subscribe to Supabase Realtime. Every open phone gets new uploads (and
 * deletions by the couple) within a second or two. Returns an unsubscribe fn.
 */
export function subscribeToMedia(handlers: {
  onInsert: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`media-feed-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "media" }, (payload) =>
      handlers.onInsert(payload.new as MediaItem),
    )
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "media" }, (payload) => {
      const id = (payload.old as { id?: string }).id;
      if (id) handlers.onDelete(id);
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Sort newest → oldest (ties broken by id so order is stable). */
export function sortNewestFirst(items: MediaItem[]): MediaItem[] {
  return [...items].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id.localeCompare(a.id),
  );
}
