// Candlelight lake: lanterns float out on their own (and on touch); each one slowly
// changes shape — lotus lantern → heart → sparkle → lantern — as it drifts away.
// The canvas sizes to its parent (ResizeObserver only, never resizes itself in a
// loop) and only draws while the section is on screen and the tab is visible.
import gsap from 'gsap';
import { lotus } from './elements.js';

const HEART_SVG = '<svg class="lt-svg" viewBox="0 0 40 36"><path d="M20 34C8 25 1 18 1 10.5C1 5 5 1 10.2 1C14 1 17.4 3.2 20 6.8C22.6 3.2 26 1 29.8 1C35 1 39 5 39 10.5C39 18 32 25 20 34Z" fill="#d6447f" stroke="#f3dc9c" stroke-width="1.4"/><path d="M8.5 9.5C9.5 6.5 12 5 14.5 5" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/></svg>';
const SPARKLE_SVG = '<svg class="lt-svg" viewBox="0 0 40 40"><path d="M20 2C21.4 13 27 18.6 38 20C27 21.4 21.4 27 20 38C18.6 27 13 21.4 2 20C13 18.6 18.6 13 20 2Z" fill="#f3d58a" stroke="#fffaf0" stroke-opacity=".6" stroke-width=".8"/><circle cx="20" cy="20" r="3.4" fill="#fffaf0"/><path d="M9 8c3 0 4.5 2.4 4 5c-2.8 0-4.6-2-4-5zM31 32c-3 0-4.5-2.4-4-5c2.8 0 4.6 2 4 5z" fill="#e2558d" opacity=".85"/></svg>';

export function initLake(env) {
  const water = document.querySelector('.lake-water');
  const canvas = document.getElementById('lakeCanvas');
  const holder = document.getElementById('lanterns');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, env.lite ? 1 : 1.5);
  let w = 0, h = 0, visible = false, raf = 0;
  const ripples = [];

  const ro = new ResizeObserver(([e]) => {
    const r = e.contentRect;
    if (Math.round(r.width) === w && Math.round(r.height) === h) return;
    w = Math.round(r.width); h = Math.round(r.height);
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  });
  ro.observe(water);

  const add = (x, y, strength = 1) => ripples.push({ x, y, r: 2, a: .55 * strength, v: 38 + 20 * strength });

  let last = performance.now(), ambient = 0, autoT = .4, count = 0;
  const frame = now => {
    raf = 0;
    if (!visible || document.hidden) return; // check visibility every frame
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    ambient -= dt;
    autoT -= dt;
    if (autoT <= 0 && w) { // launch a lantern by itself — no touch needed
      autoT = env.lite ? 3.2 : 1.6 + Math.random() * 1.2;
      const x = w * (.08 + Math.random() * .84), y = h * (.5 + Math.random() * .42);
      add(x, y, .8);
      if (holder.children.length >= (env.lite ? 6 : 10)) holder.firstElementChild.remove();
      floatLantern(x, y, count++);
    }
    if (ambient <= 0) { add(Math.random() * w, h * (.15 + Math.random() * .7), .45); ambient = env.lite ? 4 : 2.2 + Math.random() * 1.6; }
    ctx.clearRect(0, 0, w, h);
    for (let i = ripples.length - 1; i >= 0; i--) {
      const p = ripples[i];
      p.r += p.v * dt; p.a -= dt * .32;
      if (p.a <= 0) { ripples.splice(i, 1); continue; }
      // perspective: rings flatten toward the horizon
      const flat = .22 + .2 * (p.y / h);
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
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  let welcomed = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    // first time the lake comes into view: three lanterns set off straight away
    if (visible && !welcomed && !env.reduced && w) {
      welcomed = true;
      [[.22, .66], [.52, .84], [.8, .62]].forEach(([fx, fy], i) =>
        setTimeout(() => { add(w * fx, h * fy, .8); floatLantern(w * fx, h * fy, count++); }, 150 + i * 450));
      autoT = 2.2;
    }
    start();
  }).observe(water);
  if (env.reduced) {
    requestAnimationFrame(() => [[.25, .62], [.55, .78], [.78, .58]].forEach(([fx, fy], i) => {
      const el = document.createElement('div');
      el.className = 'lantern is-still';
      el.innerHTML = `<div class="lt-inner"><span class="lt-glow"></span><span class="lt-shape lt-shape--lantern">${lotus()}<span class="lt-flame"></span></span></div>`;
      el.style.left = fx * 100 + '%'; el.style.top = fy * 100 + '%';
      holder.appendChild(el);
    }));
  }
  document.addEventListener('visibilitychange', start);

  water.addEventListener('pointerdown', e => {
    const r = water.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    add(x, y, 1); add(x, y, .7); ripples[ripples.length - 1].r = -10;
    start();
    if (holder.children.length >= (env.lite ? 5 : 9)) holder.firstElementChild.remove();
    floatLantern(x, y, count++);
  });

  function floatLantern(x, y, i) {
    const el = document.createElement('div');
    el.className = 'lantern';
    // three stacked shapes take turns (CSS @keyframes ltMorph); a random phase per lantern
    el.style.setProperty('--lt-phase', `${(-Math.random() * 9).toFixed(1)}s`);
    el.innerHTML = `<div class="lt-inner"><span class="lt-glow"></span>
      <span class="lt-shape lt-shape--lantern">${lotus()}<span class="lt-flame"></span></span>
      <span class="lt-shape lt-shape--heart">${HEART_SVG}</span>
      <span class="lt-shape lt-shape--sparkle">${SPARKLE_SVG}</span></div>`;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    holder.appendChild(el);
    const inner = el.firstElementChild;
    const s = .55 + (y / h) * .6; // nearer the viewer = bigger
    // pop-in and bobbing live on the inner wrapper, the drift on the outer one
    gsap.fromTo(inner, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .8, ease: 'back.out(2)' });
    gsap.to(inner, { rotation: 6, y: -3, duration: 1.8, yoyo: true, repeat: 9, ease: 'sine.inOut' });
    gsap.fromTo(el, { scale: s }, {
      x: (Math.random() - .5) * w * .5 + (i % 2 ? 30 : -30),
      y: -y * .78, scale: s * .45, duration: 16 + Math.random() * 6, ease: 'sine.inOut',
    });
    gsap.to(el, { opacity: 0, duration: 3, delay: 15, onComplete: () => el.remove() });
  }
}
