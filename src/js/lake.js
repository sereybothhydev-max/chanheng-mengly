// Candlelight lake.
// A group of lotus lanterns is released together from the near shore. They glide
// out and settle into a HEART LYING ON THE WATER, drawn in perspective (the point
// near the viewer, the two lobes far away toward the temple, nearer lanterns
// bigger), and the heart turns slowly on the surface so it reads in 3D. Then the
// lanterns drift apart toward the horizon, fade, and the release repeats.
// Touching the water still floats an extra lantern of your own.
// The canvas sizes to its parent (ResizeObserver only) and everything runs only
// while the section is on screen and the tab is visible.
import gsap from 'gsap';
import { lotus } from './elements.js';

const LANTERN_HTML = () => `<div class="lt-inner"><span class="lt-glow"></span>${lotus()}<span class="lt-flame"></span></div>`;

// ── timings of one formation cycle (seconds) ───────────────────────────
const T_RELEASE = 3.6;   // shore → heart
const T_HOLD = 10;       // heart holds, turning on the water
const T_DRIFT = 4.2;     // lanterns drift apart and fade
const T_REST = 1.4;      // calm water before the next release
const CYCLE = T_RELEASE + T_HOLD + T_DRIFT + T_REST;

const easeOut = k => 1 - Math.pow(1 - k, 3);
const easeInOut = k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

// N points spaced evenly (by arc length) along a heart outline.
// u = left/right, v = depth on the water (+ far, − near), both roughly in −1…1.
function heartSlots(n) {
  const pts = [], len = [0];
  for (let i = 0; i <= 720; i++) {
    const t = (i / 720) * Math.PI * 2;
    pts.push([16 * Math.sin(t) ** 3, 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)]);
    if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const L = len[len.length - 1], out = [];
  for (let k = 0; k < n; k++) {
    const target = (k / n) * L;
    let i = len.findIndex(v => v >= target); if (i < 1) i = 1;
    const f = (target - len[i - 1]) / (len[i] - len[i - 1] || 1);
    const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f;
    const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
    out.push({ u: x / 17, v: (y + 2.5) / 15 });
  }
  return out;
}

// Small lamps filling the inside of the heart: an even hex grid in heart space,
// keeping points that are inside the outline and not too close to it.
function interiorPoints(spacing) {
  const outline = heartSlots(240);
  const inside = (x, y) => {
    let c = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const a = outline[i], b = outline[j];
      if ((a.v > y) !== (b.v > y) && x < ((b.u - a.u) * (y - a.v)) / (b.v - a.v) + a.u) c = !c;
    }
    return c;
  };
  const clearance = (x, y) => Math.min(...outline.map(o => Math.hypot(o.u - x, o.v - y)));
  const pts = [], rowH = spacing * Math.sqrt(3) / 2;
  for (let r = 0, y = -1.2; y <= 1.1; y += rowH, r++) {
    for (let x = -1.1 + (r % 2 ? spacing / 2 : 0); x <= 1.1; x += spacing) {
      if (inside(x, y) && clearance(x, y) > spacing * .62) pts.push({ u: x, v: y });
    }
  }
  return pts;
}

// One pre-rendered lamp sprite (glow + small gold cup + flame), drawn many times.
function lampSprite(px) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const g = c.getContext('2d'), m = px / 2;
  const halo = g.createRadialGradient(m, m * .9, 0, m, m * .9, m);
  halo.addColorStop(0, 'rgba(255, 214, 140, .55)'); halo.addColorStop(.35, 'rgba(255, 190, 100, .22)'); halo.addColorStop(1, 'rgba(255, 190, 100, 0)');
  g.fillStyle = halo; g.fillRect(0, 0, px, px);
  // cup
  const cw = px * .22, ch = px * .1, cy = m + px * .06;
  const cup = g.createLinearGradient(m - cw, 0, m + cw, 0);
  cup.addColorStop(0, '#9c7124'); cup.addColorStop(.45, '#fbefc0'); cup.addColorStop(1, '#9c7124');
  g.fillStyle = cup;
  g.beginPath(); g.ellipse(m, cy, cw, ch, 0, 0, Math.PI); g.fill();
  g.fillStyle = 'rgba(255, 246, 220, .9)'; g.beginPath(); g.ellipse(m, cy, cw, ch * .35, 0, 0, Math.PI * 2); g.fill();
  // flame
  const fl = g.createRadialGradient(m, cy - px * .1, 0, m, cy - px * .1, px * .11);
  fl.addColorStop(0, '#fffbe8'); fl.addColorStop(.5, '#ffd36b'); fl.addColorStop(1, 'rgba(255, 160, 60, 0)');
  g.fillStyle = fl;
  g.beginPath(); g.ellipse(m, cy - px * .1, px * .06, px * .11, 0, 0, Math.PI * 2); g.fill();
  return c;
}

