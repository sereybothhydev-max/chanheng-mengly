import { wedding as W } from '../data/wedding.js';
import gallery from '../data/gallery.json';
import { t, tx, bi, num, pick } from './i18n.js';
import { envelopeHTML } from './envelope.js';
import { nameLogo } from './logo.js';
import { crest, corners, divider, lotus } from './elements.js';

const src = (id, w) => `${import.meta.env.BASE_URL}photos/${id}-${w}.webp`;
const srcset = id => `${src(id, 640)} 640w, ${src(id, 1280)} 1280w, ${src(id, 2000)} 2000w`;
const img = (id, { sizes = '100vw', cls = '', alt = '', eager = false } = {}) => {
  const p = gallery.find(g => g.id === id);
  return `<img class="${cls}" src="${src(id, 1280)}" srcset="${srcset(id)}" sizes="${sizes}" width="${p?.w || 1600}" height="${p?.h || 1200}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" style="background-image:url(${p?.lqip || ''})">`;
};

const parents = (p, headKey) => `
  <div class="parents">
    <h3 class="parents-h foil-text" data-i18n="${headKey}">${t(headKey)}</h3>
    <p class="parents-line"><span data-i18n="mr">${t('mr')}</span> ${bi(p.father)}</p>
    <p class="parents-line"><span data-i18n="andMrs">${t('andMrs')}</span> ${bi(p.mother)}</p>
  </div>`;

const sectionHead = (key, { light = false } = {}) => `
  <header class="sec-head ${light ? 'on-dark' : ''}">
    ${divider('sec-divider')}
    <h2 class="sec-title foil" data-i18n="${key}" data-reveal="mask">${t(key)}</h2>
  </header>`;

// ── programme line icons (stroke-drawn) ─────────────────────────────
const ICONS = {
  procession: 'M8 32h32M10 32c3 7 25 7 28 0M14 32c0-9 5-15 10-15s10 6 10 15M24 17v-5M19 12h10M17 24h14',
  hair: 'M14 12a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM14 26a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM18 20l22 14M18 28l22-14',
  blessing: 'M24 10c5 7 5 17 0 24c-5-7-5-17 0-24zM24 34c-8-3-13-10-12-19c6 3 10 9 12 19zM24 34c8-3 13-10 12-19c-6 3-10 9-12 19zM12 40h24',
  knot: 'M8 24c6-8 12-8 16 0s10 8 16 0M8 24c6 8 12 8 16 0s10-8 16 0M24 24v14M20 38h8',
  rings: 'M19 20a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM29 16a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM26 9l3 4 3-4',
  reception: 'M14 10h8l-1 10a3 3 0 0 1-6 0zM18 23v13M14 36h8M26 10h8l-1 10a3 3 0 0 1-6 0zM30 23v13M26 36h8',
  monk: 'M8 22c4-8 10-12 16-12s12 4 16 12zM24 22v18M24 10V6',
  photo: 'M8 16h8l3-4h10l3 4h8v20H8zM24 20a6 6 0 1 0 0 12a6 6 0 1 0 0-12z',
};
const icon = k => `<svg class="prog-icon" viewBox="0 0 48 48" aria-hidden="true"><circle class="prog-ring" cx="24" cy="24" r="22"/><path class="prog-path" d="${ICONS[k] || ICONS.blessing}"/></svg>`;

const STORY = [
  { id: '03-walk-away', key: 'story1' },
  { id: '05-dip', key: 'story2' },
  { id: '10-sunglasses', key: 'story3' },
  { id: '09-angkor-embrace', key: 'story4' },
  { id: '06-veil-canopy', key: 'story5' },
];

