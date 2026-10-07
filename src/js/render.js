import { wedding as W } from '../data/wedding.js';
import gallery from '../data/gallery.json';
import { t, tx, bi, num, pick, toKhDigits, getLang } from './i18n.js';
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
  // spirit-house shrine (Krong Pali)
  shrine: 'M10 22L24 11l14 11M8 20c1 2 2 2.5 4 2M40 20c-1 2-2 2.5-4 2M14 22v14M34 22v14M10 36h28M19 36v-8h10v8M24 11V7M22 31h4',
  // monk seated in meditation
  monk: 'M24 10.5a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM16 35c0-9 3.5-14 8-14s8 5 8 14M20 23l9 11M11 37c4-2 9-2.5 13-2.5s9 .5 13 2.5',
  // hanging lantern with flame
  lantern: 'M24 6v5M19 11h10M18 13c-3.5 5-3.5 16 0 21h12c3.5-5 3.5-16 0-21zM18 34h12M21 38h6M24 34v4M24 19c2.2 2.6 2.2 5.4 0 7c-2.2-1.6-2.2-4.4 0-7z',
  // gathering of guests
  guests: 'M17 15a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM31 15a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM9 35c0-6 3.5-9.5 8-9.5s8 3.5 8 9.5M23 35c0-6 3.5-9.5 8-9.5s8 3.5 8 9.5M24 10.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z',
  // stacked offering tray (chenoun)
  procession: 'M9 33h30M11 33c3 6 23 6 26 0M15 33c0-8 4-13 9-13s9 5 9 13M18 20c0-4 3-7 6-7s6 3 6 7M24 13V9M21 9h6M17 27h14',
  // brass urn / covered bowl (sla dok)
  urn: 'M15 25h18M16 25c0 7 3.5 11 8 11s8-4 8-11M17 25c1-6 4-9 7-9s6 3 7 9M24 16v-3M21.5 13h5M20 36h8l2 3H18z',
  // wedding rings with a heart
  rings: 'M19 20a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM29 20a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM24 15.5l-3.6-3.4c-1.6-1.6-.6-4.2 1.6-4.2c1 0 1.6.5 2 1.2c.4-.7 1-1.2 2-1.2c2.2 0 3.2 2.6 1.6 4.2z',
  // scissors and comb (hair cutting)
  hair: 'M14 11a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9zM14 24a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9zM18 18l16 9M18 26l16-9M10 39h28M12 39v-3M16 39v-3M20 39v-3M24 39v-3M28 39v-3M32 39v-3M36 39v-3',
  // hands joined in sampeah, blessing thread tied at the wrists
  knot: 'M17 38V25c0-6 3.5-11.5 7-14c3.5 2.5 7 8 7 14v13M24 11v21M14.5 30c4 2.2 15 2.2 19 0M14.5 30c-1.8 1-2.5 3-1.6 4.5M33.5 30c1.8 1 2.5 3 1.6 4.5',
  // plate with fork and knife
  dining: 'M24 16a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM24 20a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM10 12v6a2 2 0 0 0 4 0v-6M12 12v26M37 12c-3 3-3 10 0 12v14',
  // two glasses clinking
  toast: 'M13 14h8l-.8 9a3.2 3.2 0 0 1-6.4 0zM17 26v10M13.5 36h7M27 14h8l-.8 9a3.2 3.2 0 0 1-6.4 0zM31 26v10M27.5 36h7M24 9V6M20 10l-1.5-2.5M28 10l1.5-2.5',
  blessing: 'M24 10c5 7 5 17 0 24c-5-7-5-17 0-24zM24 34c-8-3-13-10-12-19c6 3 10 9 12 19zM24 34c8-3 13-10 12-19c-6 3-10 9-12 19zM12 40h24',
};
const icon = k => `<svg class="prog-icon" viewBox="4 4 40 40" aria-hidden="true"><path class="prog-path" d="${ICONS[k] || ICONS.blessing}"/></svg>`;

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
  const venueName = W.venue.en ? bi(W.venue) : W.venue.kh.split(' ').map(w => `<span class="nw">${w}</span>`).join(' ');
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
        </div>
        <figure class="scallop" data-scallop>
          <svg class="scallop-ring" viewBox="0 0 200 200" aria-hidden="true"><path id="scallopPath" class="kb-line" d=""/></svg>
          <div class="scallop-img">${img('09-angkor-embrace', { sizes: '(min-width: 900px) 360px, 72vw' })}</div>
          <span class="scallop-heart">${lotus('scallop-lotus')}</span>
        </figure>
        <div class="couple-person cp-bride" data-person>
          <p class="cp-label" data-i18n="brideLabel">${t('brideLabel')}</p>
          <h3 class="cp-name foil">${bi(W.bride)}</h3>
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

    <!-- 6 · PROGRAMME (laid out like the printed card) -->
    <section class="s-prog paper" id="programme">
      <div class="prog-panel">
        ${corners('pp-corner')}
        <header class="pp-head" data-reveal-head>
          <h2 class="pp-title foil" data-i18n="progHeading">${t('progHeading')}</h2>
          <p class="pp-title2 foil" data-i18n="progHeading2">${t('progHeading2')}</p>
        </header>
        ${W.programme.map(d => `
          <h3 class="pd-head" data-prog-day>${bi(d.day, 'span', 'pd-label')} ${bi(d.date, 'span', 'pd-date', true)}</h3>
          <div class="prog-list">
            <div class="pl-line" aria-hidden="true"><i class="pl-fill"></i></div>
            ${d.items.map(p => {
              const [clockEn, ampm] = p.timeEn.split(' ');
              return `
            <div class="prog-row" data-prog>
              <span class="pr-icon slide-in-left">${icon(p.icon)}</span>
              <span class="pr-node pop-in" aria-hidden="true"><svg viewBox="0 0 20 20"><path class="kb-fill" d="M10 1.5l2.6 5.9 5.9 2.6-5.9 2.6L10 18.5l-2.6-5.9L1.5 10l5.9-2.6z"/><circle cx="10" cy="10" r="1.8" fill="#f2ecda"/></svg></span>
              <div class="pr-text slide-in-right">
                <span class="pr-time" data-kh="ម៉ោង ${toKhDigits(p.time)} ${p.periodKh}" data-en="${clockEn} ${ampm}">${getLang() === 'en' ? p.timeEn : `ម៉ោង ${toKhDigits(p.time)} ${p.periodKh}`}</span>
                ${bi(p, 'span', 'pr-name', true)}
              </div>
            </div>`;
            }).join('')}
          </div>`).join('')}
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
          <p class="lake-hint"><span data-i18n="candleHint">${t('candleHint')}</span></p>
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
        <a class="map-fallback" href="${W.venue.mapUrl}" target="_blank" rel="noopener" aria-label="Google Maps">
          <svg class="mf-art" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="800" height="500" fill="#ece4cc"/>
            <g fill="#dfd5b6"><rect x="40" y="40" width="190" height="120" rx="8"/><rect x="260" y="30" width="150" height="150" rx="8"/><rect x="560" y="40" width="210" height="110" rx="8"/><rect x="40" y="330" width="230" height="130" rx="8"/><rect x="600" y="300" width="170" height="170" rx="8"/><rect x="300" y="350" width="130" height="110" rx="8"/></g>
            <g fill="#cfd7a8" opacity=".85"><path d="M440 30h90v120h-90z"/><circle cx="160" cy="250" r="44"/><path d="M470 330c40-10 90 0 110 30v100H450z"/></g>
            <path d="M-20 300C120 270 220 330 360 300S600 220 820 250" fill="none" stroke="#b9cdd0" stroke-width="26" stroke-linecap="round" opacity=".8"/>
            <g fill="none" stroke="#fffaf0" stroke-linecap="round"><path d="M0 200H800" stroke-width="16"/><path d="M245 0V500" stroke-width="14"/><path d="M545 0V500" stroke-width="12"/><path d="M0 395C200 380 420 410 800 380" stroke-width="10"/><path d="M430 0L330 500" stroke-width="7"/></g>
            <g fill="none" stroke="#d6c9a2" stroke-dasharray="2 10" stroke-linecap="round" stroke-width="2"><path d="M0 200H800"/><path d="M245 0V500"/></g>
            <circle cx="400" cy="250" r="70" fill="#d9b15a" opacity=".18" class="mf-pulse"/>
            <circle cx="400" cy="250" r="38" fill="#d9b15a" opacity=".22"/>
          </svg>
          <span class="mf-pin"><svg viewBox="0 0 40 52" aria-hidden="true"><path d="M20 51C20 51 3 31 3 19A17 17 0 0 1 37 19C37 31 20 51 20 51Z" fill="url(#g-foil)" stroke="#7a5517" stroke-width="1.2"/><circle cx="20" cy="19" r="6.5" fill="#2a2f16"/></svg></span>
          <span class="mf-card">
            <span class="mf-name">${venueName}</span>
            <span class="mf-cta"><span data-i18n="openMaps">${t('openMaps')}</span> ↗</span>
          </span>
        </a>
      </div>
      <div class="btn-row">
        <a class="btn btn-gold" href="${W.venue.mapUrl}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="9.5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg><span data-i18n="openMaps">${t('openMaps')}</span></a>
        <button class="btn btn-ghost" id="icsBtn" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><span data-i18n="saveCal">${t('saveCal')}</span></button>
      </div>
    </section>

    <!-- 11 · STATEMENT OF GRATITUDE -->
    <section class="s-grat olive" id="gratitude">
      <div class="grat-frame">
        <div class="grat-crest">${crest('grat-crest-svg')}</div>
        <h2 class="grat-title foil" data-i18n="gratHeading">${t('gratHeading')}</h2>
        ${divider('grat-divider')}
        <p class="grat-body" data-reveal="lines" data-i18n="gratBody">${t('gratBody')}</p>
      </div>
      <div class="grat-frame grat-frame--apology">
        <h2 class="grat-title foil" data-i18n="apologyHeading">${t('apologyHeading')}</h2>
        ${divider('grat-divider')}
        <p class="grat-body" data-reveal="lines" data-i18n="apologyBody">${t('apologyBody')}</p>
      </div>
    </section>

    <!-- 12 · THANK YOU -->
    <section class="s-thanks dark" id="thanks">
      <div class="thanks-bg">${img('07-veil-blur', { sizes: '100vw' })}</div>
      <canvas class="fireworks" id="fireworks" aria-hidden="true"></canvas>
      <div class="thanks-inner">
        <div class="fw-space" aria-hidden="true"></div>
        <h2 class="thanks-title foil shimmer" data-i18n="thanksHeading">${t('thanksHeading')}</h2>
        <p class="thanks-body" data-i18n="thanksBody">${t('thanksBody')}</p>
        <div class="thanks-logo">${nameLogo({ crest: true, cls: 'nl-thanks' })}</div>
      </div>
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
