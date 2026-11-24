// Configuration <-> URL query and localStorage. The URL is the source of truth for sharing.
import { MATERIALS, OPENINGS, GLAZING, DEFAULT_CONFIG } from './catalog.js';

const KEY = 'vitra.config.v1';
const int = v => (v === null || v === '' || !/^-?\d+$/.test(String(v).trim())) ? NaN : parseInt(v, 10);

export function fromParams(params, base = DEFAULT_CONFIG) {
  const cfg = structuredClone(base);
  if (params.has('m') && MATERIALS[params.get('m')]) cfg.m = params.get('m');
  if (params.has('w')) cfg.w = int(params.get('w'));
  if (params.has('h')) cfg.h = int(params.get('h'));
  if (params.has('s')) { const s = int(params.get('s')); if ([1, 2, 3].includes(s)) cfg.s = s; }
  if (params.has('g')) { const g = int(params.get('g')); if (GLAZING[g]) cfg.g = g; }
  if (params.has('q')) cfg.q = int(params.get('q'));
  if (params.has('o')) cfg.o = params.get('o').split(',').filter(t => OPENINGS[t]);
  if (params.has('c')) cfg.c = params.get('c');
  return normalise(cfg);
}

/** Keeps dependent choices consistent (colour per material, one opening per sash). */
export function normalise(cfg) {
  const mat = MATERIALS[cfg.m];
  if (!mat.colours.some(c => c.id === cfg.c)) cfg.c = mat.colours[0].id;
  const o = (cfg.o || []).slice(0, cfg.s);
  while (o.length < cfg.s) o.push(o.length === 0 ? 'kl' : 'n');
  cfg.o = o.map(t => mat.openings.includes(t) ? t : 'n');
  return cfg;
}

export function toQuery(cfg) {
  const p = new URLSearchParams({ w: cfg.w, h: cfg.h, m: cfg.m, c: cfg.c, s: cfg.s, o: cfg.o.join(','), g: cfg.g, q: cfg.q });
  return p.toString();
}

export function save(cfg) { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {} }
export function load() {
  try { const raw = localStorage.getItem(KEY); return raw ? fromParams(new URLSearchParams(toQuery(JSON.parse(raw)))) : null; } catch { return null; }
}
export function clear() { try { localStorage.removeItem(KEY); } catch {} }

export function colourName(cfg) { return MATERIALS[cfg.m].colours.find(c => c.id === cfg.c)?.name || ''; }

/** One-line Lithuanian summary, e.g. „1480 × 1460 mm, PVC, 3 varčios, 3 stiklų, 1 vnt.“ */
export function summary(cfg) {
  const s = cfg.s === 1 ? '1 varčia' : `${cfg.s} varčios`;
  return `${cfg.w} × ${cfg.h} mm, ${MATERIALS[cfg.m].name}, ${s}, ${cfg.g} stiklų paketas, ${cfg.q} vnt.`;
}

export function detailLines(cfg) {
  return [
    ['Matmenys', `${cfg.w} × ${cfg.h} mm`],
    ['Medžiaga', MATERIALS[cfg.m].long],
    ['Spalva', colourName(cfg)],
    ['Varčios', cfg.o.map((t, i) => `${i + 1}: ${OPENINGS[t].name.toLowerCase()}`).join('; ')],
    ['Stiklo paketas', GLAZING[cfg.g].name],
    ['Kiekis', `${cfg.q} vnt.`],
  ];
}
