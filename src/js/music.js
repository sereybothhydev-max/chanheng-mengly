import { wedding } from '../data/wedding.js';
import { t, onLang } from './i18n.js';

export function initMusic() {
  const btn = document.getElementById('musicBtn');
  const audio = new Audio(wedding.music);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  let want = false;

  const sync = () => {
    const on = !audio.paused;
    btn.classList.toggle('is-playing', on);
    btn.setAttribute('aria-label', t(on ? 'musicOn' : 'musicOff'));
    btn.setAttribute('aria-pressed', on);
  };
  const fadeTo = (v, ms = 1400) => {
    const from = audio.volume, start = performance.now();
    const step = now => {
      const k = Math.min(1, (now - start) / ms);
      audio.volume = from + (v - from) * k;
      if (k < 1) requestAnimationFrame(step); else if (v === 0) audio.pause();
    };
    requestAnimationFrame(step);
  };
  const play = () => {
    want = true;
    audio.play().then(() => { fadeTo(.75); sync(); }).catch(sync);
  };
  const pause = () => { want = false; fadeTo(0, 500); setTimeout(sync, 520); };

  btn.addEventListener('click', () => (audio.paused || !want ? play() : pause()));
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) audio.pause();
    else if (!document.hidden && want) audio.play().catch(() => {});
  });
  onLang(sync);
  sync();
  return { play, pause, audio };
}
