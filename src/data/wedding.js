// ─────────────────────────────────────────────────────────────
// All wedding details live here. Edit this file only.
// Text that is not a "detail" (headings, sentences) is in i18n.js.
// ─────────────────────────────────────────────────────────────

export const wedding = {
  // Public URL of the deployed site (used for share links + og:image).
  siteUrl: 'https://chanheng-mengly.vercel.app',

  groom: {
    kh: 'សុខ ច័ន្ទហេង',
    en: 'Sok Chanheng',
    shortKh: 'ច័ន្ទហេង', // used in the name logo
    shortEn: 'Chanheng',
  },
  bride: {
    kh: 'ហ៊ី ម៉េងលី',
    en: 'Hy Mengly',
    shortKh: 'ម៉េងលី',
    shortEn: 'Mengly',
  },

  // English spellings are optional; when null the Khmer name is shown in both languages.
  groomParents: {
    father: { kh: 'ហូវ ហាន់', en: null },
    mother: { kh: 'សុខ ចាន់ណារី', en: null },
  },
  brideParents: {
    father: { kh: 'ហាក់ ផេងហ៊ី', en: null },
    mother: { kh: 'ហ៊ត ហ៊ុយឡាំង', en: null },
  },

  // Start of the day (first programme item), Cambodia time.
  dateISO: '2026-12-20T06:30:00+07:00',
  // For the .ics "Save to calendar" event
  calendar: { start: '2026-12-20T06:30:00+07:00', end: '2026-12-20T21:00:00+07:00' },

  date: {
    lunarKh: 'ថ្ងៃអាទិត្យ ១១កើត ខែមិគសិរ ឆ្នាំមមី អដ្ឋស័ក ពុទ្ធសករាជ២៥៧០',
    solarKh: 'ត្រូវនឹងថ្ងៃទី២០ ខែធ្នូ ឆ្នាំ២០២៦',
    lunarEn: '11th waxing day of Migasir · Year of the Horse',
    solarEn: 'Sunday, 20 December 2026',
    row: {
      day: { kh: 'អាទិត្យ', en: 'Sunday' },
      date: 20,
      month: { kh: 'ធ្នូ', en: 'December' },
      year: 2026,
    },
  },

  // Ceremony programme. icon: procession | hair | blessing | knot | rings | reception | monk | photo
  programme: [
    { time: '06:30', icon: 'procession', kh: 'ហែជំនូន', en: 'Gift procession' },
  ],

  venue: {
    kh: 'ហាង ពន្លឺថ្មី',
    en: null, // optional English name; Khmer is shown when null
    mapUrl: 'https://maps.app.goo.gl/2jc1AQLenEmZikmP7?g_st=ic',
    // Fill in exact coordinates to pin the embedded map precisely.
    lat: null,
    lng: null,
  },

  gifts: [
    { holder: 'MENGLY HY', bank: 'ABA · KHQR', img: `${import.meta.env.BASE_URL}qr/qr-mengly.png`, file: 'QR-Mengly-Hy.png' },
  ],

  music: `${import.meta.env.BASE_URL}audio/music.mp3`,

  credit: { text: 'Design inspired by Someth Phay · somethphay.me', url: 'https://somethphay.me' },
};
