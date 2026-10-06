// Capture the envelope + opening as frames. Usage: node scripts/shoot-envelope.mjs [outDir] [w] [h]
import { chromium } from 'playwright';
const [out = 'qa/envelope', w = 390, h = 844] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, hasTouch: +w < 900, isMobile: +w < 900 });
const errors = [];
page.on('console', m => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', e => errors.push(String(e)));
await page.goto(process.env.BASE || 'http://127.0.0.1:5173/', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
await import('node:fs').then(fs => fs.mkdirSync(out, { recursive: true }));
await page.screenshot({ path: `${out}/00-closed.png` }); console.log('pre-errors', errors);
await page.click('#envSeal', { force: true });
const times = [150, 450, 800, 1300, 1700, 2200, 2700, 3200, 3700, 4200, 4700, 5300, 6200, 8000];
let last = 0;
for (const t of times) {
  await page.waitForTimeout(t - last); last = t;
  await page.screenshot({ path: `${out}/${String(t).padStart(5, '0')}.png` });
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
