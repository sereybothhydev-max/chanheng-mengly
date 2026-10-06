import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { wedding as W } from '../data/wedding.js';
import { t, num, onLang, getLang } from './i18n.js';
import { env } from './env.js';
import { logoTimeline, showLogoInstant } from './logo.js';
import { initLake } from './lake.js';
import { initGallery } from './gallery.js';
import { initCoverFX } from './coverfx.js';

export let lenis = null;

export function initSections() {
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (env.lenis) {
    lenis = new Lenis({ lerp: .095, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: env.reduced ? 'auto' : 'smooth' });
  }));

  topbar();
  revealTitles();
  invitation();
  couple();
  countdown();
  programme();
  story();
  initLake(env);
  initGallery(() => lenis);
  venue();
  gift();
  thanks();
  share();
  if (env.gl) initCoverFX(document.getElementById('coverGL'));

  onLang(() => { splitWords(); ScrollTrigger.refresh(); });
  // fonts change heights → refresh once they are in
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
}

const R = env.reduced;
const st = (trigger, extra = {}) => ({ trigger, start: 'top 78%', once: true, ...extra });

// ── top bar: gradient + small logo once scrolled ────────────────────
function topbar() {
  const bar = document.getElementById('topbar');
  const cover = document.getElementById('cover');
  const update = () => bar.classList.toggle('is-scrolled', scrollY > cover.offsetHeight * .55);
  addEventListener('scroll', update, { passive: true });
  update();
}

// ── section titles: masked left→right (negative insets keep Khmer marks) ──
function revealTitles() {
  gsap.utils.toArray('.sec-head').forEach(head => {
    const title = head.querySelector('[data-reveal="mask"]');
    const div = head.querySelectorAll('.sec-divider path');
    if (R) return;
    const tl = gsap.timeline({ scrollTrigger: st(head, { start: 'top 85%' }) });
    tl.from(div, { drawSVG: '50% 50%', duration: 1.2, ease: 'power2.inOut', stagger: .04 }, 0);
    if (title) {
      tl.fromTo(title, { clipPath: 'inset(-40% 110% -40% -10%)' },
        { clipPath: 'inset(-40% -10% -40% -10%)', duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath' }, .15);
    }
  });
}

// ── 3 · words revealed phrase by phrase ─────────────────────────────
function splitWords() {
  document.querySelectorAll('[data-reveal="lines"]').forEach(el => {
    const text = t(el.dataset.i18n);
    el.innerHTML = text.split(' ').map(w => `<span class="rv-word">${w}</span>`).join(' ');
    if (el.dataset.done || R) el.querySelectorAll('.rv-word').forEach(w => (w.style.clipPath = 'none'));
  });
}
function invitation() {
  splitWords();
  const arch = document.querySelector('[data-arch]');
  const body = document.querySelector('.inv-body');
  if (R) return;
  gsap.timeline({ scrollTrigger: st(arch, { start: 'top 82%' }) })
    .fromTo(arch, { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 10px 10px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 10px 10px)', duration: 1.6, ease: 'silk', clearProps: 'clipPath' })
    .from(arch.querySelector('img'), { scale: 1.3, duration: 2.2, ease: 'silk' }, 0);
  gsap.to(arch.querySelector('img'), { yPercent: -6, ease: 'none', scrollTrigger: { trigger: arch, scrub: true } });

  ScrollTrigger.create({
    ...st(body, { start: 'top 82%' }),
    onEnter: () => {
      body.dataset.done = 1;
      gsap.fromTo(body.querySelectorAll('.rv-word'),
        { clipPath: 'inset(-40% 110% -40% -10%)', opacity: .2 },
        { clipPath: 'inset(-40% -10% -40% -10%)', opacity: 1, duration: .9, stagger: .045, ease: 'power2.out',
          onComplete() { body.querySelectorAll('.rv-word').forEach(w => (w.style.clipPath = 'none')); } });
    },
  });
  gsap.from('.parents', { opacity: 0, y: 24, duration: 1.1, stagger: .18, ease: 'silk', scrollTrigger: st('.parents-grid', { start: 'top 88%' }) });
}

// ── 4 · couple: scalloped frame draws, photo turns in ───────────────
function scallopPoints(R0, amp, n, cx = 100, cy = 100, steps = 360) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = R0 + amp * Math.abs(Math.sin((a * n) / 2));
    pts.push([cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2)]);
  }
  return pts;
}
function couple() {
  const ring = document.getElementById('scallopPath');
  ring.setAttribute('d', 'M' + scallopPoints(93, 5, 24).map(p => p.map(v => v.toFixed(2)).join(' ')).join(' L') + ' Z');
  const imgBox = document.querySelector('.scallop-img');
  imgBox.style.inset = '0';
  imgBox.style.clipPath = `polygon(${scallopPoints(84, 4.2, 24).map(([x, y]) => `${(x / 2).toFixed(2)}% ${(y / 2).toFixed(2)}%`).join(',')})`;
  if (R) return;
  const fig = document.querySelector('[data-scallop]');
  gsap.timeline({ scrollTrigger: st(fig, { start: 'top 80%' }) })
    .from(ring, { drawSVG: '0%', duration: 2, ease: 'power2.inOut' }, 0)
    .from(imgBox, { scale: .7, rotation: -14, opacity: 0, duration: 1.6, ease: 'silk' }, .2)
    .from(fig.querySelector('.scallop-heart'), { scale: 0, duration: .7, ease: 'back.out(2.5)' }, 1.3);
  document.querySelectorAll('[data-person]').forEach((p, i) => {
    const tl = gsap.timeline({ scrollTrigger: st(p, { start: 'top 85%' }) });
    tl.from(p.querySelector('.cp-label'), { opacity: 0, y: 10, duration: .7 })
      .fromTo(p.querySelector('.cp-name'), { clipPath: i ? 'inset(-40% -10% -40% 110%)' : 'inset(-40% 110% -40% -10%)' },
        { clipPath: 'inset(-40% -10% -40% -10%)', duration: 1.2, ease: 'power3.inOut', clearProps: 'clipPath' }, .1)
      .from(p.querySelectorAll('.cp-of, .cp-par'), { opacity: 0, y: 12, stagger: .1, duration: .8, ease: 'silk' }, .6);
  });
}

