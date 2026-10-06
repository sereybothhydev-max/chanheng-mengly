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
  calendar: { start: '2026-12-19T15:30:00+07:00', end: '2026-12-20T21:00:00+07:00' },

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

  // Ceremony programme, grouped by day. Times exactly as on the printed card.
  // icon: shrine | monk | lantern | guests | procession | urn | rings | hair | knot | dining | toast
  programme: [
    {
      day: { kh: 'កម្មវិធីទី១', en: 'Day 1' },
      date: { kh: 'ថ្ងៃសៅរ៍ ទី១៩ ខែធ្នូ ឆ្នាំ២០២៦', en: 'Saturday, 19 December 2026' },
      items: [
        { time: '03:30', periodKh: 'រសៀល', timeEn: '3:30 PM', icon: 'shrine', kh: 'ពិធីសែនក្រុងពាលី', en: 'Krong Pali Ceremony — paying respects to the land spirits' },
        { time: '04:30', periodKh: 'រសៀល', timeEn: '4:30 PM', icon: 'monk', kh: 'ពិធីសូត្រមន្តចម្រើនព្រះបរិត្ត', en: 'Blessing ceremony — monks chanting' },
        { time: '06:30', periodKh: 'ល្ងាច', timeEn: '6:30 PM', icon: 'lantern', kh: 'ពិធីជាវខាន់ស្លា', en: 'Chav Khan Sla — evening offering ceremony' },
      ],
    },
    {
      day: { kh: 'កម្មវិធីទី២', en: 'Day 2' },
      date: { kh: 'ថ្ងៃអាទិត្យ ទី២០ ខែធ្នូ ឆ្នាំ២០២៦', en: 'Sunday, 20 December 2026' },
      items: [
        { time: '06:30', periodKh: 'ព្រឹក', timeEn: '6:30 AM', icon: 'guests', kh: 'ជួបជុំភ្ញៀវកិត្តិយសរៀបចំពិធីហែជំនូន', en: 'Honoured guests gather to prepare the groom’s procession' },
        { time: '07:00', periodKh: 'ព្រឹក', timeEn: '7:00 AM', icon: 'procession', kh: 'ពិធីហែជំនូន (កំណត់) ចូលរោងជ័យ', en: 'Groom’s procession (Hai Chenoun) enters the wedding hall' },
        { time: '08:30', periodKh: 'ព្រឹក', timeEn: '8:30 AM', icon: 'urn', kh: 'ពិធីរៀបរាប់ផ្លែឈើ និងពិសារស្លាដក', en: 'Fruit presentation & traditional Sla Dok tasting' },
        { time: '09:00', periodKh: 'ព្រឹក', timeEn: '9:00 AM', icon: 'rings', kh: 'ពិធីបំពាក់ចិញ្ចៀន កូនប្រុស - កូនស្រី', en: 'Ring exchange of the groom & bride' },
        { time: '09:30', periodKh: 'ព្រឹក', timeEn: '9:30 AM', icon: 'hair', kh: 'ពិធីកាត់សក់បង្កក់សិរី កូនប្រុស - កូនស្រី', en: 'Hair-cutting ceremony (Gaat Sah) for the groom & bride' },
        { time: '11:00', periodKh: 'ព្រឹក', timeEn: '11:00 AM', icon: 'knot', kh: 'ពិធីសំពះផ្ទឹម បង្វិលពពិល និងចងដៃ', en: 'Sampeah Phtim, passing of the sacred candle (Bangvel Popil) & wrist-tying' },
        { time: '12:00', periodKh: 'ថ្ងៃត្រង់', timeEn: '12:00 PM', icon: 'dining', kh: 'អញ្ជើញភ្ញៀវកិត្តិយសពិសារអាហារថ្ងៃត្រង់', en: 'Honoured guests are invited to lunch' },
        { time: '05:30', periodKh: 'ល្ងាច', timeEn: '5:30 PM', icon: 'toast', kh: 'អញ្ជើញភ្ញៀវកិត្តិយសពិសារអាហារពេលល្ងាច សូមអរគុណ!', en: 'Evening reception & dinner for honoured guests — thank you!' },
      ],
    },
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
