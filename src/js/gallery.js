// Masonry reveal + swipeable full-screen viewer.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gallery from '../data/gallery.json';
import { num } from './i18n.js';
import { env } from './env.js';

const src = (id, w) => `${import.meta.env.BASE_URL}photos/${id}-${w}.webp`;

export function initGallery(getLenis) {
  const items = [...document.querySelectorAll('.m-item')];
  if (!env.reduced) {
    gsap.set(items, { clipPath: 'inset(100% 0% 0% 0% round 6px)', y: 30 });
    ScrollTrigger.batch(items, {
      start: 'top 92%', once: true,
      onEnter: b => gsap.to(b, { clipPath: 'inset(0% 0% 0% 0% round 6px)', y: 0, duration: 1.3, stagger: .1, ease: 'silk', clearProps: 'clipPath' }),
    });
  }

  const viewer = document.getElementById('viewer');
  const track = document.getElementById('viewerTrack');
  const count = document.getElementById('viewerCount');
  track.innerHTML = gallery.map(g => `<div class="viewer-slide"><img alt="" data-id="${g.id}" draggable="false"></div>`).join('');
  const imgs = [...track.querySelectorAll('img')];
  const big = innerWidth * Math.min(devicePixelRatio, 2) > 1400 ? 2000 : 1280;
  let index = 0, opener = null;

  const load = i => { const im = imgs[i]; if (im && !im.src) im.src = src(im.dataset.id, big); };
  const go = (i, animate = true) => {
    index = (i + gallery.length) % gallery.length;
    [index - 1, index, index + 1].forEach(k => load((k + gallery.length) % gallery.length));
    gsap.to(track, { x: -index * innerWidth, duration: animate ? .55 : 0, ease: 'power3.out' });
    count.textContent = `${num(index + 1)} / ${num(gallery.length)}`;
  };
  const open = i => {
    opener = document.activeElement;
    viewer.hidden = false;
    getLenis()?.stop();
    document.body.style.overflow = 'hidden';
    go(i, false);
    gsap.fromTo(viewer, { opacity: 0 }, { opacity: 1, duration: .35 });
    gsap.fromTo(imgs[index], { scale: .92 }, { scale: 1, duration: .6, ease: 'silk' });
    document.getElementById('viewerClose').focus();
  };
  const close = () => {
    gsap.to(viewer, { opacity: 0, duration: .3, onComplete: () => { viewer.hidden = true; } });
    getLenis()?.start();
    document.body.style.overflow = '';
    opener?.focus?.();
  };

  items.forEach(b => b.addEventListener('click', () => open(+b.dataset.index)));
  document.getElementById('viewerClose').addEventListener('click', close);
  document.getElementById('viewerPrev').addEventListener('click', () => go(index - 1));
  document.getElementById('viewerNext').addEventListener('click', () => go(index + 1));
  addEventListener('keydown', e => {
    if (viewer.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  });
  addEventListener('resize', () => { if (!viewer.hidden) go(index, false); });

  // swipe
  let x0 = null, y0 = 0, dx = 0, t0 = 0;
  viewer.addEventListener('pointerdown', e => {
    if (e.target.closest('.viewer-btn')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; t0 = performance.now();
    viewer.setPointerCapture(e.pointerId);
  });
  viewer.addEventListener('pointermove', e => {
    if (x0 == null) return;
    dx = e.clientX - x0;
    gsap.set(track, { x: -index * innerWidth + dx });
  });
  const end = e => {
    if (x0 == null) return;
    const dy = e.clientY - y0;
    const fast = Math.abs(dx) > 30 && performance.now() - t0 < 250;
    if (Math.abs(dx) > innerWidth * .18 || fast) go(index + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 6 && dy > 90) close();
    else go(index);
    x0 = null;
  };
  viewer.addEventListener('pointerup', end);
  viewer.addEventListener('pointercancel', end);
}
