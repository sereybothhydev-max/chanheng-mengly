// Candlelight lake: touching the water makes ripples and floats a lotus lantern.
// The canvas sizes to its parent (ResizeObserver only, never resizes itself in a
// loop) and only draws while the section is on screen and the tab is visible.
import gsap from 'gsap';
import { lotus } from './elements.js';

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

  let last = performance.now(), ambient = 0;
  const frame = now => {
    raf = 0;
    if (!visible || document.hidden) return; // check visibility every frame
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    ambient -= dt;
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

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(water);
  document.addEventListener('visibilitychange', start);

  let count = 0;
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
    el.innerHTML = `<div class="lt-inner"><span class="lt-glow"></span>${lotus()}<span class="lt-flame"></span></div>`;
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
