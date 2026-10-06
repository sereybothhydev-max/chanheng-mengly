// Realistic envelope + 5.5 s "by hand" opening.
// Layer order (translateZ): shadow < back < card < pocket < flap < seal.
// The stage keeps preserve-3d; no CSS filter on any 3D parent.
import gsap from 'gsap';
import { nameLogo, showLogoInstant } from './logo.js';
import { seal, corners } from './elements.js';
import { t } from './i18n.js';

// Envelope drawing units: 400 × 280 (aspect 1.43). Flap is 400 × FH.
const W = 400, H = 280, FH = 172;

// Cubic bezier helper
const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

// The flap's lower edge: right corner → tip → left corner, scalloped.
function flapEdge({ inset = 0, amp = 5.2, scallops = 9, steps = 18 } = {}) {
  const half = [[W, 10], [W - 26, 92], [W * 0.66, FH - 2], [W / 2, FH]];
  const seg = [];
  // dense sample of right half
  const N = 400;
  for (let i = 0; i <= N; i++) seg.push(bez(...half, i / N));
  // arc-length param
  const len = [0];
  for (let i = 1; i < seg.length; i++) len.push(len[i - 1] + Math.hypot(seg[i][0] - seg[i - 1][0], seg[i][1] - seg[i - 1][1]));
  const L = len[len.length - 1];
  const at = s => {
    let i = len.findIndex(v => v >= s); if (i <= 0) i = 1;
    const k = (s - len[i - 1]) / (len[i] - len[i - 1] || 1);
    const p = [seg[i - 1][0] + (seg[i][0] - seg[i - 1][0]) * k, seg[i - 1][1] + (seg[i][1] - seg[i - 1][1]) * k];
    const tx = seg[i][0] - seg[i - 1][0], ty = seg[i][1] - seg[i - 1][1];
    const n = Math.hypot(tx, ty) || 1;
    // outward normal (pointing away from the flap body → down/right on right half)
    return { p, nx: ty / n, ny: -tx / n };
  };
  const right = [];
  const total = scallops * steps;
  for (let j = 0; j <= total; j++) {
    const s = (j / total) * L;
    const { p, nx, ny } = at(s);
    const frac = (j % steps) / steps;
    const bump = Math.sin(Math.PI * frac) * amp;
    // n points outward (away from the flap body): bumps bulge out, inset moves in
    const off = bump - inset;
    right.push([p[0] + nx * off, p[1] + ny * off]);
  }
  const left = right.slice(0, -1).reverse().map(([x, y]) => [W - x, y]);
  return right.concat(left);
}

const pct = (pts, flip = false) => pts.map(([x, y]) => `${(x / W * 100).toFixed(2)}% ${((flip ? FH - y : y) / FH * 100).toFixed(2)}%`).join(',');
const pathD = (pts, dy = 0, close = false) =>
  'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${(y + dy).toFixed(1)}`).join(' L') + (close ? ' Z' : '');

