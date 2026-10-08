/**
 * The guest page — what opens when someone scans the QR code.
 * The hero is static (server-rendered = instant), the upload panel and live
 * gallery are interactive client components inside <GuestApp />.
 */
import { GuestApp } from "@/components/GuestApp";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Ornament } from "@/components/Ornament";
import { Petals } from "@/components/Petals";
import { WEDDING } from "@/lib/config";

export default function HomePage() {
  // Split the two names on "និង" (or "&") so each sits on its own line.
  const [first, second] = WEDDING.coupleNames.split(/\s*(?:និង|&)\s*/).map((s) => s.trim());

  return (
    <main className="relative min-h-dvh overflow-x-clip pb-16">
      {/* The couple's photo, dimmed (see .photo-backdrop in globals.css) + drifting petals */}
      <div aria-hidden className="photo-backdrop" />
      <Petals />
      {/* Background music (public/music.mp3) — starts on the first tap */}
      <MusicPlayer />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="mx-auto max-w-xl px-6 pt-14 text-center sm:pt-20">
        <p className="eyebrow animate-fade-up !text-gold-300">សូមស្វាគមន៍មកកាន់ពិធីមង្គលការរបស់</p>

        <h1
          className="mt-4 animate-fade-up font-moul text-[1.9rem] leading-[1.6] sm:text-5xl"
          style={{ animationDelay: "120ms" }}
        >
          <span className="text-gold-light block animate-gold-sheen">{first}</span>
          {second && (
            <>
              <span className="block font-sans text-base font-normal leading-[1.6] text-blush-200 sm:text-xl">និង</span>
              <span className="text-gold-light block animate-gold-sheen">{second}</span>
            </>
          )}
        </h1>

        <div className="animate-fade-up" style={{ animationDelay: "260ms" }}>
          <Ornament className="mx-auto mt-6 h-5 w-48 text-gold-400" />
          <p className="shadow-text mt-4 text-[0.95rem] text-ivory/90">{WEDDING.dateLabel}</p>
          <p className="shadow-text font-display text-base text-ivory/85">{WEDDING.venue}</p>
        </div>

        <p
          className="shadow-text mx-auto mt-6 max-w-md animate-fade-up text-[0.98rem] leading-relaxed text-ivory/88"
          style={{ animationDelay: "380ms" }}
        >
          {WEDDING.welcome}
        </p>
      </header>

      <GuestApp />

      <footer className="mt-16 text-center">
        <Ornament className="mx-auto h-4 w-32 text-gold-300" />
        <p className="mt-3 font-latin text-lg text-gold-300 italic">{WEDDING.hashtag}</p>
        <p className="mt-1 text-sm text-ivory/70">ដោយក្តីស្រឡាញ់ និងការដឹងគុណ ♡</p>
      </footer>
    </main>
  );
}
