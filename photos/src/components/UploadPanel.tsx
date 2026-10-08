"use client";

/**
 * The guest upload card.
 *
 * Flow:  idle → review (pick files, add an optional message) → uploading → done
 *
 * Upload pipeline for each batch:
 *   1. Make small preview thumbnails in the browser (fast gallery loading)
 *   2. POST /api/upload/sign      → server validates + returns signed URLs
 *   3. PUT each file to Supabase  → with live progress, 3 at a time
 *   4. POST /api/upload/complete  → server verifies + adds to gallery
 */
import { useEffect, useRef, useState } from "react";
import { UPLOAD_LIMITS } from "@/lib/config";
import type { MediaItem, SignedUpload } from "@/lib/types";
import { makeImageThumbnail, putWithProgress, requestWakeLock, runPool } from "@/lib/upload-client";
import { kn } from "@/lib/khmer";
import { rememberMyUploads } from "@/lib/my-uploads";
import { SourceSheet, type Source } from "./SourceSheet";
import { formatBytes, validateFile, type MediaKind } from "@/lib/validation";

type Selected = {
  key: string;
  file: File;
  mime: string;
  kind: MediaKind;
  previewUrl: string;
};

type Phase = "idle" | "review" | "uploading" | "done";

let keyCounter = 0;

