// Device capability flags, computed once.
const mq = q => window.matchMedia(q).matches;
const nav = navigator;
const reduced = mq('(prefers-reduced-motion: reduce)');
const coarse = mq('(pointer: coarse)');
const small = Math.min(screen.width, screen.height) < 600 || mq('(max-width: 899px)');
const weak =
  (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
  (nav.deviceMemory && nav.deviceMemory <= 3) ||
  (nav.connection && nav.connection.saveData);
const qs = new URLSearchParams(location.search);
const inApp = /Telegram|FBAN|FBAV|Messenger|Instagram|Line\//i.test(nav.userAgent);

export const env = {
  reduced,
  coarse,
  phone: small && coarse,
  lite: !!weak || reduced,
  inApp,
  // WebGL only on capable desktops
  gl: qs.has('fx') || (!coarse && !small && !weak && !reduced),
  lenis: !coarse && !reduced && !small,
};
if (env.lite) document.documentElement.classList.add('lite');
if (env.reduced) document.documentElement.classList.add('reduced');
