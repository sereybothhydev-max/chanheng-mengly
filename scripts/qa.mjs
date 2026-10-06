// QA: screenshots of every section at 4 viewports + automatic checks.
// Usage: node scripts/qa.mjs [baseUrl] [outDir]
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:5173/';
const out = process.argv[3] || 'qa/sections';
const VIEWPORTS = [[320, 568], [390, 844], [740, 360], [1280, 800]];
const SECTIONS = ['cover', 'invite', 'couple', 'count', 'programme', 'story', 'candle', 'gallery', 'venue', 'gift', 'thanks'];
const lang = process.env.LANG_MODE || 'kh';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const report = [];
for (const [w, h] of VIEWPORTS) {
  const mobile = w < 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(l => { try { localStorage.setItem('lang', l); } catch {} }, lang);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && !/maps\.google|google\.com|gstatic/.test(m.text()) && errors.push(m.text()));
  page.on('pageerror', e => errors.push(String(e)));
  await page.route(/google\.com|gstatic/, r => r.abort()); // map iframe offline in QA
  await page.goto(base + (process.env.QS || '?open'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(4200);
  const dir = `${out}/${w}x${h}`;
  fs.mkdirSync(dir, { recursive: true });

  for (const id of SECTIONS) {
    await page.evaluate(id => {
      const el = document.getElementById(id);
      const y = el.getBoundingClientRect().top + scrollY;
      window.scrollTo(0, y + (id === 'story' ? 2 : 0));
    }, id);
    // slow scroll a bit past so scroll-triggered reveals fire
    await page.waitForTimeout(400);
    await page.mouse.wheel(0, 1);
    await page.waitForTimeout(2600);
    if (id === 'candle') { await page.mouse.click(w * .4, h * .8); await page.mouse.click(w * .7, h * .75); await page.waitForTimeout(1400); }
    await page.screenshot({ path: `${dir}/${id}.png` });
    if (id === 'story') {
      await page.evaluate(() => window.scrollBy(0, innerHeight * 1.4));
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${dir}/story-dusk.png` });
    }
    const sh = await page.evaluate(id => document.getElementById(id).offsetHeight, id);
    if (sh > h * 1.15) {
      // tall sections: one more shot further down
      await page.evaluate(() => window.scrollBy(0, innerHeight * .85));
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${dir}/${id}-2.png` });
      if (sh > h * 2.1) {
        await page.evaluate(() => window.scrollBy(0, innerHeight * .85));
        await page.waitForTimeout(1600);
        await page.screenshot({ path: `${dir}/${id}-3.png` });
      }
    }
  }

  const checks = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const wide = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('.viewer, .marquee, .story-track, .lake-refl, .lake-sky, .env-bg, .s-envelope, .svg-defs')) return;
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 1 || r.left < -1)) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.visibility === 'hidden') return;
        wide.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${Math.round(r.left)},${Math.round(r.right)}]`);
      }
    });
    const canvases = [...document.querySelectorAll('canvas')].map(c => {
      const p = c.parentElement.getBoundingClientRect(), r = c.getBoundingClientRect();
      return { id: c.id, on: getComputedStyle(c).display !== 'none', fill: Math.abs(p.width - r.width) < 2 && Math.abs(p.height - r.height) < 2, px: `${c.width}x${c.height}` };
    });
    const cover = document.getElementById('cover');
    const inner = cover.querySelector('.cover-inner').getBoundingClientRect();
    return {
      scrollW: document.documentElement.scrollWidth, vw,
      wide: [...new Set(wide)].slice(0, 15),
      canvases,
      coverFits: cover.offsetHeight <= innerHeight + 1 && inner.height <= innerHeight + 1,
      coverH: cover.offsetHeight, innerH: Math.round(inner.height),
    };
  });
  report.push({ viewport: `${w}x${h}`, errors, ...checks });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
