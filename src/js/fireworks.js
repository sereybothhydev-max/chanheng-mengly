// Celebration fireworks for the thank-you section.
// Canvas sizes to its parent (ResizeObserver), draws only while visible,
// lighter on weak devices, a single still burst for reduced motion.
const PALETTES = [
  ['#fbefc0', '#f3d58a', '#d9b15a'],       // gold foil
  ['#ffd6e4', '#f28ab2', '#c72c6a'],       // rose
  ['#fffaf0', '#f2ecda', '#e3c57c'],       // cream
  ['#e9f3c6', '#c9d88a', '#9aab55'],       // olive light
];

export function initFireworks(canvas, env) {
  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  const dpr = Math.min(devicePixelRatio || 1, env.lite ? 1 : 1.75);
  let w = 0, h = 0, visible = false, raf = 0, last = 0, next = 0;
  const rockets = [], sparks = [];
  const MAX = env.lite ? 360 : 1100;

  new ResizeObserver(() => {
    // full padding box of the section (contentRect would skip its padding)
    const nw = parent.clientWidth, nh = parent.clientHeight;
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (env.reduced) still();
  }).observe(parent);

  const rnd = (a, b) => a + Math.random() * (b - a);

  function launch(tx = rnd(w * .15, w * .85), ty = rnd(h * .1, h * .38)) {
    const x = tx + rnd(-30, 30);
    const y0 = h + 10, g = .12;
    const vy = -Math.sqrt(2 * g * (y0 - ty)) * 1.03; // just enough to reach the target height
    const frames = -vy / g;
    rockets.push({ x, y: y0, tx, ty, vx: (tx - x) / frames, vy, pal: PALETTES[(Math.random() * PALETTES.length) | 0] });
  }

  function burst(x, y, pal) {
    const kind = Math.random();
    const n = env.lite ? 60 : kind < .25 ? 140 : 110;
    const speed = rnd(4.2, 6.4) * Math.min(1.25, Math.max(.75, w / 700));
    for (let i = 0; i < n && sparks.length < MAX; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(-.05, .05);
      // heart-shaped burst now and then, ring/peony otherwise
      let s = speed * (kind < .2 ? 1 : rnd(.55, 1));
      let vx = Math.cos(a) * s, vy = Math.sin(a) * s;
      if (kind < .2) {
        const t = a;
        vx = 16 * Math.sin(t) ** 3 * .2 * speed / 3;
        vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * .2 * speed / 3;
      }
      sparks.push({ x, y, px: x, py: y, vx, vy, life: 1, decay: rnd(.008, .013), color: pal[i % pal.length], glitter: Math.random() < .35 });
    }
    // bright flash
    sparks.push({ x, y, px: x, py: y, vx: 0, vy: 0, life: 1, decay: .08, color: '#fffaf0', flash: true });
  }

  function step(dt) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,.14)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      const ox = r.x, oy = r.y;
      r.x += r.vx * dt; r.y += r.vy * dt; r.vy += .12 * dt;
      ctx.strokeStyle = 'rgba(255, 236, 190, .7)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(r.x, r.y); ctx.stroke();
      if (r.y <= r.ty || r.vy >= -.5) { burst(r.x, r.y, r.pal); rockets.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.px = p.x; p.py = p.y;
      p.vx *= .985; p.vy = p.vy * .985 + .045 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      if (p.flash) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 70 * p.life);
        g.addColorStop(0, `rgba(255,240,200,${.2 * p.life})`); g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 70 * p.life, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      const a = p.glitter ? p.life * (.4 + .6 * Math.random()) : p.life;
      ctx.globalAlpha = Math.max(0, a * .78);
      ctx.strokeStyle = p.color; ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      // bright head
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return; // checked every frame
    const dt = Math.min(2.5, (now - last) / 16.67); last = now;
    if (now > next) {
      launch();
      if (!env.lite && Math.random() < .35) setTimeout(() => launch(), 180);
      next = now + rnd(700, 1500) * (env.lite ? 1.6 : 1);
    }
    step(dt);
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && visible && !env.reduced) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  // reduced motion: one still, gentle burst
  function still() {
    ctx.clearRect(0, 0, w, h);
    burst(w * .5, h * .32, PALETTES[0]);
    for (let k = 0; k < 28; k++) step(1);
  }

  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting;
    if (visible && !was && !env.reduced) { launch(w * .5, h * .25); setTimeout(() => launch(w * .28, h * .3), 260); setTimeout(() => launch(w * .72, h * .28), 520); next = performance.now() + 1400; }
    start();
  }, { threshold: .15 }).observe(parent);
  document.addEventListener('visibilitychange', start);

  // tap the sky to launch one
  parent.addEventListener('pointerdown', e => {
    if (env.reduced || e.target.closest('a, button')) return;
    const r = canvas.getBoundingClientRect();
    launch(e.clientX - r.left, Math.min(e.clientY - r.top, h * .6));
    start();
  });
}
