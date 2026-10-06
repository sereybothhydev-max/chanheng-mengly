import { i18n } from '../data/i18n.js';

const KH_DIGITS = '០១២៣៤៥៦៧៨៩';
let lang = 'kh';
try { lang = localStorage.getItem('lang') === 'en' ? 'en' : 'kh'; } catch { /* storage blocked */ }

export const getLang = () => lang;
export const t = key => i18n[lang][key] ?? i18n.kh[key] ?? key;

/** Khmer numerals in Khmer mode, Latin in English mode */
export const num = (n, pad = 0) => {
  const s = String(n).padStart(pad, '0');
  return lang === 'kh' ? s.replace(/\d/g, d => KH_DIGITS[d]) : s;
};
export const toKhDigits = s => String(s).replace(/\d/g, d => KH_DIGITS[d]);

/** pick a {kh,en} pair (falls back to Khmer when English is missing) */
export const pick = obj => (obj ? (lang === 'en' && obj.en ? obj.en : obj.kh) : '');

const listeners = new Set();
export const onLang = fn => listeners.add(fn);

export function apply(root = document) {
  document.documentElement.lang = lang === 'kh' ? 'km' : 'en';
  document.documentElement.dataset.lang = lang;
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  root.querySelectorAll('[data-num]').forEach(el => { el.textContent = num(el.dataset.num, +(el.dataset.pad || 0)); });
  root.querySelectorAll('[data-kh]').forEach(el => {
    const v = lang === 'en' && el.dataset.en ? el.dataset.en : el.dataset.kh;
    if (el.hasAttribute('data-nw')) el.innerHTML = nowrap(v); else el.textContent = v;
  });
  listeners.forEach(fn => fn(lang));
}

export function setLang(next) {
  lang = next;
  try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
  apply();
}

/** wrap each space-separated phrase so Khmer only breaks between phrases */
// long phrases stay breakable so they never overflow narrow screens
export const nowrap = s => String(s).split(' ').map(w => (w.length <= 14 ? `<span class="nw">${w}</span>` : w)).join(' ');

/** helper: bilingual span from a {kh,en} pair */
export const bi = (obj, tag = 'span', cls = '', nw = false) =>
  `<${tag} class="${cls}" data-kh="${obj.kh}" ${obj.en ? `data-en="${obj.en}"` : ''} ${nw ? 'data-nw' : ''}>${nw ? nowrap(pick(obj)) : pick(obj)}</${tag}>`;
export const tx = (key, tag = 'span', cls = '') => `<${tag} class="${cls}" data-i18n="${key}">${t(key)}</${tag}>`;
