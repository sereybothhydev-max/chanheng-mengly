"use client";

/**
 * The live gallery's brain: loads the first page, loads older pages on demand,
 * and keeps everything in sync via Supabase Realtime.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { GALLERY_PAGE_SIZE } from "@/lib/config";
import { fetchMediaPage, sortNewestFirst, subscribeToMedia } from "@/lib/media-feed";
import type { MediaItem } from "@/lib/types";

export function useLiveMedia(pageSize = GALLERY_PAGE_SIZE) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  /** Add or update items (de-duplicated by id), keeping newest first. */
  const addItems = useCallback((incoming: MediaItem[]) => {
    if (!incoming.length) return;
    setItems((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i]));
      for (const item of incoming) byId.set(item.id, item);
      return sortNewestFirst([...byId.values()]);
    });
  }, []);

  const removeItems = useCallback((ids: string[]) => {
    const gone = new Set(ids);
    setItems((prev) => prev.filter((i) => !gone.has(i.id)));
  }, []);

  // Initial load + realtime subscription.
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    try {
      fetchMediaPage({ limit: pageSize })
        .then((page) => {
          if (cancelled) return;
          addItems(page);
          setHasMore(page.length === pageSize);
          setStatus("ready");
        })
        .catch((err) => {
          console.error("Gallery failed to load", err);
          if (!cancelled) setStatus("error");
        });

      unsubscribe = subscribeToMedia({
        onInsert: (item) => addItems([item]),
        onDelete: (id) => removeItems([id]),
      });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }

    // Phones drop the realtime socket when the screen locks. When the guest
    // comes back to the tab, quietly fetch anything they missed.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      fetchMediaPage({ limit: pageSize })
        .then((page) => !cancelled && addItems(page))
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      unsubscribe?.();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pageSize, addItems, removeItems]);

  const loadMore = useCallback(async () => {
    const oldest = itemsRef.current[itemsRef.current.length - 1];
    if (!oldest || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchMediaPage({ limit: pageSize, before: oldest.created_at });
      addItems(page);
      setHasMore(page.length === pageSize);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [addItems, loadingMore, pageSize]);

  return { items, status, hasMore, loadingMore, loadMore, addItems, removeItems };
}
