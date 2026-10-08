/**
 * Khmer formatting helpers.
 * kn(12) → "១២"  ·  khmerTime(date) → "ថ្ងៃសៅរ៍ ម៉ោង ៦:៤២ ល្ងាច"
 */
const DIGITS = "០១២៣៤៥៦៧៨៩";
const DAYS = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
const MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];

/** Convert Western digits to Khmer digits. */
export function kn(value: number | string): string {
  return String(value).replace(/\d/g, (d) => DIGITS[Number(d)]);
}

function clock(d: Date): string {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const part = h < 12 ? "ព្រឹក" : h < 17 ? "រសៀល" : "ល្ងាច";
  return `ម៉ោង ${kn(`${h % 12 || 12}:${m}`)} ${part}`;
}

/** "ថ្ងៃសៅរ៍ ម៉ោង ៦:៤២ ល្ងាច" */
export function khmerTime(iso: string): string {
  const d = new Date(iso);
  return `ថ្ងៃ${DAYS[d.getDay()]} ${clock(d)}`;
}

/** "១២ ធ្នូ ២០២៦ · ម៉ោង ៦:៤២ ល្ងាច" */
export function khmerDateTime(iso: string): string {
  const d = new Date(iso);
  return `${kn(d.getDate())} ${MONTHS[d.getMonth()]} ${kn(d.getFullYear())} · ${clock(d)}`;
}