// ── 5 · countdown in Khmer numerals, digits flip ────────────────────
function countdown() {
  const cells = {};
  document.querySelectorAll('[data-unit]').forEach(el => (cells[el.dataset.unit] = el));
  const target = new Date(W.dateISO).getTime();
  const prev = {};
  let visible = false;
  const render = (force = false) => {
    let d = Math.max(0, target - Date.now());
    const v = {
      cDays: Math.floor(d / 864e5),
      cHours: Math.floor((d % 864e5) / 36e5),
      cMins: Math.floor((d % 36e5) / 6e4),
      cSecs: Math.floor((d % 6e4) / 1e3),
    };
    for (const k in v) {
      if (!force && prev[k] === v[k]) continue;
      prev[k] = v[k];
      cells[k].textContent = num(v[k], k === 'cDays' ? 1 : 2);
      if (!force && visible && !R && !env.lite) gsap.fromTo(cells[k], { rotationX: -80, opacity: .3 }, { rotationX: 0, opacity: 1, duration: .5, ease: 'back.out(1.6)' });
    }
    if (d === 0) document.querySelector('.count-sub').textContent = t('countDone');
  };
  render(true);
  setInterval(() => { if (!document.hidden) render(); }, 1000);
  onLang(() => render(true));
  ScrollTrigger.create({ trigger: '#count', start: 'top bottom', end: 'bottom top', onToggle: s => (visible = s.isActive) });
  if (!R) gsap.from('.count-cell', { y: 40, opacity: 0, rotationX: -40, stagger: .1, duration: 1.1, ease: 'silk', scrollTrigger: st('#countGrid') });
}

// ── 6 · programme: gold thread draws, icons light up ────────────────
function programme() {
  const fill = document.querySelector('.prog-thread-fill');
  if (R) { gsap.set(fill, { scaleY: 1 }); document.querySelectorAll('[data-prog]').forEach(i => i.classList.add('lit')); return; }
  gsap.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.prog', start: 'top 70%', end: 'bottom 60%', scrub: .6 } });
  document.querySelectorAll('[data-prog]').forEach(item => {
    const paths = item.querySelectorAll('.prog-path, .prog-ring');
    gsap.set(paths, { drawSVG: '0%' });
    gsap.set(item.querySelector('.prog-card'), { opacity: 0, x: item.classList.contains('is-right') && innerWidth >= 600 ? -24 : 24 });
    ScrollTrigger.create({
      trigger: item, start: 'top 72%', once: true,
      onEnter: () => {
        gsap.to(paths, { drawSVG: '100%', duration: 1.4, stagger: .12, ease: 'power2.inOut', onComplete: () => item.classList.add('lit') });
        gsap.to(item.querySelector('.prog-card'), { opacity: 1, x: 0, duration: 1, ease: 'silk', delay: .3 });
      },
    });
  });
}

// ── 7 · love story: pinned sideways strip, day → dusk ───────────────
function story() {
  const sec = document.getElementById('story');
  const track = document.getElementById('storyTrack');
  if (R) { sec.classList.add('no-pin'); return; }
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: sec, start: 'top top', end: () => '+=' + dist() * 1.15, pin: true, scrub: env.phone ? .4 : 1,
      invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: s => sec.style.setProperty('--dusk', s.progress.toFixed(3)),
    },
  });
  gsap.utils.toArray('.story-card').forEach((c, i) => {
    gsap.from(c.querySelector('img'), { scale: 1.18, duration: 1.6, ease: 'silk', scrollTrigger: { trigger: sec, start: 'top 60%', once: true }, delay: i * .08 });
  });
}

