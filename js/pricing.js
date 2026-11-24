// Indicative price: pure functions, no DOM. Rates live in catalog.js ([DEMO]).
import { MATERIALS, OPENINGS, GLAZING, RULES } from './catalog.js';

const mm = n => Number.isFinite(n) ? n : NaN;

/** Returns a list of problems in Lithuanian; empty list = configuration is buildable. */
export function validate(cfg) {
  const errors = [];
  const mat = MATERIALS[cfg.m];
  if (!mat) return [{ field: 'm', msg: 'Pasirinkite medžiagą.' }];
  const w = mm(cfg.w), h = mm(cfg.h);
  if (!Number.isInteger(w)) errors.push({ field: 'w', msg: 'Įveskite plotį milimetrais, sveikuoju skaičiumi.' });
  else if (w < mat.width[0] || w > mat.width[1]) errors.push({ field: 'w', msg: `${mat.name}: plotis turi būti nuo ${mat.width[0]} iki ${mat.width[1]} mm.` });
  if (!Number.isInteger(h)) errors.push({ field: 'h', msg: 'Įveskite aukštį milimetrais, sveikuoju skaičiumi.' });
  else if (h < mat.height[0] || h > mat.height[1]) errors.push({ field: 'h', msg: `${mat.name}: aukštis turi būti nuo ${mat.height[0]} iki ${mat.height[1]} mm.` });
  if (![1, 2, 3].includes(cfg.s)) errors.push({ field: 's', msg: 'Varčių gali būti 1–3.' });
  if (!mat.colours.some(c => c.id === cfg.c)) errors.push({ field: 'c', msg: 'Ši spalva šiai medžiagai negalima.' });
  if (!GLAZING[cfg.g]) errors.push({ field: 'g', msg: 'Pasirinkite stiklo paketą.' });
  if (!Number.isInteger(cfg.q) || cfg.q < 1 || cfg.q > RULES.maxQty) errors.push({ field: 'q', msg: `Kiekis – nuo 1 iki ${RULES.maxQty}.` });
  const o = cfg.o || [];
  if (o.length !== cfg.s || o.some(t => !OPENINGS[t])) errors.push({ field: 'o', msg: 'Nurodykite kiekvienos varčios atidarymą.' });
  else {
    o.forEach((t, i) => { if (!mat.openings.includes(t)) errors.push({ field: `o${i}`, msg: `${mat.name}: ${OPENINGS[t].name.toLowerCase()} varčia negalima.` }); });
    if (o.includes('s') && (cfg.s < 2 || o.filter(t => t === 's').length < 1 || o.some(t => t !== 's' && t !== 'n')))
      errors.push({ field: 'o', msg: 'Slankiojama sistema: bent 2 varčios, kitos – tik nevarstomos.' });
    if (errors.length === 0 && Number.isInteger(w)) {
      const sw = Math.round(w / cfg.s);
      o.forEach((t, i) => {
        if (t === 'n' && sw > RULES.fixedMax) errors.push({ field: `o${i}`, msg: `Nevarstoma dalis negali būti platesnė nei ${RULES.fixedMax} mm – pridėkite varčią.` });
        if (t !== 'n' && (sw < mat.sash[0] || sw > mat.sash[1])) errors.push({ field: `o${i}`, msg: `Atidaroma varčia būtų ${sw} mm pločio; ${mat.name.toLowerCase()} leidžia ${mat.sash[0]}–${mat.sash[1]} mm. Keiskite plotį arba varčių skaičių.` });
      });
    }
  }
  return errors;
}

const round2 = n => Math.round(n * 100) / 100;
const round10 = n => Math.round(n / 10) * 10;

/** Indicative estimate with every line of the working. Returns null when invalid. */
export function estimate(cfg) {
  if (validate(cfg).length) return null;
  const mat = MATERIALS[cfg.m];
  const colour = mat.colours.find(c => c.id === cfg.c);
  const realArea = (cfg.w * cfg.h) / 1e6;
  const area = Math.max(realArea, RULES.minArea);
  const perimeter = 2 * (cfg.w + cfg.h) / 1000;
  const lines = [];
  const add = (key, label, value) => { lines.push({ key, label, value: round2(value) }); return value; };
  let unit = 0;
  unit += add('base', `${mat.name}, ${fmtNum(area, 2)} m² × ${mat.rate} €/m²${realArea < RULES.minArea ? ` (mažiausias apskaitomas plotas ${fmtNum(RULES.minArea, 1)} m²)` : ''}`, area * mat.rate);
  const sashExtra = cfg.o.reduce((sum, t) => sum + OPENINGS[t].extra, 0);
  unit += add('openings', `Atidarymo furnitūra: ${cfg.o.map(t => OPENINGS[t].short).join(', ')}`, sashExtra);
  if (GLAZING[cfg.g].extraM2) unit += add('glazing', `${GLAZING[cfg.g].name}, ${fmtNum(area, 2)} m² × ${GLAZING[cfg.g].extraM2} €/m²`, area * GLAZING[cfg.g].extraM2);
  if (colour.pct) unit += add('colour', `Spalva „${colour.name}“ +${Math.round(colour.pct * 100)} %`, unit * colour.pct);
  const install = add('install', `Montavimas: ${RULES.installBase} € + ${fmtNum(perimeter, 2)} m perimetro × ${RULES.installPerimeter} €/m`, RULES.installBase + perimeter * RULES.installPerimeter);
  const perUnit = unit + install;
  const net = perUnit * cfg.q;
  const vat = net * RULES.vat;
  const total = net + vat;
  return {
    lines, area: round2(area), perUnit: round2(perUnit), qty: cfg.q,
    net: round2(net), vat: round2(vat), total: round2(total),
    low: round10(total * (1 - RULES.spread)), high: round10(total * (1 + RULES.spread)),
  };
}

const nf0 = new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 0 });
export function fmtNum(n, d = 0) { return new Intl.NumberFormat('lt-LT', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n); }
export function eur(n) { return `${nf0.format(Math.round(n))} €`; }
export function range(est) { return est ? `${nf0.format(est.low)}–${nf0.format(est.high)} €` : '—'; }
