// Window elevation renderer: configuration → SVG string (mm units, non-scaling strokes).
// Drawing convention: the triangle tip of an opening symbol points to the hinge side.
import { MATERIALS } from './catalog.js';

let uid = 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * @param cfg  {w,h,m,c,s,o}
 * @param opts {photo:{href}, figure:bool, editable:bool, dims:bool, title:string}
 * @returns {svg, ar, anchors:{w:{x,y}, h:{x,y}}}  anchors in % of the drawing box
 */
export function elevation(cfg, opts = {}) {
  const id = `${typeof window === "undefined" ? "s" : "c"}${++uid}`;
  const W = cfg.w, H = cfg.h;
  const mat = MATERIALS[cfg.m] || MATERIALS.pvc;
  const colour = mat.colours.find(c => c.id === cfg.c) || mat.colours[0];
  const dims = opts.dims !== false;
  const k = (opts.figure ? Math.max(W + 1500, H + 1000, 2400) : Math.max(W, H, 900)) / 1500;
  const g = 120 * k;                 // dimension offset step
  const font = 62 * k;
  const tick = 34 * k;
  const f = mat.frame, sp = mat.sashFace, s = cfg.s, o = cfg.o;
  const parts = [];
  const glass = [];
  const symbols = [];

  // Frame and sashes
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${colour.hex}" class="cut"/>`);
  const inX = f, inW = W - 2 * f, inY = f, inH = H - 2 * f;
  const mul = s > 1 ? f * 0.9 : 0;
  const colW = (inW - mul * (s - 1)) / s;
  const sashEdges = [0];
  for (let i = 0; i < s; i++) {
    const cx = inX + i * (colW + mul);
    if (i > 0) parts.push(`<rect x="${cx - mul}" y="${inY}" width="${mul}" height="${inH}" fill="${colour.hex}" class="view"/>`);
    sashEdges.push(i === s - 1 ? W : cx + colW + mul / 2);
    const t = o[i] || 'n';
    let gx = cx, gy = inY, gw = colW, gh = inH;
    if (t !== 'n') {
      parts.push(`<rect x="${cx}" y="${inY}" width="${colW}" height="${inH}" fill="${colour.hex}" class="view"/>`);
      gx += sp; gy += sp; gw -= 2 * sp; gh -= 2 * sp;
    }
    glass.push(`<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}"/>`);
    const L = (pts) => symbols.push(`<polyline points="${pts.map(p => p.join(',')).join(' ')}"/>`);
    if (t === 'vl' || t === 'kl') L([[gx + gw, gy], [gx, gy + gh / 2], [gx + gw, gy + gh]]);
    if (t === 'vr' || t === 'kr') L([[gx, gy], [gx + gw, gy + gh / 2], [gx, gy + gh]]);
    if (t === 'v' || t === 'kl' || t === 'kr') L([[gx, gy], [gx + gw / 2, gy + gh], [gx + gw, gy]]);
    if (t === 's') {
      const dir = i % 2 === 0 ? 1 : -1, y = gy + gh / 2, a = Math.min(gw * 0.3, 260 * k);
      const x0 = gx + gw / 2 - dir * a, x1 = gx + gw / 2 + dir * a;
      L([[x0, y], [x1, y]]); L([[x1 - dir * a * 0.35, y - a * 0.22], [x1, y], [x1 - dir * a * 0.35, y + a * 0.22]]);
    }
  }

  const photo = opts.photo
    ? `<clipPath id="${id}g">${glass.join('')}</clipPath><image href="${esc(opts.photo.href)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id}g)"/>`
    : '';
  const glassFill = `<g class="glass" fill="${opts.photo ? 'none' : '#DCE4E8'}">${glass.join('')}</g>`;
  const sym = opts.photo
    ? `<g class="sym-halo">${symbols.join('')}</g><g class="sym sym-on-photo">${symbols.join('')}</g>`
    : `<g class="sym">${symbols.join('')}</g>`;

  // Dimensions
  const dimParts = [];
  let minX = 0, minY = 0, maxX = W, maxY = H;
  const anchors = {};
  const hdim = (x1, x2, y, label, showText = true) => {
    dimParts.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`);
    for (const x of [x1, x2]) dimParts.push(`<line x1="${x}" y1="${y + tick * 1.6}" x2="${x}" y2="${y - tick * 1.6}" class="ext"/><line x1="${x - tick}" y1="${y + tick}" x2="${x + tick}" y2="${y - tick}" class="tick"/>`);
    if (showText) dimParts.push(`<text x="${(x1 + x2) / 2}" y="${y - tick * 1.1}" text-anchor="middle" font-size="${font}">${label}</text>`);
  };
  const vdim = (y1, y2, x, label, showText = true) => {
    dimParts.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`);
    for (const y of [y1, y2]) dimParts.push(`<line x1="${x - tick * 1.6}" y1="${y}" x2="${x + tick * 1.6}" y2="${y}" class="ext"/><line x1="${x - tick}" y1="${y + tick}" x2="${x + tick}" y2="${y - tick}" class="tick"/>`);
    if (showText) dimParts.push(`<text x="${x + tick * 1.1}" y="${(y1 + y2) / 2}" font-size="${font}" dominant-baseline="middle" transform="rotate(-90 ${x + tick * 1.1} ${(y1 + y2) / 2})" text-anchor="middle" dy="${font * 0.35}">${label}</text>`);
  };
  if (dims) {
    if (s > 1) {
      const yc = -g;
      for (let i = 0; i < s; i++) hdim(sashEdges[i], sashEdges[i + 1], yc, Math.round(sashEdges[i + 1] - sashEdges[i]));
      minY = yc;
    }
    const yo = s > 1 ? -g * (opts.editable ? 3 : 2.2) : -g * 1.2;
    hdim(0, W, yo, W, !opts.editable);
    anchors.w = { x: W / 2, y: yo };
    minY = yo - (opts.editable ? g * 0.9 : font * 1.4);
    const xh = W + g * 1.2;
    vdim(0, H, xh, H, !opts.editable);
    anchors.h = { x: xh, y: H / 2 };
    maxX = xh + (opts.editable ? g * 2.4 : font * 1.6);
  }

  // Scale figure (1,75 m) and floor line
  let figure = '';
  if (opts.figure) {
    const sill = H >= 1900 ? 0 : 850;
    const floor = H + sill;
    const fx = -950, head = 115;
    const top = floor - 1750;
    figure = `<g class="figure">
      <circle cx="${fx}" cy="${top + head}" r="${head}"/>
      <path d="M${fx - 230} ${top + 2 * head + 60} h460 l-60 760 h-340 z"/>
      <path d="M${fx - 150} ${top + 2 * head + 820} h120 v${1750 - 2 * head - 820} h-120 z M${fx + 30} ${top + 2 * head + 820} h120 v${1750 - 2 * head - 820} h-120 z"/>
    </g>
    <line x1="${fx - 500}" y1="${floor}" x2="${W + 300}" y2="${floor}" class="floor"/>
    <text x="${fx}" y="${floor + font * 1.6}" text-anchor="middle" font-size="${font}" class="fig-label">1,75 m</text>`;
    minX = Math.min(minX, fx - 520);
    maxY = Math.max(maxY, floor + font * 2.2);
    minY = Math.min(minY, top - 40);
    if (sill && dims) vdim(H, floor, -g * 1.2, sill);
  }

  const pad = 40 * k;
  minX -= pad; minY -= pad; maxX += pad; maxY += Math.max(pad, opts.figure ? 0 : pad);
  if (!dims) { minX = -pad; minY = -pad; maxX = W + pad; maxY = H + pad; }
  const vbW = maxX - minX, vbH = maxY - minY;
  const pct = p => p && ({ x: ((p.x - minX) / vbW) * 100, y: ((p.y - minY) / vbH) * 100 });
  const title = opts.title || `Lango vaizdas: ${W} × ${H} mm, ${s} varč.`;
  const svg = `<svg viewBox="${minX} ${minY} ${vbW} ${vbH}" role="img" aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg" class="elev-svg">
  ${parts.join('')}${photo}${glassFill}${sym}
  <g class="dims">${dimParts.join('')}</g>${figure}</svg>`;
  return { svg, ar: vbW / vbH, anchors: { w: pct(anchors.w), h: pct(anchors.h) } };
}

/** Render into a .elev container; positions editable inputs on the dimension lines. */
export function mount(el, cfg, opts = {}) {
  const r = elevation(cfg, opts);
  el.style.setProperty('--ar', r.ar.toFixed(4));
  const holder = el.querySelector('.elev-draw') || el;
  holder.innerHTML = r.svg;
  for (const key of ['w', 'h']) {
    const box = el.querySelector(`.dim-input[data-dim="${key}"]`);
    if (box && r.anchors[key]) { box.style.left = `${r.anchors[key].x}%`; box.style.top = `${r.anchors[key].y}%`; }
  }
  return r;
}
