import '@fontsource/moul/400.css';
import '@fontsource/moulpali/400.css';
import '@fontsource/kantumruy-pro/300.css';
import '@fontsource/kantumruy-pro/400.css';
import '@fontsource/kantumruy-pro/500.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/pinyon-script/400.css';
import './styles/base.css';
import './styles/envelope.css';
import './styles/cover.css';
import './styles/sections.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { CustomEase } from 'gsap/CustomEase';

import { render } from './js/render.js';
import { apply, setLang, getLang } from './js/i18n.js';
import { layer, idle, openTimeline, prepCardLogo } from './js/envelope.js';
import { logoTimeline, showLogoInstant } from './js/logo.js';
import { initSections } from './js/sections.js';
import { initMusic } from './js/music.js';
import { env } from './js/env.js';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, CustomEase);
CustomEase.create('silk', 'M0,0 C0.22,0.8 0.2,1 1,1');
CustomEase.create('hand', 'M0,0 C0.3,0.05 0.35,0.55 0.5,0.62 0.62,0.68 0.7,0.98 1,1');

// paper textures resolved against the document (works under any base path)
['olive', 'cream', 'lining'].forEach(n =>
  document.documentElement.style.setProperty(`--tex-${n}`, `url("${new URL(`${import.meta.env.BASE_URL}textures/paper-${n}.webp`, document.baseURI).href}")`));

const app = document.getElementById('app');
app.innerHTML = render();
apply();
layer();
prepCardLogo();
// flap/top-bar logos are static copies
document.querySelectorAll('.nl-flap, .nl-mini').forEach(showLogoInstant);

const music = initMusic();
const envEl = document.getElementById('env');
const stopIdle = env.reduced ? () => {} : idle(envEl, env);

// cover entrance (prepared hidden, played after the envelope)
const coverLogo = document.querySelector('.nl-cover');
const coverTl = logoTimeline(coverLogo);
gsap.set('[data-cv]', { opacity: 0, y: 14 });
gsap.set('.cv-corner', { opacity: 0, scale: .85 });

let sectionsReady = false;
function showCover() {
  document.getElementById('envelope').style.display = 'none';
  document.body.classList.remove('is-locked');
  document.body.classList.add('is-open');
  document.getElementById('main').removeAttribute('aria-hidden');
  window.scrollTo(0, 0);
  if (!sectionsReady) { sectionsReady = true; initSections(); }

  const img = document.querySelector('.cover-bg img');
  gsap.fromTo(img, { scale: 1.14 }, { scale: 1, duration: 3.2, ease: 'silk' });
  gsap.to('.cv-corner', { opacity: .9, scale: 1, duration: 1.4, stagger: .1, ease: 'silk', delay: .2 });
  const items = gsap.utils.toArray('[data-cv]');
  gsap.to(items.slice(0, 2), { opacity: 1, y: 0, duration: 1, stagger: .15, ease: 'silk', delay: .2 });
  coverTl.delay(.55).play();
  gsap.to(items.slice(2), { opacity: 1, y: 0, duration: 1.1, stagger: .11, ease: 'silk', delay: 2.1 });
  if (env.reduced) { gsap.set(items, { opacity: 1, y: 0 }); coverTl.progress(1); }
}

let opened = false;
function open() {
  if (opened) return;
  opened = true;
  music.play();
  stopIdle();
  openTimeline({ reduced: env.reduced, onCover: showCover, onDone: () => {} });
}
document.getElementById('envSeal').addEventListener('click', open);
document.querySelector('.env-stage').addEventListener('click', open);

document.getElementById('langBtn').addEventListener('click', () => setLang(getLang() === 'kh' ? 'en' : 'kh'));

// dev / QA helper: ?open skips the envelope
if (new URLSearchParams(location.search).has('open')) { opened = true; stopIdle(); showCover(); }
