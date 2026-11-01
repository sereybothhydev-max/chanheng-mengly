import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Kantumruy_Pro, Moul } from "next/font/google";
import { WEDDING } from "@/lib/config";
import "./globals.css";

// Khmer typography:
//  - Moul: the traditional Khmer display face seen on wedding invitations (names + big headings)
//  - Kantumruy Pro: clean, modern Khmer for all body text and buttons
//  - Cormorant Garamond: only for the Latin "&" and the hashtag
const moul = Moul({
  subsets: ["khmer"],
  weight: "400",
  variable: "--font-moul-face",
  display: "swap",
});

const sans = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["300", "400", "500"],
  variable: "--font-kantumruy",
  display: "swap",
});

const latin = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${WEDDING.coupleNames} · ចែករំលែករូបថត`,
  description: "ចែករំលែករូបថត និងវីដេអូពីថ្ងៃមង្គលការរបស់យើង — មិនចាំបាច់ដំឡើងកម្មវិធី ឬចុះឈ្មោះទេ។",
  // Keep the wedding out of Google search results.
  robots: { index: false, follow: false },
  // Link preview in Telegram / Messenger / Facebook (public/og.jpg, 1200×630).
  metadataBase: new URL("https://mengly-chanheng-photos.vercel.app"),
  openGraph: {
    type: "website",
    url: "/",
    locale: "km_KH",
    title: "ចែករំលែករូបថត · ម៉េងលី & ច័ន្ទហេង",
    description: "Mengly & Chanheng · ថ្ងៃអាទិត្យ ទី២០ ខែធ្នូ ឆ្នាំ២០២៦ · ស្កេន ឬចុចដើម្បីចែករំលែករូបថត និងវីដេអូ",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "ម៉េងលី & ច័ន្ទហេង" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#2a211b", // matches the dimmed photo at the top of the page
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="km" className={`${moul.variable} ${sans.variable} ${latin.variable}`}>
      <body className="font-sans font-light leading-[1.75] text-ink antialiased">{children}</body>
    </html>
  );
}
