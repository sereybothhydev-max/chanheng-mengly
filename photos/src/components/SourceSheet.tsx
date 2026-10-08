"use client";

/**
 * The little menu that slides up when a guest taps "Upload Photos & Videos":
 *   📷 Take a photo now      → opens the phone camera directly
 *   🎥 Record a video        → opens the camera in video mode
 *   🖼  Choose from album    → photo library, many files at once
 *
 * It's rendered into <body> with a portal so it always covers the whole
 * screen (the frosted upload card would otherwise trap it inside itself).
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type Source = "camera-photo" | "camera-video" | "library";

type Props = {
  open: boolean;
  onPick: (source: Source) => void;
  onClose: () => void;
};

export function SourceSheet({ open, onPick, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Esc closes; lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-[#1d1714]/55 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="ជ្រើសរបៀបបង្ហោះ"
    >
      <div
        className="w-full max-w-md animate-sheet-up rounded-t-[1.75rem] bg-ivory px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-2xl sm:rounded-[1.75rem] sm:pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-gold-200 sm:hidden" />
        <p className="pb-2 text-center text-sm text-ink-soft">តើអ្នកចង់ចែករំលែកដោយរបៀបណា?</p>

        <div className="grid gap-2">
          <Option
            onClick={() => onPick("camera-photo")}
            icon={<CameraIcon />}
            title="ថតរូបឥឡូវនេះ"
            hint="បើកកាមេរ៉ាទូរសព្ទ"
            primary
          />
          <Option
            onClick={() => onPick("camera-video")}
            icon={<VideoIcon />}
            title="ថតវីដេអូ"
            hint="បើកកាមេរ៉ាថតវីដេអូ"
          />
          <Option
            onClick={() => onPick("library")}
            icon={<AlbumIcon />}
            title="ជ្រើសពីអាល់ប៊ុម"
            hint="រូបថត និងវីដេអូដែលមានស្រាប់ · ជ្រើសបានច្រើន"
          />
        </div>

        <button type="button" onClick={onClose} className="btn-ghost mt-3 w-full">
          បោះបង់
        </button>
      </div>
    </div>,
    document.body,
  );
}

function Option(props: { onClick: () => void; icon: React.ReactNode; title: string; hint: string; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition active:scale-[0.98] ${
        props.primary
          ? "bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-[0_10px_24px_-12px_rgb(152_117_60/0.8)]"
          : "border border-gold-200 bg-white text-ink hover:bg-champagne-50"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${props.primary ? "bg-white/20" : "bg-champagne-100 text-gold-600"}`}
      >
        {props.icon}
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{props.title}</span>
        <span className={`block text-xs ${props.primary ? "text-white/85" : "text-ink-soft"}`}>{props.hint}</span>
      </span>
    </button>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-5 w-5",
  "aria-hidden": true,
};

function CameraIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.3l1.4-2h5.6l1.4 2h1.3A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="6" width="13" height="12" rx="2.5" />
      <path d="m16 10.5 5-3v9l-5-3" />
    </svg>
  );
}

function AlbumIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m21 15-5-5-9 9" />
    </svg>
  );
}
