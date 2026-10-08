"use client";

/**
 * Moderation + download dashboard for the couple.
 * - Live: new uploads appear automatically.
 * - Select one or many → delete (removes from storage + every guest's screen).
 * - Download all (or just the selection) as a single .zip of the originals.
 */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import { PlayBadge } from "@/components/UploadPanel";
import { WEDDING } from "@/lib/config";
import { downloadAsZip } from "@/lib/download-zip";
import { kn, khmerDateTime } from "@/lib/khmer";
import { sortNewestFirst, subscribeToMedia } from "@/lib/media-feed";
import { publicUrl } from "@/lib/supabase-browser";
import type { MediaItem } from "@/lib/types";
import { formatBytes } from "@/lib/validation";

type Filter = "all" | "image" | "video";

export function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [download, setDownload] = useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/media", { cache: "no-store" });
    if (res.status === 401) return router.refresh();
    const json = (await res.json().catch(() => ({}))) as { items?: MediaItem[]; error?: string };
    if (!res.ok) setError(json.error ?? "មិនអាចផ្ទុករូបភាពបានទេ។");
    else setItems(json.items ?? []);
    setLoading(false);
  }, [router]);

  // Initial load + live updates.
  useEffect(() => {
    void load();
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToMedia({
        onInsert: (item) =>
          setItems((prev) => (prev.some((p) => p.id === item.id) ? prev : sortNewestFirst([item, ...prev]))),
        onDelete: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      });
    } catch (err) {
      console.error(err);
    }
    return () => unsubscribe?.();
  }, [load]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.media_type === filter)),
    [items, filter],
  );

  const stats = useMemo(() => {
    const photos = items.filter((i) => i.media_type === "image").length;
    const guests = new Set(items.map((i) => i.guest_name?.toLowerCase()).filter(Boolean)).size;
    const bytes = items.reduce((n, i) => n + Number(i.size_bytes), 0);
    return { photos, videos: items.length - photos, guests, bytes };
  }, [items]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteItems(ids: string[]) {
    if (!ids.length) return;
    const ok = window.confirm(
      `លុប ${kn(ids.length)} ជាអចិន្ត្រៃយ៍?\nវានឹងបាត់ពីភ្ញៀវទាំងអស់ ហើយមិនអាចយកមកវិញបានទេ។`,
    );
    if (!ok) return;
    setBusy(true);
    const res = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setBusy(false);
    if (res.status === 401) return router.refresh();
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      return setNotice(json.error ?? "លុបមិនបានសម្រេច។");
    }
    const gone = new Set(ids);
    setItems((prev) => prev.filter((i) => !gone.has(i.id)));
    setSelected(new Set());
    if (openId && gone.has(openId)) setOpenId(null);
    setNotice(`បានលុប ${kn(ids.length)}។`);
  }

  async function downloadItems(list: MediaItem[], label: string) {
    if (!list.length) return;
    try {
      const date = new Date().toISOString().slice(0, 10);
      const result = await downloadAsZip(list, `${WEDDING.archiveName}-${label}-${date}.zip`, (done, total) =>
        setDownload({ done, total }),
      );
      setNotice(result === "saved" ? `បានរក្សាទុកឯកសារ ${kn(list.length)} ក្នុង zip របស់អ្នក ♡` : "បានបោះបង់ការទាញយក។");
    } catch (err) {
      console.error(err);
      setNotice("ការទាញយកបានឈប់ពាក់កណ្តាលផ្លូវ។ សូមព្យាយាមម្តងទៀត ឬទាញយកជាផ្នែកតូចៗ។");
    } finally {
      setDownload(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.refresh();
  }

  const openIndex = openId ? visible.findIndex((i) => i.id === openId) : -1;
  const selectedItems = items.filter((i) => selected.has(i.id));

  return (
    <main className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">ផ្ទាំងគ្រប់គ្រងរបស់គូស្វាមីភរិយា</p>
          <h1 className="mt-1 font-moul text-3xl leading-[1.6]">
            <span className="text-gold">{WEDDING.coupleNames}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <a href="/" className="btn-ghost">មើលទំព័រភ្ញៀវ</a>
          <button type="button" className="btn-ghost" onClick={logout}>ចាកចេញ</button>
        </div>
      </header>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="រូបថត" value={kn(stats.photos)} />
        <Stat label="វីដេអូ" value={kn(stats.videos)} />
        <Stat label="ភ្ញៀវដែលមានឈ្មោះ" value={kn(stats.guests)} />
        <Stat label="ទំហំសរុប" value={formatBytes(stats.bytes)} />
      </section>

      {/* Toolbar */}
      <section className="glass-card sticky top-3 z-30 mt-6 flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <div className="flex rounded-full bg-champagne-100 p-1 text-sm">
          {(["all", "image", "video"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 transition ${filter === f ? "bg-white text-gold-700 shadow-sm" : "text-ink-soft"}`}
            >
              {f === "all" ? "ទាំងអស់" : f === "image" ? "រូបថត" : "វីដេអូ"}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selected.size > 0 ? (
            <>
              <span className="text-sm text-ink-soft">បានជ្រើស {kn(selected.size)}</span>
              <button type="button" className="btn-ghost" onClick={() => setSelected(new Set())}>សម្អាត</button>
              <button type="button" className="btn-ghost" disabled={!!download} onClick={() => downloadItems(selectedItems, "selection")}>
                ទាញយកដែលបានជ្រើស
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => deleteItems([...selected])}
                className="btn-ghost !border-[#d9a69a] !text-[#9a4b3c] hover:!bg-blush-50"
              >
                លុបដែលបានជ្រើស
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-ghost" onClick={() => setSelected(new Set(visible.map((i) => i.id)))} disabled={!visible.length}>
                ជ្រើសទាំងអស់
              </button>
              <button type="button" className="btn-ghost" onClick={() => void load()}>ផ្ទុកឡើងវិញ</button>
              <button type="button" className="btn-gold !px-5 !py-2.5 text-sm" disabled={!items.length || !!download} onClick={() => downloadItems(items, "all")}>
                ទាញយកទាំងអស់ ({kn(items.length)})
              </button>
            </>
          )}
        </div>

        {download && (
          <div className="w-full pt-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-champagne-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-600 transition-[width] duration-300"
                style={{ width: `${(download.done / Math.max(1, download.total)) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              កំពុងវេចខ្ចប់ {kn(download.done)} នៃ {kn(download.total)} — សូមកុំបិទផ្ទាំងនេះ។
            </p>
          </div>
        )}
      </section>

      {notice && (
        <p className="mt-4 rounded-xl bg-white/70 px-4 py-2 text-sm text-ink-soft" role="status" onClick={() => setNotice("")}>
          {notice}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-[#9a4b3c]">{error}</p>}

      {/* Grid */}
      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-16 text-center font-display text-xl text-ink-soft">មិនទាន់មានអ្វីនៅទីនេះទេ។</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <li
                key={item.id}
                className={`overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 transition ${isSelected ? "ring-2 ring-gold-500" : "ring-gold-200/60"}`}
              >
                <div className="relative aspect-square">
                  <button type="button" className="block h-full w-full" onClick={() => setOpenId(item.id)} aria-label="បើក">
                    {item.media_type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={publicUrl(item.thumb_path ?? item.storage_path)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <video src={`${publicUrl(item.storage_path)}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        <PlayBadge />
                      </>
                    )}
                  </button>

                  <label className="absolute top-2 left-2 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-white/90 shadow">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(item.id)}
                      className="h-4 w-4 accent-[var(--color-gold-500)]"
                      aria-label="ជ្រើស"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => deleteItems([item.id])}
                    disabled={busy}
                    aria-label="លុប"
                    className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-[#9a4b3c] shadow transition hover:bg-blush-50"
                  >
                    <TrashIcon />
                  </button>
                </div>

                <div className="space-y-0.5 px-3 py-2 text-xs">
                  <p className="truncate font-medium text-ink">{item.guest_name ?? "ភ្ញៀវអនាមិក"}</p>
                  {item.message && <p className="line-clamp-2 text-ink-soft italic">“{item.message}”</p>}
                  <p className="text-ink-soft/70">
                    {khmerDateTime(item.created_at)} ·{" "}
                    {formatBytes(Number(item.size_bytes))}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {openIndex >= 0 && (
        <Lightbox
          items={visible}
          index={openIndex}
          onIndexChange={(i) => setOpenId(visible[i]?.id ?? null)}
          onClose={() => setOpenId(null)}
          actions={(item) => (
            <button
              type="button"
              onClick={() => deleteItems([item.id])}
              className="rounded-full px-3 py-1.5 text-xs tracking-wide text-[#f1b3a6] ring-1 ring-[#f1b3a6]/50 transition hover:bg-white/10"
            >
              លុប
            </button>
          )}
        />
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass-card rounded-2xl px-4 py-3">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-display text-3xl text-gold-700">{value}</p>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
