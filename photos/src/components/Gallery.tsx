"use client";

/**
 * Live gallery grid — newest first, updates in real time, loads older items
 * automatically as guests scroll. Tap any tile to open the lightbox.
 *
 * Guests can also SELECT AND DELETE the photos/videos they uploaded from this
 * phone (never anyone else's). Their phone keeps a secret owner key for each
 * of their uploads — see lib/my-uploads.ts and lib/owner-token.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { kn } from "@/lib/khmer";
import { forgetMyUploads, readMyUploads, type MyUploads } from "@/lib/my-uploads";
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
  onDeleted: (ids: string[]) => void;
};

export function Gallery({ items, status, hasMore, loadingMore, onLoadMore, onDeleted }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── "My uploads" (from this phone) ──────────────────────────────────────
  const [mine, setMine] = useState<MyUploads>({});
  useEffect(() => {
    const refresh = () => setMine(readMyUploads());
    refresh();
    window.addEventListener("my-uploads-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("my-uploads-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const myItems = useMemo(() => items.filter((i) => mine[i.id]), [items, mine]);

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Leave select mode automatically if none of my items are left.
  useEffect(() => {
    if (selecting && myItems.length === 0) exitSelecting();
  }, [selecting, myItems.length]);

  // Drop selections that disappeared (deleted elsewhere / by the couple).
  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(items.map((i) => i.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  function exitSelecting() {
    setSelecting(false);
    setSelected(new Set());
    setConfirming(false);
    setError("");
  }

  function toggle(id: string) {
    setConfirming(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Delete my items by id. Returns true on success. */
  const deleteMine = useCallback(
    async (ids: string[]) => {
      const payload = ids.filter((id) => mine[id]).map((id) => ({ id, token: mine[id] }));
      if (!payload.length) return false;
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/media/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payload }),
        });
        const json = (await res.json().catch(() => ({}))) as { deleted?: string[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? "លុបមិនបានសម្រេច។");
        const gone = json.deleted ?? [];
        forgetMyUploads(ids);
        onDeleted(gone);
        setNotice(`បានលុប ${kn(gone.length)} ♡`);
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [mine, onDeleted],
  );

  async function deleteSelected() {
    const ok = await deleteMine([...selected]);
    if (ok) exitSelecting();
  }

  // ── Infinite scroll ─────────────────────────────────────────────────────
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
    <div className={selecting ? "pb-28" : undefined}>
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

        {/* Select & delete my own photos */}
        {myItems.length > 0 &&
          (selecting ? (
            <p className="shadow-text mt-4 text-sm text-gold-200">ចុចលើរូបរបស់អ្នក ដើម្បីជ្រើសរើស</p>
          ) : (
            <button
              type="button"
              onClick={() => setSelecting(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-300/60 bg-black/30 px-4 py-2 text-sm text-ivory backdrop-blur-sm transition hover:bg-black/45"
            >
              <TrashIcon className="h-4 w-4 text-gold-300" />
              ជ្រើស និងលុបរូបរបស់ខ្ញុំ ({kn(myItems.length)})
            </button>
          ))}
        {notice && (
          <p className="mt-3 animate-fade-in rounded-full bg-black/40 px-4 py-1.5 text-sm text-ivory" role="status">
            {notice}
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
          {items.map((item, index) => {
            const isMine = !!mine[item.id];
            return (
              <li key={item.id}>
                <Tile
                  item={item}
                  index={index}
                  mode={!selecting ? "view" : isMine ? "selectable" : "locked"}
                  selected={selected.has(item.id)}
                  onTap={() => (selecting ? isMine && toggle(item.id) : setOpenId(item.id))}
                />
              </li>
            );
          })}
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

      {/* Bottom action bar while selecting */}
      {selecting && (
        <div className="fixed inset-x-0 bottom-0 z-[45] animate-sheet-up px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div className="mx-auto max-w-2xl rounded-2xl border border-gold-300/40 bg-[#1d1714]/90 p-3 text-ivory shadow-2xl backdrop-blur-md">
            {error && <p className="mb-2 rounded-xl bg-blush-50 px-3 py-2 text-sm text-[#9a4b3c]">{error}</p>}

            {confirming ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-sm">
                  លុប {kn(selected.size)} ជាអចិន្ត្រៃយ៍? <span className="text-ivory/70">មិនអាចយកមកវិញបានទេ។</span>
                </p>
                <button type="button" className="btn-ghost !py-2" onClick={() => setConfirming(false)} disabled={busy}>
                  កុំលុប
                </button>
                <button
                  type="button"
                  onClick={deleteSelected}
                  disabled={busy}
                  className="rounded-full bg-[#b5503e] px-4 py-2 text-sm font-medium text-white transition active:scale-95 disabled:opacity-60"
                >
                  {busy ? "កំពុងលុប…" : "លុប"}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-sm">
                  បានជ្រើស <span className="font-medium text-gold-200">{kn(selected.size)}</span>
                </p>
                <button
                  type="button"
                  className="rounded-full px-3 py-2 text-sm text-gold-200 underline-offset-4 hover:underline"
                  onClick={() =>
                    setSelected(
                      selected.size === myItems.length ? new Set() : new Set(myItems.map((i) => i.id)),
                    )
                  }
                >
                  {selected.size === myItems.length ? "ដោះការជ្រើស" : "ជ្រើសទាំងអស់"}
                </button>
                <button type="button" className="btn-ghost !py-2" onClick={exitSelecting}>
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={selected.size === 0}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#b5503e] px-4 py-2 text-sm font-medium text-white transition active:scale-95 disabled:opacity-40"
                >
                  <TrashIcon className="h-4 w-4" />
                  លុប
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {openIndex >= 0 && (
        <Lightbox
          items={items}
          index={openIndex}
          onIndexChange={(i) => setOpenId(items[i]?.id ?? null)}
          onClose={() => setOpenId(null)}
          actions={(item) =>
            mine[item.id] ? (
              <DeleteOneButton
                key={item.id}
                onConfirm={async () => {
                  const ok = await deleteMine([item.id]);
                  if (ok) setOpenId(null);
                }}
              />
            ) : null
          }
        />
      )}
    </div>
  );
}

/** Two-tap delete inside the full-screen viewer: "លុប" → "ចុចម្តងទៀតដើម្បីលុប". */
function DeleteOneButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!armed) return setArmed(true);
        setBusy(true);
        await onConfirm();
        setBusy(false);
        setArmed(false);
      }}
      className={`rounded-full px-3 py-1 text-sm ring-1 transition ${
        armed ? "bg-[#b5503e] text-white ring-[#b5503e]" : "text-[#f1b3a6] ring-[#f1b3a6]/50 hover:bg-white/10"
      }`}
    >
      {busy ? "កំពុងលុប…" : armed ? "ចុចម្តងទៀតដើម្បីលុប" : "លុប"}
    </button>
  );
}

function Tile({
  item,
  index,
  mode,
  selected,
  onTap,
}: {
  item: MediaItem;
  index: number;
  mode: "view" | "selectable" | "locked";
  selected: boolean;
  onTap: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = publicUrl(item.thumb_path ?? item.storage_path);
  const label = item.guest_name ? `រូបថតពី ${item.guest_name}` : "រូបថតភ្ញៀវ";

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={mode === "locked"}
      aria-pressed={mode === "selectable" ? selected : undefined}
      aria-label={
        mode === "selectable"
          ? selected
            ? "ដោះការជ្រើស"
            : "ជ្រើសរូបនេះ"
          : item.media_type === "video"
            ? `ចាក់វីដេអូ${item.guest_name ? ` ពី ${item.guest_name}` : ""}`
            : label
      }
      className={`group relative block aspect-square w-full animate-fade-up overflow-hidden rounded-2xl shadow-[0_14px_30px_-18px_rgb(0_0_0/0.55)] transition ${
        loaded ? "bg-blush-100" : "skeleton"
      } ${mode === "locked" ? "opacity-35" : ""} ${selected ? "ring-4 ring-gold-300" : ""}`}
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
          className={`h-full w-full object-cover transition duration-700 ease-[var(--ease-silk)] ${
            mode === "view" ? "group-hover:scale-105" : ""
          } ${selected ? "scale-95" : ""} ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <>
          <video
            src={`${publicUrl(item.storage_path)}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            className={`h-full w-full object-cover transition ${selected ? "scale-95" : ""}`}
          />
          <PlayBadge />
        </>
      )}

      {/* Selection circle on my own photos */}
      {mode === "selectable" && (
        <span
          className={`absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full border-2 transition ${
            selected ? "border-gold-300 bg-gold-400 text-white" : "border-white/90 bg-black/30"
          }`}
        >
          {selected && (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      )}

      {item.guest_name && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/45 to-transparent px-3 pt-7 pb-2 text-left text-sm leading-normal text-white/95">
          {item.guest_name}
        </span>
      )}
    </button>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
