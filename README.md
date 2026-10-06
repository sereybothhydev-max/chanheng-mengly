# Chanheng & Mengly · e-invitation

Vite static site. Khmer first, English switch.

## Edit
- **All wedding details:** `src/data/wedding.js` (names, parents, date, programme, venue + map coordinates, gift QR, music)
- **All text (Khmer + English):** `src/data/i18n.js`

## Photos
Put originals in `photos-src/` (not committed), then:

```bash
npm run photos   # → public/photos/*-{640,1280,2000}.webp (EXIF/GPS stripped) + src/data/gallery.json
npm run og       # → public/og.jpg link preview (dev server must be running)
```

## Develop / build
```bash
npm install
npm run dev
npm run build    # → dist/
npm run qa       # Playwright screenshots at 320×568, 390×844, 740×360, 1280×800 (dev server running)
```

`?open` skips the envelope (handy for testing). `?fx` forces the desktop WebGL layer.

Set `VITE_SITE_URL` (in `.env`) to the live URL so `og:image` is absolute.

Design inspired by Someth Phay · somethphay.me
