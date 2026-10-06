// Convert photos-src/* → public/photos/<name>-{640,1280,2000}.webp
// Auto-rotates by EXIF, then strips ALL metadata (GPS, camera, etc.).
// Writes src/data/gallery.json with sizes + a tiny blurred placeholder.
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'photos-src';
const OUT = 'public/photos';
const WIDTHS = [640, 1280, 2000];

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter(f => /\.(jpe?g|png|webp|heic)$/i.test(f)).sort();
const list = [];

for (const file of files) {
  const name = path.parse(file).name;
  const base = sharp(path.join(SRC, file), { failOn: 'none' }).rotate(); // apply EXIF orientation
  const { width, height } = await base.clone().toBuffer({ resolveWithObject: true }).then(r => r.info);
  for (const w of WIDTHS) {
    await base.clone()
      .resize({ width: Math.min(w, width), withoutEnlargement: true })
      .webp({ quality: w === 640 ? 72 : 78, effort: 5 })
      .toFile(path.join(OUT, `${name}-${w}.webp`)); // sharp drops metadata unless .withMetadata()
  }
  const lqip = await base.clone().resize(24).webp({ quality: 40 }).toBuffer();
  list.push({
    id: name,
    w: width, h: height,
    orientation: width >= height ? 'landscape' : 'portrait',
    src: (w) => `/photos/${name}-${w}.webp`,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
  });
  console.log('✓', name, width + '×' + height);
}

await writeFile('src/data/gallery.json', JSON.stringify(list.map(({ src, ...p }) => p), null, 2));
console.log(`\n${list.length} photos → ${OUT}, list → src/data/gallery.json`);