const SHARE_ICONS = {
  telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#29a9eb"/><path fill="#fff" d="M5.4 11.7l11.2-4.3c.5-.2 1 .1.8.9l-1.9 9c-.1.6-.5.8-1 .5l-2.9-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-2.9 5.3-4.8c.2-.2 0-.3-.3-.1l-6.6 4.1-2.8-.9c-.6-.2-.6-.6.1-.9z"/></svg>',
  messenger: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="msg-g" cx=".2" cy="1" r="1.2"><stop offset="0" stop-color="#0099ff"/><stop offset=".6" stop-color="#a033ff"/><stop offset=".9" stop-color="#ff5280"/><stop offset="1" stop-color="#ff7061"/></radialGradient></defs><path fill="url(#msg-g)" d="M12 1.5C6.1 1.5 1.5 5.8 1.5 11.6c0 3 1.2 5.6 3.3 7.4v3.5l3.2-1.8c1.2.3 2.5.5 4 .5 5.9 0 10.5-4.3 10.5-10.1S17.9 1.5 12 1.5z"/><path fill="#fff" d="M5.7 14.6l3.1-4.9c.5-.8 1.5-1 2.3-.4l2.4 1.8c.2.2.5.2.7 0l3.3-2.5c.4-.3 1 .2.7.6l-3.1 4.9c-.5.8-1.5 1-2.3.4l-2.4-1.8c-.2-.2-.5-.2-.7 0l-3.3 2.5c-.4.3-1-.2-.7-.6z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877f2"/><path fill="#fff" d="M13.4 19.5v-6.3h2.1l.3-2.5h-2.4V9.2c0-.7.2-1.2 1.2-1.2h1.3V5.8c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.8H8.7v2.5h2.1v6.3z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#c9a24e"/><path fill="none" stroke="#1b1f0d" stroke-width="1.8" stroke-linecap="round" d="M10.5 13.5a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.8.8M13.5 10.5a3 3 0 0 0-4.2 0L7 12.8a3 3 0 0 0 4.2 4.2l.8-.8"/></svg>',
};

const candleSVG = i => `<svg class="candle" style="--i:${i}" viewBox="0 0 40 120" aria-hidden="true">
  <defs><radialGradient id="cg${i}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset=".4" stop-color="#f3b54a" stop-opacity=".35"/><stop offset="1" stop-color="#f3b54a" stop-opacity="0"/></radialGradient>
  <linearGradient id="cw${i}" x1="0" x2="1"><stop offset="0" stop-color="#d9cfae"/><stop offset=".45" stop-color="#f6f0dc"/><stop offset="1" stop-color="#bfb38f"/></linearGradient></defs>
  <circle class="c-glow" cx="20" cy="34" r="20" fill="url(#cg${i})"/>
  <rect x="11" y="52" width="18" height="64" rx="2" fill="url(#cw${i})"/>
  <path d="M11 56c3 2 6 1 9 3s6 0 9-2" fill="none" stroke="#fffaf0" stroke-opacity=".6"/>
  <path d="M20 52v-6" stroke="#3a2c14" stroke-width="1.4"/>
  <path class="c-flame" d="M20 30c4 5 5 9 5 11a5 5 0 0 1-10 0c0-3 2-6 5-11z" fill="#ffd36b"/>
  <path class="c-flame-in" d="M20 37c2 3 2.5 4.5 2.5 5.5a2.5 2.5 0 0 1-5 0c0-1.3 1-3 2.5-5.5z" fill="#fff7d6"/>
</svg>`;