export function envelopeHTML() {
  const edge = flapEdge();
  const clip = `polygon(0% 0%, 100% 0%, ${pct(edge)})`;
  // the lining face is itself rotated 180° about X, so its clip is mirrored vertically
  const clipBack = `polygon(0% 100%, 100% 100%, ${pct(edge, true)})`;
  const goldLine = pathD(flapEdge({ inset: 11, amp: 4 }));
  const flapShape = 'M0 0 L400 0 ' + pathD(edge).replace('M', 'L') + ' Z';

  return `
  <div class="env-stage" id="envStage">
    <div class="env" id="env">
      <div class="env-shadow"></div>
      <div class="env-body" id="envBody">
        <div class="env-back"><div class="env-back-inner"></div></div>
        <div class="env-pocket">
          <svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
            <defs>
              <pattern id="pp-olive" patternUnits="userSpaceOnUse" width="220" height="220"><image href="/textures/paper-olive.webp" width="220" height="220"/></pattern>
              <linearGradient id="sh-left" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></linearGradient>
              <linearGradient id="sh-right" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></linearGradient>
              <linearGradient id="sh-bottom" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".1"/><stop offset=".75" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>
              <filter id="soft6" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
              <filter id="soft3" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.6"/></filter>
            </defs>
            <!-- side panels -->
            <path d="M0 0 L192 134 Q204 142 192 152 L0 ${H} Z" fill="url(#pp-olive)"/>
            <path d="M0 0 L192 134 Q204 142 192 152 L0 ${H} Z" fill="url(#sh-left)"/>
            <path d="M${W} 0 L208 134 Q196 142 208 152 L${W} ${H} Z" fill="url(#pp-olive)"/>
            <path d="M${W} 0 L208 134 Q196 142 208 152 L${W} ${H} Z" fill="url(#sh-right)"/>
            <!-- bottom panel casts a soft shadow upward onto the sides -->
            <path d="M0 ${H - 6} L184 150 Q200 138 216 150 L${W} ${H - 6} L${W} ${H} L0 ${H} Z" fill="#141708" opacity=".5" filter="url(#soft3)" transform="translate(0 -3)"/>
            <path d="M0 ${H - 4} L184 152 Q200 141 216 152 L${W} ${H - 4} L${W} ${H} L0 ${H} Z" fill="url(#pp-olive)"/>
            <path d="M0 ${H - 4} L184 152 Q200 141 216 152 L${W} ${H - 4} L${W} ${H} L0 ${H} Z" fill="url(#sh-bottom)"/>
            <!-- crisp fold highlight -->
            <path d="M2 ${H - 5} L184 152 Q200 141 216 152 L${W - 2} ${H - 5}" fill="none" stroke="#e9e3b8" stroke-opacity=".18" stroke-width="1"/>
            <!-- shadow cast by the closed flap -->
            <path class="flap-cast" d="${flapShape}" fill="#0d0f05" opacity=".55" filter="url(#soft6)" transform="translate(0 7)"/>
          </svg>
        </div>
        <div class="env-flap" id="envFlap">
          <div class="flap-face flap-front" style="clip-path:${clip}">
            <div class="flap-shade"></div>
            <svg class="flap-gold" viewBox="0 0 ${W} ${FH}" preserveAspectRatio="none" aria-hidden="true">
              <path d="${goldLine}" fill="none" stroke="url(#g-foil)" stroke-width="1.3" vector-effect="non-scaling-stroke"/>
            </svg>
            <div class="flap-logo debossed">${nameLogo({ crest: true, cls: 'nl-flap', animate: false })}</div>
          </div>
          <div class="flap-face flap-back" style="clip-path:${clipBack}"><div class="flap-back-shade"></div></div>
        </div>
      </div>
      <div class="env-card" id="envCard">
        <div class="card-paper">
          ${corners('card-corner')}
          <div class="card-inner">
            ${nameLogo({ crest: true, cls: 'nl-card', animate: false })}
            <p class="card-invite" data-i18n="cardInvite">${t('cardInvite')}</p>
          </div>
        </div>
      </div>
      <button class="env-seal" id="envSeal" aria-label="Open the invitation">
        <span class="seal-shadow"></span>
        <span class="seal-body">${seal()}</span>
        <span class="seal-ring"></span>
      </button>
    </div>
  </div>`;
}

// z-layers are set through GSAP so its transforms never fight CSS ones
export function layer() {
  gsap.set('.env-shadow', { z: -2 });
  gsap.set('.env-back', { z: 0 });
  gsap.set('#envCard', { z: 1 });
  gsap.set('.env-pocket', { z: 2 });
  gsap.set('#envFlap', { z: 3, rotationX: 0 });
  gsap.set('#envSeal', { z: 5 });
}

