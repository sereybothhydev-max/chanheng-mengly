// Starter-kit decorative elements, cleaned and inlined.
// The shared "g-foil" gradient + classes live once in index.html, so each
// inline copy drops its own <defs><linearGradient id="g-foil"> and <style>.
import crestRaw from '../elements/crest.svg?raw';
import cornerRaw from '../elements/corner.svg?raw';
import dividerRaw from '../elements/divider.svg?raw';
import butterflyRaw from '../elements/butterfly.svg?raw';
import lotusRaw from '../elements/lotus.svg?raw';
import sealRaw from '../elements/wax-seal.svg?raw';

function clean(raw) {
  return raw
    .replace(/<metadata>[\s\S]*?<\/metadata>/g, '')
    .replace(/<defs><linearGradient id="g-foil"[\s\S]*?<\/linearGradient><\/defs>/, '')
    .replace(/<style>[\s\S]*?<\/style>/, '')
    .replace(/\s*xmlns:c2pa="[^"]*"/, '')
    .trim();
}
const addClass = (svg, cls) => svg.replace('<svg ', `<svg class="${cls}" `);

const CREST = clean(crestRaw);
const CORNER = clean(cornerRaw);
const DIVIDER = clean(dividerRaw);
const BUTTERFLY = clean(butterflyRaw);
const LOTUS = clean(lotusRaw);
// The seal's own defs use ids (wax, wax-lit, wax-press); it is rendered once per page.
const SEAL = clean(sealRaw);

export const crest = (cls = 'crest') => addClass(CREST, cls);
export const divider = (cls = 'divider') => addClass(DIVIDER, cls);
export const butterfly = (cls = 'butterfly') => addClass(BUTTERFLY, cls);
export const lotus = (cls = 'lotus') => addClass(LOTUS, cls);
export const seal = (cls = 'seal-svg') => addClass(SEAL, cls);

// Corner mirrored INSIDE the SVG (on the inner <g>), never with CSS transforms.
const MIRROR = {
  tl: '',
  tr: 'translate(160 0) scale(-1 1)',
  bl: 'translate(0 160) scale(1 -1)',
  br: 'translate(160 160) scale(-1 -1)',
};
export const corner = (pos = 'tl', cls = '') =>
  addClass(CORNER, `corner corner-${pos} ${cls}`).replace('<g transform="">', `<g transform="${MIRROR[pos]}">`);

export const corners = (cls = '') => ['tl', 'tr', 'bl', 'br'].map(p => corner(p, cls)).join('');
