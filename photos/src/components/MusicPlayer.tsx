"use client";

/**
 * Background music for the guest page (public/music.mp3).
 *
 * Phones and browsers never allow sound to start by itself, so the song
 * starts softly on the guest's FIRST tap anywhere on the page. A small gold
 * button in the corner lets anyone pause or resume it, and that choice is
 * remembered on their phone.
 *
 * Polite touches:
 *  - fades in gently instead of starting loud
 *  - pauses when the guest switches apps / locks the phone, resumes on return
 *  - pauses while a guest video is playing in the lightbox, resumes after
 */
import { useEffect, useRef, useState } from "react";

const SRC = "/music.mp3";
const TARGET_VOLUME = 0.6;
const OFF_KEY = "wedding-music-off";

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false); // has it ever played?
  const resumeAfter = useRef(false); // paused by us (tab hidden / video), not by the guest

  /** Start (or resume) with a gentle 2-second fade-in. */
  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;
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
    } catch {
      /* blocked until a real tap — the button still works */
    }
  };

  // First tap anywhere starts the music — unless this guest turned it off before.
  useEffect(() => {
    let off = false;
    try {
      off = localStorage.getItem(OFF_KEY) === "1";
    } catch {
      /* private mode */
    }
    if (off) return;

    const onFirstTap = (e: Event) => {
      if (buttonRef.current?.contains(e.target as Node)) return; // the button handles itself
      window.removeEventListener("pointerdown", onFirstTap, true);
      window.removeEventListener("keydown", onFirstTap, true);
      void play();
    };
    window.addEventListener("pointerdown", onFirstTap, true);
    window.addEventListener("keydown", onFirstTap, true);
    return () => {
      window.removeEventListener("pointerdown", onFirstTap, true);
      window.removeEventListener("keydown", onFirstTap, true);
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
        preload="none"
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
        }}
        onPause={() => setPlaying(false)}
      />

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