// ── 10 · venue: map unfolds like paper, calendar file ───────────────
function venue() {
  const frame = document.querySelector('[data-unfold]');
  const iframe = frame.querySelector('iframe');
  // Where the Google embed is blocked (strict CSP, offline), show the drawn map instead.
  const noEmbed = () => frame.classList.add('no-embed');
  document.addEventListener('securitypolicyviolation', e => {
    if (/frame|child/.test(e.violatedDirective || e.effectiveDirective || '') || /google/.test(e.blockedURI || '')) noEmbed();
  });
  if (!navigator.onLine) noEmbed();
  ScrollTrigger.create({ trigger: frame, start: 'top bottom+=600', once: true, onEnter: () => (iframe.src = iframe.dataset.src) });
  if (!R) {
    gsap.timeline({ scrollTrigger: st('.venue-crest', { start: 'top 85%' }) })
      .from('.venue-crest path, .venue-crest circle', { drawSVG: '0%', duration: 1.6, stagger: .03, ease: 'power2.inOut' })
      .fromTo('.venue-name', { clipPath: 'inset(-40% 110% -40% -10%)' }, { clipPath: 'inset(-40% -10% -40% -10%)', duration: 1.2, ease: 'power3.inOut', clearProps: 'clipPath' }, .4);
    gsap.from(frame, { rotationX: -70, transformPerspective: 1100, opacity: 0, duration: 1.6, ease: 'silk', scrollTrigger: st(frame, { start: 'top 88%' }) });
  }
  document.getElementById('icsBtn').addEventListener('click', downloadICS);
}
const icsDate = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function downloadICS() {
  const title = `${W.groom.kh} & ${W.bride.kh} · ${getLang() === 'kh' ? 'អាពាហ៍ពិពាហ៍' : 'Wedding'}`;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//wedding-invite//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${icsDate(W.calendar.start)}-chanheng-mengly@invite`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(W.calendar.start)}`, `DTEND:${icsDate(W.calendar.end)}`,
    `SUMMARY:${title}`, `LOCATION:${W.venue.kh}`, `DESCRIPTION:${W.venue.mapUrl}`, `URL:${W.siteUrl}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  a.download = 'wedding-chanheng-mengly.ics';
  document.body.appendChild(a); a.click(); a.remove();
}

// ── 11 · gift card turns in ─────────────────────────────────────────
function gift() {
  if (R) return;
  gsap.from('[data-gift]', { rotationY: -75, opacity: 0, transformOrigin: '0% 50%', duration: 1.6, stagger: .2, ease: 'silk', scrollTrigger: st('.gift-grid', { start: 'top 85%' }) });
}

// ── 12 · candles light one by one ───────────────────────────────────
function thanks() {
  const candles = gsap.utils.toArray('.candle');
  const logo = document.querySelector('.nl-thanks');
  const tl = logoTimeline(logo);
  if (R) { candles.forEach(c => c.classList.add('lit')); showLogoInstant(logo); return; }
  ScrollTrigger.create({
    trigger: '#candles', start: 'top 80%', once: true,
    onEnter: () => {
      const order = [2, 1, 3, 0, 4];
      order.forEach((i, k) => setTimeout(() => {
        candles[i].classList.add('lit');
        gsap.from(candles[i].querySelectorAll('.c-flame, .c-flame-in'), { scale: 0, duration: .6, ease: 'back.out(3)' });
      }, 350 + k * 420));
    },
  });
  gsap.from('.thanks-title', { opacity: 0, scale: .92, duration: 1.6, ease: 'silk', scrollTrigger: st('.thanks-title') });
  gsap.from('.share-btn', { opacity: 0, y: 18, stagger: .08, duration: .9, ease: 'silk', scrollTrigger: st('.share') });
  ScrollTrigger.create({ trigger: logo, start: 'top 90%', once: true, onEnter: () => tl.play() });
}

// ── share buttons ───────────────────────────────────────────────────
function share() {
  const url = location.origin + location.pathname;
  const text = () => `${t('shareText')} ${W.groom.kh} & ${W.bride.kh}`;
  const toast = msg => { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2000); };
  const links = {
    telegram: () => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text())}`,
    messenger: () => (env.coarse ? `fb-messenger://share/?link=${encodeURIComponent(url)}` : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
    facebook: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
  document.querySelectorAll('[data-share]').forEach(el => {
    const k = el.dataset.share;
    if (k === 'copy') {
      el.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(url); }
        catch {
          const ta = Object.assign(document.createElement('textarea'), { value: url });
          document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        }
        toast(t('copied'));
      });
      return;
    }
    const set = () => (el.href = links[k]());
    set(); onLang(set);
  });
}