export function render() {
  const d = W.date.row;
  const venueName = W.venue.en ? bi(W.venue) : W.venue.kh;
  const mapQ = W.venue.lat != null ? `${W.venue.lat},${W.venue.lng}` : encodeURIComponent(W.venue.kh);

  return `
  <!-- 1 · ENVELOPE SCREEN -->
  <section class="s-envelope" id="envelope" aria-label="Invitation envelope">
    <div class="env-bg">${img('01-field', { sizes: '640px', eager: true })}</div>
    <div class="env-head">
      <h1 class="env-title foil shimmer" data-i18n="envTitle">${t('envTitle')}</h1>
      <p class="env-sub" data-i18n="envSub">${t('envSub')}</p>
    </div>
    ${envelopeHTML()}
    <p class="env-tap"><span class="tap-dot"></span><span data-i18n="envTap">${t('envTap')}</span></p>
  </section>

  <!-- TOP BAR -->
  <header class="topbar" id="topbar">
    <a class="tb-logo" href="#cover" aria-label="Top">${nameLogo({ crest: false, cls: 'nl-mini', animate: false })}</a>
    <div class="tb-actions">
      <button class="tb-btn tb-lang" id="langBtn" type="button"><span data-i18n="langLabel">${t('langLabel')}</span></button>
      <button class="tb-btn tb-music" id="musicBtn" type="button" data-i18n-aria="musicOn" aria-label="${t('musicOn')}">
        <span class="eq"><i></i><i></i><i></i><i></i></span>
      </button>
    </div>
  </header>

  <main id="main" class="main" aria-hidden="true">
    <!-- 2 · COVER -->
    <section class="s-cover" id="cover">
      <div class="cover-bg">
        <picture>
          <source media="(orientation: portrait)" srcset="${srcset('04-raised')}" sizes="100vw">
          ${img('01-field', { sizes: '100vw', eager: true, cls: 'cover-img' })}
        </picture>
        <canvas class="cover-gl" id="coverGL" aria-hidden="true"></canvas>
        <div class="cover-shade"></div>
      </div>
      <div class="cover-corners">${corners('cv-corner')}</div>
      <div class="cover-inner">
        <div class="cv-crest" data-cv>${crest('cv-crest-svg')}</div>
        <p class="cv-title foil shimmer" data-cv data-i18n="coverTitle">${t('coverTitle')}</p>
        <div class="cv-logo">${nameLogo({ crest: false, cls: 'nl-cover' })}</div>
        <p class="cv-en" data-cv>${W.groom.shortEn} <span class="amp">&amp;</span> ${W.bride.shortEn}</p>
        <div data-cv>${divider('cv-divider')}</div>
        <p class="cv-invite" data-cv data-i18n="coverInvite">${t('coverInvite')}</p>
        <div class="cv-row" data-cv>
          <div class="cv-cell"><span class="cv-lab" data-i18n="rowDay">${t('rowDay')}</span>${bi(d.day, 'span', 'cv-val')}</div>
          <div class="cv-cell"><span class="cv-lab" data-i18n="rowDate">${t('rowDate')}</span><span class="cv-val cv-big" data-num="${d.date}">${num(d.date)}</span></div>
          <div class="cv-cell"><span class="cv-lab" data-i18n="rowMonth">${t('rowMonth')}</span>${bi(d.month, 'span', 'cv-val')}</div>
          <div class="cv-cell"><span class="cv-lab" data-i18n="rowYear">${t('rowYear')}</span><span class="cv-val" data-num="${d.year}">${num(d.year)}</span></div>
        </div>
        <p class="cv-lunar" data-cv>${bi({ kh: W.date.lunarKh, en: W.date.lunarEn }, 'span', '', true)}<br>${bi({ kh: W.date.solarKh, en: W.date.solarEn }, 'span', 'cv-solar', true)}</p>
        <p class="cv-venue" data-cv><svg viewBox="0 0 24 24" aria-hidden="true"><path class="kb-line" d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle class="kb-line" cx="12" cy="9.5" r="2.4"/></svg>${venueName}</p>
      </div>
      <a class="cv-scroll" href="#invite" data-cv><span data-i18n="scroll">${t('scroll')}</span><i></i></a>
    </section>

    <!-- 3 · FORMAL INVITATION -->
    <section class="s-invite paper" id="invite">
      ${sectionHead('invHeading')}
      <div class="inv-grid">
        <figure class="arch" data-arch>${img('04-raised', { sizes: '(min-width: 900px) 380px, 70vw', alt: '' })}</figure>
        <div class="inv-text">
          <p class="inv-body" data-reveal="lines" data-i18n="invBody">${t('invBody')}</p>
          <div class="parents-grid">
            ${parents(W.groomParents, 'groomParentsH')}
            ${parents(W.brideParents, 'brideParentsH')}
          </div>
        </div>
      </div>
    </section>

    <!-- 4 · THE COUPLE -->
    <section class="s-couple olive" id="couple">
      ${sectionHead('coupleHeading', { light: true })}
      <div class="couple-grid">
        <div class="couple-person cp-groom" data-person>
          <p class="cp-label" data-i18n="groomLabel">${t('groomLabel')}</p>
          <h3 class="cp-name foil">${bi(W.groom)}</h3>
          <p class="cp-of"><span data-i18n="sonOf">${t('sonOf')}</span></p>
          <p class="cp-par"><span data-i18n="mr">${t('mr')}</span> ${bi(W.groomParents.father)}</p>
          <p class="cp-par"><span data-i18n="andMrs">${t('andMrs')}</span> ${bi(W.groomParents.mother)}</p>
        </div>
        <figure class="scallop" data-scallop>
          <svg class="scallop-ring" viewBox="0 0 200 200" aria-hidden="true"><path id="scallopPath" class="kb-line" d=""/></svg>
          <div class="scallop-img">${img('09-angkor-embrace', { sizes: '(min-width: 900px) 360px, 72vw' })}</div>
          <span class="scallop-heart">${lotus('scallop-lotus')}</span>
        </figure>
        <div class="couple-person cp-bride" data-person>
          <p class="cp-label" data-i18n="brideLabel">${t('brideLabel')}</p>
          <h3 class="cp-name foil">${bi(W.bride)}</h3>
          <p class="cp-of"><span data-i18n="daughterOf">${t('daughterOf')}</span></p>
          <p class="cp-par"><span data-i18n="mr">${t('mr')}</span> ${bi(W.brideParents.father)}</p>
          <p class="cp-par"><span data-i18n="andMrs">${t('andMrs')}</span> ${bi(W.brideParents.mother)}</p>
        </div>
      </div>
    </section>

    <!-- 5 · COUNTDOWN -->
    <section class="s-count dark" id="count">
      <div class="marquee" aria-hidden="true"><div class="marquee-track"><span data-i18n="marquee">${t('marquee')}</span><span data-i18n="marquee">${t('marquee')}</span><span data-i18n="marquee">${t('marquee')}</span><span data-i18n="marquee">${t('marquee')}</span></div></div>
      ${sectionHead('countHeading', { light: true })}
      <p class="count-sub" data-i18n="countSub">${t('countSub')}</p>
      <div class="count-grid" id="countGrid">
        ${['cDays', 'cHours', 'cMins', 'cSecs'].map(k => `<div class="count-cell"><span class="count-num foil" data-unit="${k}">--</span><span class="count-lab" data-i18n="${k}">${t(k)}</span></div>`).join('')}
      </div>
      <p class="count-date">${bi({ kh: W.date.solarKh, en: W.date.solarEn })}</p>
    </section>

    <!-- 6 · PROGRAMME -->
    <section class="s-prog paper" id="programme">
      ${sectionHead('progHeading')}
      <div class="prog">
        <div class="prog-thread" aria-hidden="true"><i class="prog-thread-fill"></i></div>
        ${W.programme.map((p, i) => `
          <div class="prog-item ${i % 2 ? 'is-right' : ''}" data-prog>
            <div class="prog-dot">${icon(p.icon)}</div>
            <div class="prog-card">
              <span class="prog-time" data-num="${p.time}">${num(p.time)}</span>
              ${bi(p, 'span', 'prog-name')}
            </div>
          </div>`).join('')}
      </div>
      ${W.programme.length < 3 ? `<p class="prog-more" data-i18n="progMore">${t('progMore')}</p>` : ''}
    </section>

    <!-- 7 · LOVE STORY -->
    <section class="s-story" id="story">
      <div class="story-sky" aria-hidden="true"><div class="story-sun"></div></div>
      <div class="story-pin">
        <header class="sec-head story-head">${divider('sec-divider')}<h2 class="sec-title foil" data-i18n="storyHeading">${t('storyHeading')}</h2></header>
        <div class="story-track" id="storyTrack">
          ${STORY.map((s, i) => `
            <figure class="story-card" style="--r:${[-2.5, 1.8, -1.2, 2.2, -1.6][i]}deg">
              <div class="story-photo">${img(s.id, { sizes: '(min-width: 900px) 360px, 68vw' })}</div>
              <figcaption><span class="story-no" data-num="${i + 1}">${num(i + 1)}</span><span data-i18n="${s.key}">${t(s.key)}</span></figcaption>
            </figure>`).join('')}
        </div>
      </div>
    </section>

    <!-- 8 · CANDLELIGHT -->
    <section class="s-candle" id="candle">
      <div class="lake" id="lake">
        <div class="lake-sky">${img('08-angkor-walk', { sizes: '100vw', cls: 'lake-img' })}</div>
        <div class="lake-water">
          <div class="lake-refl">${img('08-angkor-walk', { sizes: '100vw', cls: 'lake-img' })}</div>
          <div class="lake-streaks"></div>
          <canvas class="lake-canvas" id="lakeCanvas" aria-hidden="true"></canvas>
          <div class="lanterns" id="lanterns"></div>
        </div>
        <div class="lake-text">
          <h2 class="sec-title foil" data-i18n="candleHeading">${t('candleHeading')}</h2>
          <p class="lake-hint"><span class="tap-dot"></span><span data-i18n="candleHint">${t('candleHint')}</span></p>
        </div>
      </div>
    </section>

    <!-- 9 · GALLERY -->
    <section class="s-gallery dark" id="gallery">
      ${sectionHead('galleryHeading', { light: true })}
      <div class="masonry" id="masonry">
        ${gallery.map((g, i) => `<button class="m-item" data-index="${i}" style="aspect-ratio:${g.w}/${g.h}" aria-label="Photo ${i + 1}">
          <img src="${src(g.id, 640)}" srcset="${src(g.id, 640)} 640w, ${src(g.id, 1280)} 1280w" sizes="(min-width: 900px) 33vw, 50vw" width="${g.w}" height="${g.h}" alt="" loading="lazy" decoding="async" style="background-image:url(${g.lqip})">
        </button>`).join('')}
      </div>
    </section>

    <!-- 10 · VENUE -->
    <section class="s-venue paper" id="venue">
      ${sectionHead('venueHeading')}
      <div class="venue-crest">${crest('venue-crest-svg')}</div>
      <h3 class="venue-name foil">${venueName}</h3>
      <p class="venue-date">${bi({ kh: W.date.solarKh, en: W.date.solarEn })}</p>
      <div class="map-frame" data-unfold>
        <iframe title="Google Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" data-src="https://maps.google.com/maps?q=${mapQ}&z=16&output=embed"></iframe>
      </div>
      <div class="btn-row">
        <a class="btn btn-gold" href="${W.venue.mapUrl}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="9.5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg><span data-i18n="openMaps">${t('openMaps')}</span></a>
        <button class="btn btn-ghost" id="icsBtn" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><span data-i18n="saveCal">${t('saveCal')}</span></button>
      </div>
    </section>

    <!-- 11 · GIFT -->
    <section class="s-gift olive" id="gift">
      ${sectionHead('giftHeading', { light: true })}
      <p class="gift-sub" data-i18n="giftSub">${t('giftSub')}</p>
      <div class="gift-grid">
        ${W.gifts.map(g => `
          <figure class="gift-card" data-gift>
            <div class="gift-qr"><img src="${g.img}" alt="KHQR ${g.holder}" loading="lazy" width="1414" height="2000"></div>
            <figcaption><span class="gift-holder">${g.holder}</span><span class="gift-bank">${g.bank}</span></figcaption>
            <a class="btn btn-gold btn-sm" href="${g.img}" download="${g.file}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span data-i18n="saveQR">${t('saveQR')}</span></a>
          </figure>`).join('')}
      </div>
    </section>

    <!-- 12 · THANK YOU -->
    <section class="s-thanks dark" id="thanks">
      <div class="thanks-bg">${img('07-veil-blur', { sizes: '100vw' })}</div>
      <div class="thanks-inner">
        <div class="candles" id="candles">${[0, 1, 2, 3, 4].map(candleSVG).join('')}</div>
        <h2 class="thanks-title foil shimmer" data-i18n="thanksHeading">${t('thanksHeading')}</h2>
        <p class="thanks-body" data-i18n="thanksBody">${t('thanksBody')}</p>
        <div class="share">
          <a class="share-btn" data-share="telegram" href="#" target="_blank" rel="noopener">${SHARE_ICONS.telegram}<span data-i18n="shareTelegram">${t('shareTelegram')}</span></a>
          <a class="share-btn" data-share="messenger" href="#" target="_blank" rel="noopener">${SHARE_ICONS.messenger}<span data-i18n="shareMessenger">${t('shareMessenger')}</span></a>
          <a class="share-btn" data-share="facebook" href="#" target="_blank" rel="noopener">${SHARE_ICONS.facebook}<span data-i18n="shareFacebook">${t('shareFacebook')}</span></a>
          <button class="share-btn" data-share="copy" type="button">${SHARE_ICONS.copy}<span data-i18n="shareCopy">${t('shareCopy')}</span></button>
        </div>
        <div class="thanks-logo">${nameLogo({ crest: true, cls: 'nl-thanks' })}</div>
      </div>
      <footer class="credit"><a href="${W.credit.url}" target="_blank" rel="noopener">${W.credit.text}</a></footer>
    </section>
  </main>

  <!-- VIEWER -->
  <div class="viewer" id="viewer" role="dialog" aria-modal="true" aria-label="Photo viewer" hidden>
    <div class="viewer-track" id="viewerTrack"></div>
    <button class="viewer-btn viewer-close" id="viewerClose" aria-label="Close">✕</button>
    <button class="viewer-btn viewer-prev" id="viewerPrev" aria-label="Previous">‹</button>
    <button class="viewer-btn viewer-next" id="viewerNext" aria-label="Next">›</button>
    <p class="viewer-count" id="viewerCount"></p>
  </div>
  <div class="toast" id="toast" role="status"></div>`;
}

export { gallery, src, pick };