// ── idle float + pointer / device tilt ──────────────────────────────
export function idle(env, { lite }) {
  const floatTw = gsap.to(env, { y: -7, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  const rx = gsap.quickTo(env, 'rotationX', { duration: 1.2, ease: 'power3.out' });
  const ry = gsap.quickTo(env, 'rotationY', { duration: 1.2, ease: 'power3.out' });
  const onMove = e => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    rx(-y * 10); ry(x * 12);
  };
  const onTilt = e => {
    if (e.beta == null) return;
    const b = Math.max(-25, Math.min(25, e.beta - 40)), g = Math.max(-25, Math.min(25, e.gamma));
    rx(-b * .28); ry(g * .36);
  };
  if (!lite) {
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('deviceorientation', onTilt, { passive: true });
  }
  return () => {
    floatTw.kill();
    removeEventListener('pointermove', onMove);
    removeEventListener('deviceorientation', onTilt);
    gsap.to(env, { rotationX: 0, rotationY: 0, y: 0, duration: .5, ease: 'power2.out' });
  };
}

// ── opening ─────────────────────────────────────────────────────────
export function openTimeline({ reduced, onCover, onDone }) {
  const env = document.getElementById('env');
  const body = document.getElementById('envBody');
  const flap = document.getElementById('envFlap');
  const card = document.getElementById('envCard');
  const sealBtn = document.getElementById('envSeal');
  const sealBody = sealBtn.querySelector('.seal-body');
  const sealShadow = sealBtn.querySelector('.seal-shadow');
  const cast = document.querySelector('.flap-cast');
  const shadow = env.querySelector('.env-shadow');
  const head = document.querySelector('.env-head');
  const veil = document.getElementById('veil');
  const cardLogo = card.querySelector('.nlogo');

  if (reduced) {
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to(veil, { opacity: 1, duration: .6 }).add(onCover).to(veil, { opacity: 0, duration: .6 });
    return tl;
  }

  sealBtn.classList.add('is-busy');
  document.getElementById('envelope').classList.add('is-opening');
  const tl = gsap.timeline({ onComplete: onDone, defaults: { ease: 'power2.inOut' } });

  // 1 — seal pressed, lifted with a growing shadow, set aside off screen
  tl.to(sealBody, { scale: .93, duration: .16, ease: 'power2.in' }, 0)
    .to(sealShadow, { scale: .9, opacity: .9, duration: .16 }, 0)
    .to(sealBody, { scale: 1.16, y: -14, duration: .55, ease: 'power3.out' }, .18)
    .to(sealShadow, { scale: 1.35, opacity: .45, x: 10, y: 16, duration: .55, ease: 'power3.out' }, .18)
    .to(sealBtn, { x: () => innerWidth * .62, y: () => -innerHeight * .28, rotation: 38, duration: .8, ease: 'power2.in' }, .78)
    .to(head, { opacity: 0, y: -16, duration: .7 }, .3);

  // 2 — flap folds back 180° in 3D; its cast shadow lifts off the pocket
  tl.to(cast, { opacity: 0, attr: { transform: 'translate(0 18)' }, duration: .7, ease: 'power1.out' }, 1.0)
    .to(flap, { rotationX: 180, duration: 1.25, ease: 'power2.inOut' }, 1.0)
    .add(() => gsap.set(flap, { z: .5 }), 1.0 + 1.25 * .5) // past 90° → behind the card
    .to(shadow, { opacity: .6, scaleY: 1.08, duration: 1.2 }, 1.0);

  // 3 — card drawn out at a slight angle while the envelope eases down
  tl.to(card, { yPercent: -58, rotation: -3.5, duration: 1.35, ease: 'power2.out' }, 2.15)
    .to(body, { y: () => env.offsetHeight * .14, duration: 1.35, ease: 'power2.out' }, 2.15)
    .to(shadow, { y: () => env.offsetHeight * .14, duration: 1.35, ease: 'power2.out' }, 2.15);

  // 4 — envelope drops out of frame; the card comes to the camera
  tl.add(() => gsap.set(card, { z: 10 }), 3.62)
    .to([body, shadow], { y: () => innerHeight * 1.1, rotation: 5, duration: 1.0, ease: 'power2.in' }, 3.45)
    .to(card, { yPercent: 0, rotation: 0, scale: () => Math.min(1.35, (innerHeight * .8) / card.offsetHeight, (innerWidth * .94) / card.offsetWidth), z: 120, duration: 1.15, ease: 'power3.inOut' }, 3.6)
    .fromTo(cardLogo, { '--shine': '-60%' }, { '--shine': '160%', duration: 1.4, ease: 'power1.inOut' }, 3.7);

  // 5 — fade through dark into the cover
  tl.to(veil, { opacity: 1, duration: .55, ease: 'power1.in' }, 4.6)
    .add(onCover, 5.15)
    .to(veil, { opacity: 0, duration: .6, ease: 'power1.out' }, 5.2);

  return tl;
}

export function prepCardLogo() {
  const l = document.querySelector('#envCard .nlogo');
  if (l) showLogoInstant(l);
}
