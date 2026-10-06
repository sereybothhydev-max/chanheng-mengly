// Render public/og.jpg (1200×630) from scripts/og.html via the dev server.
import { chromium } from 'playwright';
import sharp from 'sharp';
const base = process.argv[2] || 'http://127.0.0.1:5173';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(base + '/scripts/og.html', { waitUntil: 'load' });
await p.waitForSelector('body[data-ready]');
await p.waitForTimeout(500);
const png = await p.screenshot();
await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og.jpg');
await b.close();
console.log('public/og.jpg written');