export function UploadPanel({ onUploaded }: { onUploaded: (items: MediaItem[]) => void }) {
  // Three hidden file inputs, one per choice in the "how do you want to share?" menu.
  const cameraPhotoRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  /** Small JPEG previews (≈640px), made once when photos are picked. Reused as
      the gallery thumbnail at upload time. Keeps phones from running out of
      memory when showing up to 50 full-size photos. null = couldn't make one. */
  const thumbCache = useRef(new Map<string, Blob | null>());
  const [phase, setPhase] = useState<Phase>("idle");
  const [selected, setSelected] = useState<Selected[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0); // 0 → 1
  const [statusText, setStatusText] = useState("");
  const [sharedCount, setSharedCount] = useState(0);

  // Free preview memory when the component goes away.
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => () => selectedRef.current.forEach((s) => URL.revokeObjectURL(s.previewUrl)), []);

  // Warn before closing the tab mid-upload.
  useEffect(() => {
    if (phase !== "uploading") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  /** Every "upload" / "+" / "share more" button opens the choice menu. */
  const openPicker = () => setSheetOpen(true);

  /** Must run inside the tap itself — phones only open the camera from a real user gesture. */
  function pickSource(source: Source) {
    const ref = source === "camera-photo" ? cameraPhotoRef : source === "camera-video" ? cameraVideoRef : libraryRef;
    ref.current?.click();
    setSheetOpen(false);
  }

  function handleFiles(input: HTMLInputElement) {
    const list = input.files;
    if (!list?.length) return;
    const room = UPLOAD_LIMITS.maxFilesPerBatch - selected.length;
    const incoming = Array.from(list);
    const added: Selected[] = [];
    const problems: string[] = [];

    for (const file of incoming.slice(0, Math.max(0, room))) {
      const check = validateFile(file);
      if (!check.ok) {
        problems.push(check.error);
        continue;
      }
      const needsThumb = check.kind === "image" && check.mime !== "image/gif";
      added.push({
        key: `f${++keyCounter}`,
        file,
        mime: check.mime,
        kind: check.kind,
        // Photos get a tiny preview shortly (see makePreviews); videos and GIFs use the file itself.
        previewUrl: needsThumb ? "" : URL.createObjectURL(file),
      });
    }
    if (incoming.length > room) {
      problems.push(
        `អាចចែករំលែកបានអតិបរមា ${kn(UPLOAD_LIMITS.maxFilesPerBatch)} ក្នុងមួយលើក — សូមផ្ញើដែលនៅសល់នៅលើកក្រោយ។`,
      );
    }

    setSelected((prev) => [...prev, ...added]);
    setErrors(problems);
    void makePreviews(added.filter((s) => s.previewUrl === ""));
    if (added.length || selected.length) setPhase("review");
    input.value = ""; // lets the same file be picked again
  }

  /** Two at a time, so the phone only ever decodes a couple of big photos at once. */
  async function makePreviews(items: Selected[]) {
    await runPool(items, 2, async (s) => {
      const thumb = await makeImageThumbnail(s.file);
      thumbCache.current.set(s.key, thumb);
      const url = URL.createObjectURL(thumb ?? s.file);
      setSelected((prev) => {
        if (!prev.some((p) => p.key === s.key)) {
          URL.revokeObjectURL(url); // removed while we were working
          return prev;
        }
        return prev.map((p) => (p.key === s.key ? { ...p, previewUrl: url } : p));
      });
    });
  }

  function removeOne(key: string) {
    setSelected((prev) => {
      const target = prev.find((s) => s.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((s) => s.key !== key);
      if (next.length === 0) setPhase("idle");
      return next;
    });
  }

  async function startUpload() {
    const batch = selected;
    if (!batch.length) return;

    setPhase("uploading");
    setErrors([]);
    setProgress(0);
    const wakeLock = await requestWakeLock();
    const problems: string[] = [];
    const failed = new Set<string>();

    try {
      // 1 ── thumbnails (skip GIFs so they stay animated)
      setStatusText("កំពុងរៀបចំអនុស្សាវរីយ៍របស់អ្នក…");
      const thumbs = new Map<string, Blob>();
      await runPool(
        batch.filter((s) => s.kind === "image" && s.mime !== "image/gif"),
        2,
        async (s) => {
          // Reuse the preview made at selection time; only make one if it isn't ready yet.
          const cached = thumbCache.current.get(s.key);
          const thumb = cached !== undefined ? cached : await makeImageThumbnail(s.file);
          if (thumb) thumbs.set(s.key, thumb);
        },
      );

      // 2 ── ask the server for signed upload URLs
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: batch.map((s) => ({
            name: s.file.name,
            type: s.mime,
            size: s.file.size,
            wantsThumb: thumbs.has(s.key),
          })),
        }),
      });
      const signJson = (await signRes.json().catch(() => ({}))) as { uploads?: SignedUpload[]; error?: string };
      if (!signRes.ok || !signJson.uploads) throw new Error(signJson.error ?? "មិនអាចចាប់ផ្តើមបង្ហោះបានទេ។");
      const uploads = signJson.uploads;

      // 3 ── upload the bytes, 3 files at a time
      const totalBytes = batch.reduce((n, s) => n + s.file.size + (thumbs.get(s.key)?.size ?? 0), 0) || 1;
      const loaded = new Array<number>(batch.length).fill(0);
      const thumbLoaded = new Array<number>(batch.length).fill(0);
      const refresh = () =>
        setProgress(Math.min(0.97, (sum(loaded) + sum(thumbLoaded)) / totalBytes));

      const succeeded: { path: string; thumbPath: string | null }[] = [];
      let finished = 0;
      setStatusText(`កំពុងបង្ហោះ ០ នៃ ${kn(batch.length)}`);

      await runPool(batch, 3, async (s, i) => {
        const target = uploads[i];
        try {
          let thumbPath: string | null = null;
          const thumb = thumbs.get(s.key);
          if (thumb && target.thumbSignedUrl && target.thumbPath) {
            try {
              await putWithProgress(target.thumbSignedUrl, thumb, "image/jpeg", (b) => {
                thumbLoaded[i] = b;
                refresh();
              });
              thumbPath = target.thumbPath;
            } catch {
              thumbLoaded[i] = thumb.size; // a thumbnail is optional — carry on
            }
          }
          await putWithProgress(target.signedUrl, s.file, target.mime, (b) => {
            loaded[i] = b;
            refresh();
          });
          succeeded.push({ path: target.path, thumbPath });
        } catch (err) {
          failed.add(s.key);
          problems.push(`${s.file.name}: ${(err as Error).message}`);
        } finally {
          finished++;
          setStatusText(`កំពុងបង្ហោះ ${kn(finished)} នៃ ${kn(batch.length)}`);
        }
      });

      // 4 ── tell the server which files made it
      if (succeeded.length) {
        setStatusText("កំពុងបន្ថែមទៅវិចិត្រសាល…");
        const res = await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: succeeded, message }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          items?: MediaItem[];
          tokens?: Record<string, string>;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "មិនអាចបន្ថែមឯកសាររបស់អ្នកទៅវិចិត្រសាលបានទេ។");
        if (json.tokens) rememberMyUploads(json.tokens); // lets this phone delete them later
        onUploaded(json.items ?? []);
      }

      setProgress(1);
      batch.filter((s) => !failed.has(s.key)).forEach((s) => URL.revokeObjectURL(s.previewUrl));
      const remaining = batch.filter((s) => failed.has(s.key));
      setSelected(remaining);
      setSharedCount(succeeded.length);
      setErrors(
        remaining.length
          ? [`បានចែករំលែក ${kn(succeeded.length)}, បរាជ័យ ${kn(remaining.length)} — ចុច «ចែករំលែក» ដើម្បីព្យាយាមម្តងទៀត។`, ...problems]
          : [],
      );
      if (remaining.length === 0) {
        setMessage("");
        thumbCache.current.clear();
      }
      setPhase(remaining.length ? "review" : "done");
    } catch (err) {
      setErrors([(err as Error).message || "មានបញ្ហាកើតឡើង — សូមព្យាយាមម្តងទៀត។"]);
      setPhase("review");
    } finally {
      void wakeLock?.release().catch(() => {});
    }
  }

  const totalSize = selected.reduce((n, s) => n + s.file.size, 0);

  return (
    <div className="frame-card relative animate-fade-up rounded-[2.25rem] p-6 sm:p-10" style={{ animationDelay: "480ms" }}>
      {/* Hidden native pickers.
          capture="environment" tells phones to open the BACK camera directly
          (on a laptop it's ignored and a normal file picker opens instead). */}
      <input
        ref={cameraPhotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.currentTarget)}
      />
      <input
        ref={cameraVideoRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.currentTarget)}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.currentTarget)}
      />
      <SourceSheet open={sheetOpen} onPick={pickSource} onClose={() => setSheetOpen(false)} />

      {phase === "idle" && (
        <div className="flex flex-col items-center py-4 text-center">
          {/* Hand-drawn camera: the line art (public/camera-lines.webp) is used as a
              mask over a moving gold gradient, so it shimmers; the flowers
              (public/camera-flowers.webp) sit on top in their own colours. */}
          <div aria-hidden className="camera-art w-[min(15rem,70%)] sm:w-[17rem]">
            <span className="camera-art-shadow">
              <i />
            </span>
            <span className="camera-art-lines" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/camera-flowers.webp" width={640} height={444} alt="" className="camera-art-flowers" />
          </div>
          <h2 className="mt-4 font-display text-[1.85rem] font-normal leading-normal">ចែករំលែកអនុស្សាវរីយ៍របស់អ្នក</h2>
          <p className="mt-2 max-w-xs text-sm text-ivory/85">
            មិនចាំបាច់ដំឡើងកម្មវិធី ឬចុះឈ្មោះទេ។ ជ្រើសរើសរូបថត និងវីដេអូបានច្រើនតាមចិត្ត។
          </p>
          <button type="button" onClick={openPicker} className="btn-gold mt-7 w-full max-w-sm !py-[1.15rem] text-[1.05rem]">
            <UploadIcon className="h-5 w-5" />
            បង្ហោះរូបថត និងវីដេអូ
          </button>
          <p className="mt-3 text-xs text-ivory/65">
            អតិបរមា {kn(UPLOAD_LIMITS.maxFilesPerBatch)} ក្នុងមួយលើក · រូបថត {formatBytes(UPLOAD_LIMITS.maxImageBytes)} ·
            វីដេអូ {formatBytes(UPLOAD_LIMITS.maxVideoBytes)}
          </p>
        </div>
      )}

      {phase === "review" && (
        <div className="animate-fade-in">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl leading-normal">
              អនុស្សាវរីយ៍ {kn(selected.length)} រួចរាល់
            </h2>
            <span className="text-xs text-ivory/70">{formatBytes(totalSize)}</span>
          </div>

          {/* Selected file previews */}
          <ul className="mt-4 grid max-h-[22rem] grid-cols-4 gap-2 overflow-y-auto overscroll-contain sm:grid-cols-6">
            {selected.map((s) => (
              <li key={s.key} className="group relative aspect-square overflow-hidden rounded-xl bg-blush-100">
                {s.kind === "image" ? (
                  s.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.previewUrl} alt="" decoding="async" className="h-full w-full animate-fade-in object-cover" />
                  ) : (
                    <div className="skeleton h-full w-full" />
                  )
                ) : (
                  <video src={`${s.previewUrl}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                )}
                {s.kind === "video" && <PlayBadge />}
                <button
                  type="button"
                  onClick={() => removeOne(s.key)}
                  aria-label={`ដកចេញ ${s.file.name}`}
                  className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {selected.length < UPLOAD_LIMITS.maxFilesPerBatch && (
              <li>
                <button
                  type="button"
                  onClick={openPicker}
                  className="grid aspect-square w-full place-items-center rounded-xl border border-dashed border-gold-300 text-gold-300 transition hover:bg-white/10"
                  aria-label="បន្ថែមទៀត"
                >
                  <PlusIcon className="h-6 w-6" />
                </button>
              </li>
            )}
          </ul>

          {/* Optional message for the couple */}
          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="eyebrow">សារជូនគូស្វាមីភរិយា · មិនបង្ខំ</span>
              <textarea
                className="field mt-1.5 min-h-[84px] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={UPLOAD_LIMITS.maxMessageLength}
                placeholder="សូមជូនពរឲ្យមានក្តីស្រឡាញ់អស់មួយជីវិត…"
              />
              <span className="mt-1 block text-right text-[0.7rem] text-ivory/55">
                {kn(message.length)}/{kn(UPLOAD_LIMITS.maxMessageLength)}
              </span>
            </label>
          </div>

          <ErrorList errors={errors} />

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                selected.forEach((s) => URL.revokeObjectURL(s.previewUrl));
                setSelected([]);
                setErrors([]);
                setPhase("idle");
              }}
            >
              បោះបង់
            </button>
            <button type="button" className="btn-gold flex-1" onClick={startUpload} disabled={!selected.length}>
              <HeartIcon className="h-4 w-4" />
              ចែករំលែក{selected.length > 1 ? `ទាំង ${kn(selected.length)}` : ""}
            </button>
          </div>
        </div>
      )}

      {phase === "uploading" && (
        <div className="flex animate-fade-in flex-col items-center py-6 text-center" aria-live="polite">
          <ProgressRing value={progress} />
          <p className="mt-5 font-display text-xl">{statusText}</p>
          <p className="mt-1 text-sm text-ivory/80">សូមកុំបិទទំព័រនេះ ♡</p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex animate-fade-in flex-col items-center py-6 text-center" aria-live="polite">
          <div className="animate-heart-pop">
            <HeartIcon className="h-16 w-16 text-blush-400" filled />
          </div>
          <h2 className="mt-4 font-moul text-3xl leading-normal">អរគុណ!</h2>
          <p className="mt-1 text-ivory/85">
            បានបន្ថែមអនុស្សាវរីយ៍ {kn(sharedCount)} ទៅវិចិត្រសាលហើយ។
          </p>
          <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
            <button type="button" className="btn-gold" onClick={openPicker}>
              ចែករំលែកបន្ថែម
            </button>
            <a href="#gallery" className="btn-ghost">
              មើលវិចិត្រសាល
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small presentational helpers ───────────────────────────────────────── */

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

function ErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <ul className="mt-4 space-y-1 rounded-2xl bg-blush-50 px-4 py-3 text-sm text-[#9a4b3c] [text-shadow:none]" role="alert">
      {errors.map((e, i) => (
        <li key={i}>{e}</li>
      ))}
    </ul>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-gold-300)" />
            <stop offset="100%" stopColor="var(--color-gold-600)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="6" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ring-gold)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          style={{ transition: "stroke-dashoffset 0.4s var(--ease-silk)" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-3xl text-gold-300">
        {kn(Math.round(value * 100))}%
      </span>
    </div>
  );
}

export function PlayBadge() {
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/85 shadow">
        <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-gold-600" aria-hidden>
          <path d="M8 5.5v13l11-6.5-11-6.5Z" />
        </svg>
      </span>
    </span>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path
        d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

