# 💍 Wedding Photo Sharing App

Guests scan a QR code on their table → a beautiful page opens → they tap **Upload Photos & Videos**, pick from their camera roll (or take a new one), optionally add their name and a note, and it appears in a **live gallery** on everyone's phone within seconds. No app, no account.

The couple gets a private **/admin** dashboard to review everything, delete anything inappropriate, and **download all originals as one .zip**.

**Stack:** Next.js 16 (App Router) · Tailwind CSS v4 · Supabase (Postgres + Storage + Realtime) · Vercel

---

## Contents

1. [What's in the box](#1-whats-in-the-box)
2. [How it works (60-second version)](#2-how-it-works)
3. [Set up Supabase](#3-set-up-supabase-10-minutes)
4. [Run it on your computer](#4-run-it-on-your-computer)
5. [Personalise it](#5-personalise-it)
6. [Deploy free on Vercel](#6-deploy-free-on-vercel)
7. [Make the QR code](#7-make-the-qr-code-for-table-cards)
8. [Before the big day — checklist](#8-before-the-big-day--checklist)
9. [After the wedding — downloading everything](#9-after-the-wedding)
10. [Costs & limits (read this!)](#10-costs--limits-read-this)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. What's in the box

```
wedding-photos/
├── supabase/
│   └── schema.sql                 ← paste into Supabase once: table, security, bucket
├── scripts/
│   └── make-qr.mjs                ← `npm run qr -- <url>` → print-ready QR code
├── src/
│   ├── app/
│   │   ├── layout.tsx             ← fonts, page title, "don't index on Google"
│   │   ├── globals.css            ← ✨ Tailwind theme: colours, fonts, animations
│   │   ├── page.tsx               ← guest page (hero + upload + live gallery)
│   │   ├── admin/
│   │   │   └── page.tsx           ← couple's dashboard (password-protected)
│   │   └── api/
│   │       ├── upload/sign/route.ts      ← step 1: validate files, issue upload URLs
│   │       ├── upload/complete/route.ts  ← step 2: verify upload, add to gallery
│   │       ├── admin/session/route.ts    ← admin log in / log out
│   │       └── admin/media/route.ts      ← admin list + delete
│   ├── components/
│   │   ├── GuestApp.tsx           ← glues upload panel + gallery together
│   │   ├── UploadPanel.tsx        ← pick → review → progress ring → thank you
│   │   ├── Gallery.tsx            ← live grid with infinite scroll
│   │   ├── Lightbox.tsx           ← full-screen viewer (swipe / arrow keys)
│   │   ├── Ornament.tsx, Petals.tsx  ← decorative touches
│   │   └── admin/
│   │       ├── AdminLogin.tsx
│   │       └── AdminDashboard.tsx ← stats, filter, select, delete, download zip
│   ├── hooks/
│   │   └── useLiveMedia.ts        ← loads gallery + realtime updates
│   └── lib/
│       ├── config.ts              ← ✏️ EDIT ME: names, date, venue, limits
│       ├── validation.ts          ← file type/size rules (browser + server)
│       ├── upload-client.ts       ← upload with progress, thumbnails, wake lock
│       ├── media-feed.ts          ← gallery queries + realtime subscription
│       ├── download-zip.ts        ← "download all" zip builder
│       ├── admin-auth.ts          ← signed session cookie
│       ├── supabase-browser.ts    ← public client (read-only)
│       ├── supabase-admin.ts      ← secret client (server only)
│       └── types.ts
├── .env.example                   ← copy to .env.local and fill in
├── next.config.ts · postcss.config.mjs · tsconfig.json · package.json
└── README.md
```

---

## 2. How it works

```
 Guest's phone                       Your Next.js server (Vercel)         Supabase
 ─────────────                       ────────────────────────────         ────────
 picks 8 photos
 makes small previews ───POST /api/upload/sign──▶ checks type & size ──▶ creates 1-time
                                                   picks safe file names     upload URLs
                      ◀──────────── signed URLs ────────────────────────────┘
 uploads bytes DIRECTLY to Supabase Storage (progress ring) ──────────────▶ bucket enforces
                                                                             50 MB + file types
 ───────POST /api/upload/complete──▶ confirms files exist, reads real size ─▶ inserts row
                                                                              │ Realtime
 every open phone ◀─────────────────── new photo appears in gallery ◀─────────┘
```

**Why this design (security in plain English):**
- Guests can **only read** the gallery. Row Level Security blocks them from inserting, editing or deleting rows.
- Guests never get a key that can write to storage. Our server gives out **one-time upload URLs**, each for one exact file name it chose.
- Supabase itself rejects files over the size limit or of the wrong type — even if someone bypasses the website.
- Files travel phone → Supabase directly, so big videos don't hit Vercel's 4.5 MB request limit.
- The secret key and admin password live only on the server.

---

## 3. Set up Supabase (10 minutes)

1. Go to **[supabase.com](https://supabase.com)** → sign up → **New project**.
   - Name: `wedding-photos`. Pick a strong database password (save it somewhere; you won't need it day to day).
   - **Region:** choose the one closest to where the wedding is (e.g. *Southeast Asia (Singapore)* for Cambodia/Thailand). Uploads will be faster.
2. Wait ~2 minutes for it to finish setting up.
3. Left sidebar → **SQL Editor** → **New query**. Open `supabase/schema.sql` from this project, copy **all** of it, paste, and click **Run**. You should see *"Success. No rows returned."*

   This one script:
   - creates the `media` table,
   - turns on Row Level Security with a **read-only** policy for guests,
   - enables Realtime on the table,
   - creates a public `wedding-media` bucket with a 50 MB limit and only photo/video types allowed.

4. Check it worked:
   - **Table Editor** → you see a `media` table.
   - **Storage** → you see a `wedding-media` bucket marked *Public*.
   - **Database → Publications** → `supabase_realtime` lists `media`.
5. Get your keys: **Project Settings → API Keys** (or **Settings → API**). You need three values:

   | `.env` name | Where to find it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL, like `https://abcd1234.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Publishable** key (`sb_publishable_…`) — or the legacy **anon** key |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Secret** key (`sb_secret_…`) — or the legacy **service_role** key. ⚠️ Never share this. |

> **About "RLS policies for anonymous uploads":** you'll notice the script adds **no** storage insert policy for anonymous users — that's on purpose. Signed upload URLs don't need one, and leaving it out means nobody can upload except through your validated API. The script includes a commented-out alternative policy if you ever want direct uploads, with an explanation of why it's less safe.

---

## 4. Run it on your computer

You need **Node.js 20 or newer** ([nodejs.org](https://nodejs.org) → LTS). Check with `node -v`.

```bash
# 1. open a terminal in the project folder, then:
npm install

# 2. create your secrets file
cp .env.example .env.local          # on Windows: copy .env.example .env.local
#    → open .env.local and paste in your 3 Supabase values + an ADMIN_PASSWORD

# 3. start it
npm run dev
```

Open **http://localhost:3000** — upload a photo and watch it appear. Open **http://localhost:3000/admin** and log in with your `ADMIN_PASSWORD`.

**Test on your phone before deploying:** your phone must be on the same Wi-Fi. Run `npm run dev -- -H 0.0.0.0`, find your computer's local IP (e.g. `192.168.1.20`), and open `http://192.168.1.20:3000`. (Camera-roll uploads work; a few browser features like the wake-lock need HTTPS, which you'll have once deployed.)

---

## 5. Personalise it

**Words** — edit `src/lib/config.ts`:

```ts
export const WEDDING = {
  coupleNames: "ហ៊ី ម៉េងលី និង សុខ ច័ន្ទហេង", // split on "និង" into two lines
  dateLabel: "ថ្ងៃអាទិត្យ ទី២០ ខែធ្នូ ឆ្នាំ២០២៦",
  venue: "សួនចម្ការចាស់",
  hashtag: "#MenglyAndChanheng",
  welcome: "សូមជួយយើងមើលថ្ងៃពិសេសនេះ…",
  archiveName: "mengly-and-chanheng-wedding",
};
```

**Colours, fonts, animations** — Tailwind v4 is configured in CSS, inside the `@theme` block at the top of `src/app/globals.css` (there's no `tailwind.config.js` anymore). Change a hex value and every button, border and heading using it updates:

```css
@theme {
  --color-gold-500: #b8924f;   /* → bg-gold-500, text-gold-500, border-gold-500 … */
  --color-blush-400: #dc9483;
  --animate-fade-up: fade-up 0.9s var(--ease-silk) both;   /* → animate-fade-up */
}
```

Reusable styles defined with `@utility` in the same file: `btn-gold`, `btn-ghost`, `glass-card`, `field`, `text-gold` (foil text), `skeleton`, `eyebrow`.

**Language:** the whole site is in **Khmer (ភាសាខ្មែរ)**. Every guest-facing word lives in the components and `src/lib/config.ts`; numbers are shown in Khmer digits via `src/lib/khmer.ts` (`kn(12)` → `១២`).

Fonts are set in `src/app/layout.tsx`: **Moul** (the traditional Khmer display face from wedding invitations) for the couple's names and big headings, **Kantumruy Pro** for all other Khmer text, and Cormorant Garamond only for the Latin "&" and hashtag. Khmer needs taller line spacing than English and must never use letter-spacing or uppercase, which is why the `eyebrow` labels use size and colour instead.

**Background photo** — the guest page uses `public/background.jpg`, dimmed with a dark overlay. Replace that file with any photo (landscape, ~1800 px wide, under 500 KB is ideal). To change how dark it is, edit the `.photo-backdrop` numbers in `src/app/globals.css`. The admin dashboard keeps the plain ivory background.

**Music** — the guest page plays `public/music.mp3` on a loop. Browsers don't allow sound to start by itself, so it fades in on the guest's first tap; the gold ♪ button in the corner pauses/resumes it (and remembers that choice). It pauses automatically while a guest video plays or when the phone is locked. To change the song, replace `public/music.mp3` (keep it under ~5 MB so it loads quickly on mobile data). To remove music entirely, delete the `<MusicPlayer />` line in `src/app/page.tsx`.

**Limits** — also in `src/lib/config.ts` (`UPLOAD_LIMITS`): files per batch (currently **50**), max photo/video size, name/message length.

---

## 6. Deploy free on Vercel

1. **The code is already on GitHub** — it lives in the `photos/` folder of
   [`sereybothhydev-max/chanheng-mengly`](https://github.com/sereybothhydev-max/chanheng-mengly),
   right next to your e-invitation. (`.gitignore` keeps `.env.local` — your secrets — out of GitHub.)

2. **Import into Vercel as a second project**
   - Go to [vercel.com](https://vercel.com) → **Add New… → Project** → pick `chanheng-mengly` → **Import**.
     (Importing the same repo again is fine — it becomes a separate project; your invitation project isn't touched.)
   - Next to **Root Directory**, click **Edit** and choose **`photos`**. ← this is the important step
   - Framework preset should then say **Next.js** automatically. Leave the build settings as they are.
   - Give the project a name like `mengly-chanheng-photos`.

3. **Add your environment variables** (on the same screen, under *Environment Variables*) — the same four from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`

4. Click **Deploy**. About a minute later you get a URL like `https://mengly-chanheng-photos.vercel.app`. 🎉

5. **Nicer address (optional):**
   - Free: Vercel → Project → **Settings → Domains** → change it to something like `mengly-and-chanheng.vercel.app` if available.
   - Custom domain (~$10/yr, e.g. `menglyandchanheng.com`): buy it anywhere, add it in **Settings → Domains**, and follow Vercel's DNS instructions.

6. **Updating later:** change code in `photos/` → `git commit` → `git push`. Vercel redeploys the photo site automatically. Changed an environment variable? Go to **Deployments → ⋯ → Redeploy**.

---

## 7. Make the QR code for table cards

Decide your **final** URL first (step 6.5) — a QR code can't be changed after printing.

**Option A — built-in script (recommended, no ads, never expires):**

```bash
npm run qr -- https://mengly-and-chanheng.vercel.app
```

This creates `qr/qr-code.png` (2000×2000, print quality) and `qr/qr-code.svg` (vector for Canva/print shops). It uses the highest error-correction level, so it still scans with a smudge or a small logo in the centre.

**Option B — a website:** any free *static* QR generator works. Avoid "dynamic QR" services — many expire or show ads after a free trial, which would break your printed cards.

**Designing the card (Canva works great):**
- Print the QR **at least 3 × 3 cm** (bigger for tall centrepieces), dark on a light background, and keep the white border around it.
- Add a short line, e.g. *"ស្កេនដើម្បីចែករំលែករូបថត និងវីដេអូជាមួយយើង ♡ — មិនចាំបាច់ដំឡើងកម្មវិធី"* plus the URL in small text as a backup.
- Matte paper beats glossy (less glare under venue lights).
- **Test the printed proof** with an iPhone and an Android, in dim light, before printing the full run.

Ideas: table cards, a framed sign at the entrance, the back of the menu, a slide on the venue screen, and a WhatsApp/Telegram message with the link the morning after for anyone who missed it.

---

## 8. Before the big day — checklist

- [ ] Personalised `config.ts` and redeployed
- [ ] Uploaded test photos **and** a video from both an iPhone and an Android over **mobile data**, not Wi-Fi
- [ ] Opened the site on two phones and watched an upload appear live on the other
- [ ] Logged into `/admin`, deleted the test uploads
- [ ] Tested "Download all" on a laptop
- [ ] Checked storage plan vs. guest count (see §10) — upgraded if needed
- [ ] Opened the site within the last few days so a Free Supabase project isn't paused
- [ ] Printed QR cards and scanned a printed one
- [ ] Asked the venue whether guest Wi-Fi exists — if so, put the network name/password on the card too

---

## 9. After the wedding

1. Open `/admin` on a **laptop** using **Chrome or Edge**.
2. Click **Download all**. Chrome/Edge will ask where to save the `.zip`, then write it straight to disk as it goes — this handles many GB without running out of memory. (Safari/Firefox build the zip in memory, fine for smaller collections; for large ones use Chrome.)
3. Files are organised as `photos/` and `videos/`, named `date_time_GuestName_0001.jpg`, oldest first — and they're the **original, full-resolution files** guests uploaded.
4. Keep the zip in **two** places (e.g. an external drive + Google Drive/iCloud).
5. You can also select specific items and use **Download selected**.

---

## 10. Costs & limits (read this!)

| | Free | Paid |
|---|---|---|
| **Vercel** (Hobby) | Free for personal, non-commercial sites — fine here | — |
| **Supabase storage** | **1 GB total** | **Pro, $25/month → 100 GB** |
| **Max size of one file** | 50 MB | Raise up to many GB on Pro |
| **Inactivity** | Project pauses after 7 days without activity | Never pauses |

**Be realistic about 1 GB.** One phone photo is ~2–5 MB and one minute of 1080p video is ~100 MB+. A wedding with 80 guests easily produces 5–20 GB. Free is perfect for building and testing; for the actual wedding:

1. Upgrade the Supabase project to **Pro** a few days before the wedding.
2. Raise video limits if you want longer clips: in `src/lib/config.ts` set `maxVideoBytes` (e.g. `500 * 1024 * 1024`), and in the Supabase SQL editor run:
   ```sql
   update storage.buckets set file_size_limit = 524288000 where id = 'wedding-media';
   ```
   (and raise the global limit under **Storage → Settings** if needed). Redeploy.
3. After you've downloaded and backed everything up (§9), you can downgrade — **but downgrading to Free with more than 1 GB stored isn't allowed**, so download first, then delete or move files before downgrading.

Pricing changes over time — check [supabase.com/pricing](https://supabase.com/pricing) when you plan.

**Optional hardening** for a public link: anyone who has the URL can upload. That's normal for wedding apps and the admin can delete anything, but if you want an extra lock, add a short access code to the QR URL (e.g. `?k=love2026`) and have `/api/upload/sign` reject requests without it. You can also turn on Vercel's **Firewall → Rate limiting** rule for `/api/upload/*`.

---

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| "Missing NEXT_PUBLIC_SUPABASE_URL…" | `.env.local` is missing or misnamed (locally), or env vars weren't added in Vercel. Redeploy after adding them. |
| Gallery says "couldn't load" | Did `schema.sql` run fully? Is the Supabase project paused (Dashboard shows *Restore*)? |
| Uploads fail with "mime type not supported" | The file type isn't in the bucket's allowed list. Check §3 step 4. |
| Uploads fail with "payload too large" | File exceeds the bucket's `file_size_limit` — see §10. |
| New photos don't appear live on other phones | Check `supabase_realtime` includes `media` (Database → Publications). Phones that were locked catch up when reopened. |
| An iPhone photo shows as blank on an Android/PC | It's an untranslated HEIC file (rare — iPhones usually convert to JPEG on upload). The original is safe and will open on Apple devices and in the downloaded zip. |
| Forgot the admin password | Change `ADMIN_PASSWORD` in Vercel → Redeploy. All old sessions are logged out automatically. |
| Vercel build fails | Run `npm run build` locally to see the exact error. Make sure Node 20+. |

---

Made with ♡ — congratulations to you both!
