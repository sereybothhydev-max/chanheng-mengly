"use client";

/**
 * Full-screen viewer.
 *   Phone:    swipe left/right, tap ✕ to close
 *   Desktop:  ← / → arrow keys, Esc to close
 * `actions` lets the admin page add buttons (e.g. Delete) to the top bar.
 */
import { useEffect, useRef } from "react";
import { kn, khmerTime } from "@/lib/khmer";
import { publicUrl } from "@/lib/supabase-browser";
import type { MediaItem } from "@/lib/types";

type Props = {
  items: MediaItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  actions?: (item: MediaItem) => React.ReactNode;
};

export function Lightbox({ items, index, onIndexChange, onClose, actions }: Props) {
  const item = items[index];
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const prev = () => hasPrev && onIndexChange(index - 1);
  const next = () => hasNext && onIndexChange(index + 1);

  // Keyboard controls + lock page scrolling behind the lightbox.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && index < items.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, items.length, onClose, onIndexChange]);

  // Preload neighbouring photos so swiping feels instant.
  useEffect(() => {
    for (const n of [items[index - 1], items[index + 1]]) {
      if (n?.media_type === "image") new Image().src = publicUrl(n.storage_path);
    }
  }, [index, items]);

  if (!item) return null;

  const src = publicUrl(item.storage_path);
  const fileName = `wedding-${item.id.slice(0, 8)}.${item.storage_path.split(".").pop()}`;
  const when = khmerTime(item.created_at);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="កម្មវិធីមើលរូបថត"
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-[#1d1714]/95 text-white backdrop-blur-sm"
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onClose(); // swipe down closes
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2">
        <span className="text-sm text-white/60">
          {kn(index + 1)} / {kn(items.length)}
        </span>
        <div className="flex items-center gap-2">
          {actions?.(item)}
          <a
            href={publicUrl(item.storage_path, { download: fileName })}
            className="rounded-full px-3 py-1 text-sm text-white/80 ring-1 ring-white/25 transition hover:bg-white/10"
          >
            រក្សាទុក
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
            className="grid h-9 w-9 place-items-center rounded-full text-white/90 ring-1 ring-white/25 transition hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Media */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        {item.media_type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.id}
            src={src}
            alt={item.guest_name ? `រូបថតពី ${item.guest_name}` : "រូបថតភ្ញៀវ"}
            className="max-h-full max-w-full animate-zoom-in rounded-md object-contain shadow-2xl"
          />
        ) : (
          <video
            key={item.id}
            src={src}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full animate-zoom-in rounded-md shadow-2xl"
          />
        )}

        {hasPrev && <NavButton side="left" onClick={prev} />}
        {hasNext && <NavButton side="right" onClick={next} />}
      </div>

      {/* Caption */}
      <div className="px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] text-center">
        {item.message && (
          <p className="mx-auto max-w-lg font-display text-lg leading-relaxed text-white/95">
            “{item.message}”
          </p>
        )}
        <p className="mt-2 text-sm text-[#e2c78f]">
          {item.guest_name ? `${item.guest_name} · ` : ""}
          {when}
        </p>
      </div>
    </div>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "មុន" : "បន្ទាប់"}
      className={`absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 sm:grid ${side === "left" ? "left-3" : "right-3"}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