export function initLake(env) {
  const water = document.querySelector('.lake-water');
  const canvas = document.getElementById('lakeCanvas');
  const holder = document.getElementById('lanterns');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, env.lite ? 1 : 1.5);
  let w = 0, h = 0, visible = false, raf = 0;
  const ripples = [];

  // ── formation lanterns (created once, moved every frame) ─────────────
  const N = env.lite ? 16 : 24;
  const slots = heartSlots(N);
  const flock = slots.map((s, i) => {
    const el = document.createElement('div');
    el.className = 'lantern lantern--f';
    el.style.setProperty('--bob-delay', `${(-Math.random() * 3).toFixed(2)}s`);
    el.innerHTML = LANTERN_HTML();
    el.style.opacity = '0';
    holder.appendChild(el);
    return { el, ...s, jitter: Math.random() * .18, spread: .85 + Math.random() * .4 };
  });

  // free-floating lanterns in the open water around the heart, in mirrored pairs
  // (preferred spots in water-box fractions; pairs that would touch the heart are skipped)
  const PAIRS = [
    [[.09, .3], [.91, .3]], [[.14, .8], [.86, .8]], [[.2, .07], [.8, .07]],
    [[.05, .56], [.95, .56]], [[.3, .94], [.7, .94]], [[.34, .02], [.66, .02]],
  ];
  const drifters = [];
  const maxDrifters = env.lite ? 4 : 8;
  function layoutDrifters() {
    drifters.forEach(d => d.el.remove()); drifters.length = 0;
    if (!w) return;
    // everything the heart can cover while it turns (outline + interior, three angles)
    const cover = [];
    [-.45, 0, .45].forEach(th => slots.concat(lamps).forEach(s2 => cover.push(project(s2.u, s2.v, th))));
    const clear = (x, y) => cover.every(c => Math.hypot(c.x - x, (c.y - y) * 1.4) > (w < 500 ? 50 : 62)); // room for the drift + glow
    for (const pair of PAIRS) {
      if (drifters.length >= maxDrifters) break;
      const pts = pair.map(([fx, fy]) => [fx * w, fy * h]);
      if (!pts.every(([x, y]) => x > 18 && x < w - 18 && clear(x, y))) continue;
      pts.forEach(([x, y]) => {
        const el = document.createElement('div');
        el.className = 'lantern lantern--f lantern--drift';
        el.style.setProperty('--bob-delay', `${(-Math.random() * 3).toFixed(2)}s`);
        el.innerHTML = LANTERN_HTML();
        el.style.opacity = '0';
        holder.appendChild(el);
        drifters.push({ el, x, y, ph: Math.random() * 6.28, ph2: Math.random() * 6.28, scale: .5 + .45 * (y / h) });
      });
    }
  }
  const moveDrifters = (time, fade) => drifters.forEach(d => {
    const x = d.x + Math.sin(time * .18 + d.ph) * 14, y = d.y + Math.sin(time * .13 + d.ph2) * 5;
    d.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${d.scale.toFixed(3)})`;
    d.el.style.opacity = (fade * .92).toFixed(3);
    d.el.style.zIndex = String(Math.round(10 + (d.y / h) * 20));
  });

  // small lamps inside the heart (spacing ≈ 0.8 × the gap between outline lanterns)
  const gap = slots.reduce((a, s, i) => { const n = slots[(i + 1) % slots.length]; return a + Math.hypot(n.u - s.u, n.v - s.v); }, 0) / slots.length;
  const lamps = interiorPoints(gap * (env.lite ? .9 : .82)).map(p => ({ ...p, jitter: Math.random() * .3, phase: Math.random() * 6.28, spread: .85 + Math.random() * .4 }));
  const LAMP_PX = 64; // sprite resolution; drawn at ≈ 40% of a lotus lantern
  const sprite = lampSprite(LAMP_PX * dpr);
  const lampDraw = []; // filled each frame: [x, y, size, alpha, Z]

  // perspective projection of a point lying on the water plane
  const project = (u, v, theta) => {
    const X = u * Math.cos(theta) - v * Math.sin(theta);
    const Z = u * Math.sin(theta) + v * Math.cos(theta);
    const p = 1 / (1 + Z * .22);                      // farther → smaller
    // width is capped by the water's height so the heart never turns into a flat strip
    const RX = Math.min(w * .37, h * .8), RY = h * .3;
    return { x: w / 2 + X * RX * p, y: h * .44 - Z * RY * p, p: Math.min(p, 1.2), Z };
  };
  const place = (f, x, y, scale, alpha, Z) => {
    f.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    f.el.style.opacity = alpha.toFixed(3);
    f.el.style.zIndex = String(Math.round(60 - Z * 30));
  };

  const ro = new ResizeObserver(([e]) => {
    const r = e.contentRect;
    if (Math.round(r.width) === w && Math.round(r.height) === h) return;
    w = Math.round(r.width); h = Math.round(r.height);
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutDrifters();
    if (env.reduced) still();
  });
  ro.observe(water);

  const add = (x, y, strength = 1) => ripples.push({ x, y, r: 2, a: .55 * strength, v: 38 + 20 * strength });

  // reduced motion: the finished heart, resting still
  function still() {
    flock.forEach(f => { const q = project(f.u, f.v, .25); place(f, q.x, q.y, q.p, 1, q.Z); });
    ctx.clearRect(0, 0, w, h);
    lamps.forEach(l => { const q = project(l.u, l.v, .25); drawLamp(q.x, q.y, q.p, 1); });
    moveDrifters(0, 1);
  }
  function drawLamp(x, y, p, a) {
    const size = 30 * p; // on-screen sprite size (the glow is wider than the cup)
    ctx.globalAlpha = a;
    ctx.drawImage(sprite, x - size / 2, y - size * .55, size, size);
    ctx.globalAlpha = 1;
  }

  let last = performance.now(), ambient = 0, clock = 0, released = false, settled = false;
  const frame = now => {
    raf = 0;
    if (!visible || document.hidden) return; // checked every frame
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    clock += dt;
    const t = clock % CYCLE;
    const theta = .45 * Math.sin(clock * .32);    // the heart slowly turns on the water

    // release moment: ripples along the shore
    if (t < .1 && !released) { released = true; settled = false; flock.forEach((f, i) => i % 3 === 0 && add(project(f.u, f.v, theta).x, h * .96, .6)); }
    if (t > 1) released = false;

    let ring = 0; // how much of the heart's glowing outline to show
    flock.forEach(f => {
      const q = project(f.u, f.v, theta);
      if (t < T_RELEASE) {
        // glide from the near shore into the heart, all at once (tiny jitter only)
        const k = easeOut(Math.min(1, Math.max(0, (t - f.jitter) / (T_RELEASE - f.jitter))));
        const x0 = w / 2 + (q.x - w / 2) * 1.35, y0 = h + 36;
        place(f, x0 + (q.x - x0) * k, y0 + (q.y - y0) * k, 1.35 + (q.p - 1.35) * k, Math.min(1, k * 2.2), q.Z);
        ring = Math.max(0, (t - T_RELEASE * .6) / (T_RELEASE * .4));
      } else if (t < T_RELEASE + T_HOLD) {
        place(f, q.x, q.y, q.p, 1, q.Z);
        ring = 1;
      } else if (t < T_RELEASE + T_HOLD + T_DRIFT) {
        // drift apart toward the horizon, shrinking and fading
        const k = easeInOut((t - T_RELEASE - T_HOLD) / T_DRIFT);
        const dx = (q.x - w / 2) * .7 * f.spread * k, dy = -h * .34 * k * f.spread;
        place(f, q.x + dx, q.y + dy, q.p * (1 - .5 * k), 1 - k, q.Z);
        ring = 1 - Math.min(1, k * 2.5);
      } else {
        f.el.style.opacity = '0';
      }
    });
    moveDrifters(clock, Math.min(1, clock / 2));
    lampDraw.length = 0;
    lamps.forEach(l => {
      const q = project(l.u, l.v, theta);
      const flick = .82 + .18 * Math.sin(clock * 6 + l.phase) * Math.sin(clock * 2.3 + l.phase * 2);
      if (t < T_RELEASE) {
        const k = easeOut(Math.min(1, Math.max(0, (t - l.jitter) / (T_RELEASE - l.jitter))));
        const x0 = w / 2 + (q.x - w / 2) * 1.3, y0 = h + 20;
        lampDraw.push([x0 + (q.x - x0) * k, y0 + (q.y - y0) * k, q.p * (1.25 - .25 * k), Math.min(1, k * 2) * flick, q.Z]);
      } else if (t < T_RELEASE + T_HOLD) {
        lampDraw.push([q.x, q.y, q.p, flick, q.Z]);
      } else if (t < T_RELEASE + T_HOLD + T_DRIFT) {
        const k = easeInOut((t - T_RELEASE - T_HOLD) / T_DRIFT);
        lampDraw.push([q.x + (q.x - w / 2) * .7 * l.spread * k, q.y - h * .34 * k * l.spread, q.p * (1 - .5 * k), (1 - k) * flick, q.Z]);
      }
    });
    lampDraw.sort((a, b) => b[4] - a[4]); // far first

    if (t >= T_RELEASE && !settled) { settled = true; add(w / 2, h * .56, 1.1); }

    ambient -= dt;
    if (ambient <= 0) { add(Math.random() * w, h * (.15 + Math.random() * .7), .45); ambient = env.lite ? 4 : 2.2 + Math.random() * 1.6; }

    ctx.clearRect(0, 0, w, h);
    // soft light connecting the lanterns, so the heart reads clearly on the water
    if (ring > .01) {
      const pts = slots.map(s => project(s.u, s.v, theta));
      ctx.beginPath();
      pts.forEach((p, i) => {
        const n = pts[(i + 1) % pts.length];
        const mx = (p.x + n.x) / 2, my = (p.y + n.y) / 2;
        i ? ctx.quadraticCurveTo(p.x, p.y, mx, my) : ctx.moveTo(mx, my);
      });
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 205, 130, ${(.16 * ring).toFixed(3)})`; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = `rgba(255, 238, 200, ${(.32 * ring).toFixed(3)})`; ctx.lineWidth = 1.4; ctx.stroke();
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const p = ripples[i];
      p.r += p.v * dt; p.a -= dt * .32;
      if (p.a <= 0) { ripples.splice(i, 1); continue; }
      const flat = .22 + .2 * (p.y / h); // rings flatten toward the horizon
      for (let k = 0; k < 3; k++) {
        const rr = p.r - k * 9;
        if (rr <= 0) continue;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rr, rr * flat, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 226, 170, ${(p.a * (1 - k * .3)).toFixed(3)})`;
        ctx.lineWidth = 1.2 - k * .3;
        ctx.stroke();
      }
    }
    for (const [x, y, p, a] of lampDraw) drawLamp(x, y, p, a);
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf && visible && !env.reduced) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(water);
  document.addEventListener('visibilitychange', start);

  // touch: one extra lantern of your own
  water.addEventListener('pointerdown', e => {
    if (env.reduced) return;
    const r = water.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    add(x, y, 1);
    start();
    const own = holder.querySelectorAll('.lantern:not(.lantern--f)');
    if (own.length >= (env.lite ? 4 : 7)) own[0].remove();
    floatLantern(x, y);
  });

  function floatLantern(x, y) {
    const el = document.createElement('div');
    el.className = 'lantern';
    el.innerHTML = LANTERN_HTML();
    el.style.left = x + 'px'; el.style.top = y + 'px';
    holder.appendChild(el);
    const inner = el.firstElementChild;
    const s = .55 + (y / h) * .6;
    gsap.fromTo(inner, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .8, ease: 'back.out(2)' });
    gsap.fromTo(el, { scale: s }, { x: (Math.random() - .5) * w * .4, y: -y * .78, scale: s * .45, duration: 16, ease: 'sine.inOut' });
    gsap.to(el, { opacity: 0, duration: 3, delay: 13, onComplete: () => el.remove() });
  }
}
