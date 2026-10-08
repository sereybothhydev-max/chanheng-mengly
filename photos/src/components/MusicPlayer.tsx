"use client";

/**
 * Background music for the guest page (public/music.mp3).
 *
 * Opening the page, we TRY to start the music straight away. Browsers allow
 * that only sometimes (mostly computers that have visited before); phones
 * block sound until the guest touches the screen. When blocked, a short
 * welcome screen with a "tap to enter" button appears — that one tap opens
 * the site AND starts the song. A small gold button in the corner lets anyone
 * pause or resume it, and that choice is remembered on their phone.
 *
 * Polite touches:
 *  - fades in gently instead of starting loud
 *  - pauses when the guest switches apps / locks the phone, resumes on return
 *  - pauses while a guest video is playing in the lightbox, resumes after
 */
import { useEffect, useRef, useState } from "react";
import { WEDDING } from "@/lib/config";
import { Ornament } from "./Ornament";

const SRC = "/music.mp3";
const TARGET_VOLUME = 0.6;
const OFF_KEY = "wedding-music-off";

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false); // has it ever played?
  const [welcome, setWelcome] = useState<"hidden" | "shown" | "leaving">("hidden");
  const resumeAfter = useRef(false); // paused by us (tab hidden / video), not by the guest

  /** Start (or resume) with a gentle 2-second fade-in. Resolves true if it plays. */
  const play = async (): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;
    if (!audio.paused) return true; // already playing — don't restart the fade
    try {
      audio.volume = 0;
      await audio.play();
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 2000);
        audio.volume = TARGET_VOLUME * k; // (iPhones ignore volume — that's fine)
        if (k < 1 && !audio.paused) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      return true;
    } catch {
      return false; // blocked until a real tap
    }
  };

  function enter() {
    void play();
    setWelcome("leaving");
    setTimeout(() => setWelcome("hidden"), 600);
  }

  // On open: try to autoplay; if the browser blocks it, show the welcome screen.
  // Also start on the first real tap anywhere (click / touchend / key — the
  // events phones count as a "user gesture"; pointerdown on touch does not).
  useEffect(() => {
    let off = false;
    try {
      off = localStorage.getItem(OFF_KEY) === "1";
    } catch {
      /* private mode */
    }
    if (off) return;

    let cancelled = false;
    void play().then((ok) => {
      if (!ok && !cancelled && audioRef.current?.paused) setWelcome("shown");
    });

    const events = ["click", "touchend", "keydown"] as const;
    const onFirstTap = (e: Event) => {
      if (buttonRef.current?.contains(e.target as Node)) return; // the button handles itself
      events.forEach((ev) => window.removeEventListener(ev, onFirstTap, true));
      if (audioRef.current?.paused) void play();
    };
    events.forEach((ev) => window.addEventListener(ev, onFirstTap, true));
    return () => {
      cancelled = true;
      events.forEach((ev) => window.removeEventListener(ev, onFirstTap, true));
    };
  }, []);

  // Pause when the page is hidden; resume when the guest comes back.
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.visibilityState === "hidden" && !audio.paused) {
        resumeAfter.current = true;
        audio.pause();
      } else if (document.visibilityState === "visible" && resumeAfter.current) {
        resumeAfter.current = false;
        void play();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Step aside while a guest's video plays (media events don't bubble, so listen in capture).
  useEffect(() => {
    let watch: ReturnType<typeof setInterval> | undefined;
    const onMediaPlay = (e: Event) => {
      const el = e.target as HTMLMediaElement;
      const audio = audioRef.current;
      if (!audio || el === audio || el.muted) return;
      if (!audio.paused) {
        resumeAfter.current = true;
        audio.pause();
      }
      // Closing the lightbox removes the video without a "pause" event we can
      // hear, so also check once a second whether the video is gone.
      clearInterval(watch);
      watch = setInterval(() => {
        if (el.isConnected && !el.paused) return;
        clearInterval(watch);
        if (resumeAfter.current && document.visibilityState === "visible") {
          resumeAfter.current = false;
          void play();
        }
      }, 1000);
    };
    const onMediaStop = (e: Event) => {
      const el = e.target as HTMLMediaElement;
      if (el === audioRef.current || el.muted) return;
      if (resumeAfter.current) {
        resumeAfter.current = false;
        void play();
      }
    };
    document.addEventListener("play", onMediaPlay, true);
    document.addEventListener("pause", onMediaStop, true);
    document.addEventListener("ended", onMediaStop, true);
    document.addEventListener("emptied", onMediaStop, true); // lightbox closed
    return () => {
      clearInterval(watch);
      document.removeEventListener("play", onMediaPlay, true);
      document.removeEventListener("pause", onMediaStop, true);
      document.removeEventListener("ended", onMediaStop, true);
      document.removeEventListener("emptied", onMediaStop, true);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    resumeAfter.current = false;
    if (audio.paused) {
      void play();
      try {
        localStorage.removeItem(OFF_KEY);
      } catch {}
    } else {
      audio.pause();
      try {
        localStorage.setItem(OFF_KEY, "1");
      } catch {}
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        loop
        preload="auto"
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
          setWelcome((w) => (w === "shown" ? "leaving" : w));
        }}
        onPause={() => setPlaying(false)}
      />

      {/* Welcome screen — only when the browser blocked autoplay. One tap = enter + music. */}
      {welcome !== "hidden" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="សូមស្វាគមន៍"
          onClick={enter}
          className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#140f0b]/70 px-6 text-center backdrop-blur-md transition-opacity duration-500 ${
            welcome === "leaving" ? "pointer-events-none opacity-0" : "animate-fade-in opacity-100"
          }`}
        >
          <p className="eyebrow !text-gold-300">សូមស្វាគមន៍មកកាន់ពិធីមង្គលការរបស់</p>
          <h2 className="mt-3 font-moul text-[1.7rem] leading-[1.6] sm:text-4xl">
            {WEDDING.coupleNames.split(/\s*(?:និង|&)\s*/).map((n, i) => (
              <span key={i} className="block">
                {i > 0 && <span className="block font-sans text-base text-blush-200">និង</span>}
                <span className="text-gold-light">{n}</span>
              </span>
            ))}
          </h2>
          <Ornament className="mx-auto mt-5 h-5 w-44 text-gold-400" />
          <p className="shadow-text mt-3 text-sm text-ivory/85">{WEDDING.dateLabel}</p>
          <button
            type="button"
            autoFocus
            onClick={(e) => {
              e.stopPropagation();
              enter();
            }}
            className="btn-gold mt-8 w-full max-w-xs !py-4 text-[1.05rem]"
          >
            <NoteIcon />
            ចុចដើម្បីចូល
          </button>
        </div>
      )}

      <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 flex items-center gap-2">
        {!started && (
          <span className="shadow-text animate-fade-in rounded-full bg-black/35 px-3 py-1 text-xs text-ivory/90 backdrop-blur-sm">
            ♪ ចុចដើម្បីស្តាប់តន្ត្រី
          </span>
        )}
        <button
          ref={buttonRef}
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? "បិទតន្ត្រី" : "បើកតន្ត្រី"}
          className="grid h-12 w-12 place-items-center rounded-full border border-gold-300/70 bg-[#1d1714]/55 text-gold-200 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)] backdrop-blur-md transition active:scale-95"
        >
          {playing ? <Bars /> : <NoteIcon />}
        </button>
      </div>
    </>
  );
}

/** Three little bars that bounce while music plays. */
function Bars() {
  return (
    <span aria-hidden className="flex h-4 items-end gap-[3px]">
      {[0, 0.25, 0.5].map((d) => (
        <span
          key={d}
          className="w-[3px] origin-bottom animate-music-bar rounded-full bg-current"
          style={{ height: "100%", animationDelay: `${-d}s` }}
        />
      ))}
    </span>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M9 18V6l10-2v12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </svg>
  );
}
