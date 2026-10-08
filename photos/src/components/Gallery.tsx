"use client";

/**
 * Live gallery grid — newest first, updates in real time, loads older items
 * automatically as guests scroll. Tap any tile to open the lightbox.
 */
import { useEffect, useRef, useState } from "react";
import { kn } from "@/lib/khmer";
import { publicUrl } from "@/lib/supabase-browser";
import type { MediaItem } from "@/lib/types";
import { Lightbox } from "./Lightbox";
import { Ornament } from "./Ornament";
import { PlayBadge } from "./UploadPanel";

type Props = {
  items: MediaItem[];
  status: "loading" | "ready" | "error";
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

export function Gallery({ items, status, hasMore, loadingMore, onLoadMore }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: load more when the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && onLoadMore(),
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  // Track the open item by id, so it stays correct while new uploads arrive.
  const openIndex = openId ? items.findIndex((i) => i.id === openId) : -1;

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <p className="eyebrow flex items-center gap-2 !text-gold-300">
          <span className="inline-block h-2 w-2 animate-live-pulse rounded-full bg-blush-400" />
          ផ្សាយផ្ទាល់
        </p>
        <h2 className="shadow-text mt-2 font-moul text-3xl leading-[1.6] text-ivory">វិចិត្រសាលរូបភាព</h2>
        <Ornament className="mt-3 h-4 w-36 text-gold-300" />
        {status === "ready" && items.length > 0 && (
          <p className="mt-2 text-sm text-ivory/80">
            បានចែករំលែកអនុស្សាវរីយ៍ {kn(items.length)}
            {hasMore ? "+" : ""}
          </p>
        )}
      </div>

      {status === "loading" && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="glass-card mx-auto max-w-sm rounded-2xl p-5 text-center text-sm text-ink-soft">
          មិនអាចផ្ទុកវិចិត្រសាលបានទេឥឡូវនេះ។ សូមផ្ទុកទំព័រឡើងវិញបន្តិចទៀត។
        </p>
      )}

      {status === "ready" && items.length === 0 && (
        <p className="shadow-text mx-auto max-w-xs text-center font-display text-lg text-ivory/85">
          មិនទាន់មានរូបថតនៅឡើយទេ — សូមក្លាយជាអ្នកដំបូងដែលចែករំលែកអនុស្សាវរីយ៍ ♡
        </p>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {items.map((item, index) => (
            <li key={item.id}>
              <Tile item={item} index={index} onOpen={() => setOpenId(item.id)} />
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinelRef} className="h-1" />
      {hasMore && (
        <div className="mt-8 text-center">
          <button type="button" className="btn-ghost" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "កំពុងផ្ទុក…" : "ផ្ទុកអនុស្សាវរីយ៍បន្ថែម"}
          </button>
        </div>
      )}

      {openIndex >= 0 && (
        <Lightbox
          items={items}
          index={openIndex}
          onIndexChange={(i) => setOpenId(items[i]?.id ?? null)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function Tile({ item, index, onOpen }: { item: MediaItem; index: number; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const src = publicUrl(item.thumb_path ?? item.storage_path);
  const label = item.guest_name ? `រូបថតពី ${item.guest_name}` : "រូបថតភ្ញៀវ";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={item.media_type === "video" ? `ចាក់វីដេអូ${item.guest_name ? ` ពី ${item.guest_name}` : ""}` : label}
      className={`group relative block aspect-square w-full animate-fade-up overflow-hidden rounded-2xl shadow-[0_14px_30px_-18px_rgb(0_0_0/0.55)] ${loaded ? "bg-blush-100" : "skeleton"}`}
      style={{ animationDelay: `${(index % 12) * 45}ms` }}
    >
      {item.media_type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition duration-700 ease-[var(--ease-silk)] group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <>
          <video
            src={`${publicUrl(item.storage_path)}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            className="h-full w-full object-cover"
          />
          <PlayBadge />
        </>
      )}

      {item.guest_name && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/45 to-transparent px-3 pt-7 pb-2 text-left text-sm leading-normal text-white/95">
          {item.guest_name}
        </span>
      )}
    </button>
  );
}
