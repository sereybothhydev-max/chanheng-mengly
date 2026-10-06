import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errs=[]; p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://127.0.0.1:5173/?open'); await p.waitForTimeout(3000);
await p.evaluate(() => document.getElementById('candle').scrollIntoView()); await p.waitForTimeout(1500);
await p.mouse.click(160, 700); await p.touchscreen.tap(280, 650); await p.waitForTimeout(1600);
console.log('lanterns', await p.evaluate(() => document.getElementById('lanterns').children.length), errs);
await p.screenshot({ path: 'qa/lake.png' }); await p.locator('.lantern').first().screenshot({ path: 'qa/lantern.png' }).catch(()=>{}); await b.close();
