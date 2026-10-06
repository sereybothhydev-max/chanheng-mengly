// Name logo (ឡូហ្គោឈ្មោះ): groom top-left, bride bottom-right, Moulpali foil,
// joined by a drawn flourish, a heart and a butterfly, under a small crest.
// Khmer is always HTML text layered over SVG, never SVG <text>.
import { wedding } from '../data/wedding.js';
import { crest, butterfly } from './elements.js';
import gsap from 'gsap';

const HEART =
  '<svg class="nl-heart-svg" viewBox="0 0 40 36" aria-hidden="true"><path class="kb-fill" d="M20 34 C8 25 1 18 1 10.5 C1 5 5 1 10.2 1 C14 1 17.4 3.2 20 6.8 C22.6 3.2 26 1 29.8 1 C35 1 39 5 39 10.5 C39 18 32 25 20 34 Z"/><path d="M9 8 C11 5.5 14 5 16 6" fill="none" stroke="#fff6d8" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/></svg>';

// One continuous flourish broken around the heart. Coordinates in a 300×190 box.
const FLOURISH = `<svg class="nl-flourish" viewBox="0 0 300 190" aria-hidden="true">
  <path class="nl-line kb-line" d="M4 103 C30 107 60 105 84 99 C100 95 108 85 100 81 C92 77 86 87 94 92 C106 99 126 95 140 91"/>
  <path class="nl-line kb-line" d="M160 91 C176 88 192 85 206 81 C220 77 228 69 220 65 C212 61 206 71 214 75 C230 83 262 85 296 81"/>
</svg>`;

export function nameLogo({ crest: withCrest = true, cls = '', animate = true } = {}) {
  return `<div class="nlogo ${cls}" ${animate ? 'data-nlogo' : ''} aria-label="${wedding.groom.shortEn} & ${wedding.bride.shortEn}">
    ${withCrest ? `<div class="nl-crest">${crest('nl-crest-svg')}</div>` : ''}
    <div class="nl-box">
      <span class="nl-name nl-g foil" lang="km">${wedding.groom.shortKh}</span>
      ${FLOURISH}
      <span class="nl-heart">${HEART}</span>
      <span class="nl-bf">${butterfly('nl-bf-svg')}</span>
      <span class="nl-name nl-b foil" lang="km">${wedding.bride.shortKh}</span>
    </div>
  </div>`;
}

// Names reveal left→right, flourish draws, heart pops, butterfly flies in.
export function logoTimeline(root, { delay = 0 } = {}) {
  const q = s => root.querySelectorAll(s);
  const tl = gsap.timeline({ delay, paused: true });
  const names = q('.nl-name');
  const lines = q('.nl-line');
  const heart = root.querySelector('.nl-heart');
  const bf = root.querySelector('.nl-bf');
  const cr = root.querySelector('.nl-crest');

  gsap.set(names, { clipPath: 'inset(-40% 110% -40% -10%)' });
  gsap.set(lines, { drawSVG: '0%' });
  gsap.set(heart, { scale: 0, opacity: 0 });
  gsap.set(bf, { opacity: 0, x: '-160%', y: '120%', rotate: -30, scale: .6 });
  if (cr) gsap.set(cr, { opacity: 0, y: 10 });

  if (cr) tl.to(cr, { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, 0);
  tl.to(names[0], { clipPath: 'inset(-40% -10% -40% -10%)', duration: 1.1, ease: 'power2.inOut' }, .1)
    .to(lines[0], { drawSVG: '100%', duration: .9, ease: 'power1.inOut' }, .55)
    .to(heart, { scale: 1, opacity: 1, duration: .55, ease: 'back.out(3)' }, 1.3)
    .to(lines[1], { drawSVG: '100%', duration: .9, ease: 'power1.inOut' }, 1.45)
    .to(names[1], { clipPath: 'inset(-40% -10% -40% -10%)', duration: 1.1, ease: 'power2.inOut' }, 1.7)
    .to(bf, {
      keyframes: [
        { opacity: 1, x: '-80%', y: '40%', rotate: -10, scale: .85, duration: .5, ease: 'sine.out' },
        { x: '-20%', y: '-30%', rotate: 8, duration: .5, ease: 'sine.inOut' },
        { x: '0%', y: '0%', rotate: 0, scale: 1, duration: .5, ease: 'sine.out' },
      ],
    }, 1.9)
    .add(() => {
      gsap.set(names, { clearProps: 'clipPath' });
      bf.classList.add('is-idle');
    });
  return tl;
}

export function showLogoInstant(root) {
  gsap.set(root.querySelectorAll('.nl-name'), { clearProps: 'clipPath' });
  gsap.set(root.querySelectorAll('.nl-line'), { drawSVG: '100%' });
  gsap.set(root.querySelectorAll('.nl-heart, .nl-bf, .nl-crest'), { clearProps: 'all', opacity: 1 });
}
