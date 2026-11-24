// Assembles static pages: src/pages/*.html + generated series pages + shared head/header/footer → ./*.html
// Each source page starts with a JSON comment: <!--{"title":"…","description":"…","nav":"langai","preload":"assets/img/…","scripts":["js/home.js"]}-->
// Run: node scripts/pages.mjs  (also used as qa.config.json preview.build)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { elevation } from '../js/drawing.js';
import { PROJECTS, MATERIAL_LABEL, PRODUCT_LABEL, BUILDING_LABEL } from '../js/data.js';
import { SERIES, DOORS } from '../js/products.js';
import { MATERIALS, OPENINGS, DEFAULT_CONFIG } from '../js/catalog.js';
import { toQuery, normalise } from '../js/state.js';
import { validate } from '../js/pricing.js';

const SITE = 'https://ehodazas.github.io/vitra'; // demo host
const full = cfg => normalise({ c: '', g: 3, q: 1, ...cfg });
for (const p of [...PROJECTS, ...SERIES]) if (validate(full(p.cfg)).length) throw new Error(`${p.id}: ${JSON.stringify(validate(full(p.cfg)))}`);

// ---------- Building blocks ----------
function elevBlock({ cfg, opts = {}, cls = '', maxh, inputs = false, testid }) {
  const r = elevation(full(cfg), opts);
  const style = `--ar:${r.ar.toFixed(4)}${maxh ? `;--maxh:${maxh}` : ''}`;
  const inp = !inputs ? '' : ['w', 'h'].map(k => `<label class="dim-input" data-dim="${k}" style="left:${r.anchors[k].x.toFixed(2)}%;top:${r.anchors[k].y.toFixed(2)}%"><span class="visually-hidden">${k === 'w' ? 'Angos plotis' : 'Angos aukštis'}, mm</span><input name="${k}" type="number" inputmode="numeric" min="400" max="4500" step="10" value="${cfg[k]}" data-testid="dim-${k}" aria-describedby="hero-error"><span aria-hidden="true">mm</span></label>`).join('');
  return `<div class="elev ${cls}" style="${style}"${testid ? ` data-testid="${testid}"` : ''}>${inp}<div class="elev-draw">${r.svg}</div></div>`;
}
export function renderBlock(cfg, { cls = '', title, vt } = {}) {
  const r = elevation(full(cfg), { render: true, title });
  return `<div class="render ${cls}" style="--ar:${r.ar.toFixed(4)}${vt ? `;view-transition-name:${vt}` : ''}" data-render data-cfg='${JSON.stringify(full(cfg))}'>${r.svg}</div>`;
}
const pic = (p, sizes, cls = '', load = 'lazy', extra = '') => {
  const sm = p.iw === 1600 ? 800 : 640;
  const mid = existsSync(`assets/img/${p.img}-960.webp`) ? `, assets/img/${p.img}-960.webp 960w` : '';
  return `<img class="${cls}" src="assets/img/${p.img}-${sm}.webp" srcset="assets/img/${p.img}-${sm}.webp ${sm}w${mid}, assets/img/${p.img}-${p.iw}.webp ${p.iw}w" sizes="${sizes}" width="${p.iw}" height="${p.ih}" alt="${p.alt}" ${load === 'lcp' ? 'fetchpriority="high"' : load === 'eager' ? '' : 'loading="lazy"'} decoding="async"${extra}>`;
};
// Opening-type icon: drawing convention, triangle tip on the hinge side.
export function otype(t) {
  const L = pts => `<polyline points="${pts}"/>`;
  const g = { vl: L('35,5 5,24 35,43'), vr: L('5,5 35,24 5,43'), v: L('5,5 20,43 35,5'), kl: L('35,5 5,24 35,43') + L('5,5 20,43 35,5'), kr: L('5,5 35,24 5,43') + L('5,5 20,43 35,5'), n: '', s: L('9,24 31,24') + L('25,18 31,24 25,30') }[t];
  return `<svg class="otype" viewBox="0 0 40 48" aria-hidden="true"><rect x="2" y="2" width="36" height="44"/>${g}</svg>`;
}
const swatches = (material, { name = 'Rėmo spalva', target, current } = {}) => {
  const cols = MATERIALS[material].colours;
  return `<div class="sw-group" data-swatches${target ? ` data-target="${target}"` : ''}>
    <span class="tb-k" id="sw-${target || material}">${name}</span>
    <ul class="swatches" aria-labelledby="sw-${target || material}">${cols.map((c, i) => `<li><button type="button" class="swatch-btn" style="--sw:${c.hex}" data-colour="${c.id}" data-hex="${c.hex}" data-name="${c.name}" aria-pressed="${(current ? c.id === current : i === 0)}" data-testid="swatch"><span class="visually-hidden">${c.name}</span></button></li>`).join('')}</ul>
    <p class="swatch-name" aria-live="polite">${(cols.find(c => c.id === current) || cols[0]).name}</p></div>`;
};

// ---------- Data-driven sections ----------
function seriesBand() {
  return SERIES.map((s, i) => `<article class="sb sb-${i + 1}">
    <a class="sb-link" href="${s.page}" aria-label="${s.name} – ${s.kind}">
      <div class="sb-plinth">${renderBlock(s.cfg, { cls: 'sb-render', title: `${s.name} langas`, vt: `render-${s.id}` })}</div>
    </a>
    <div class="sb-text">
      <h3><a href="${s.page}">${s.name}</a></h3>
      <p class="sb-kind">${s.kind}</p>
      <p class="sb-lead">${s.lead}</p>
      ${swatches(s.material, { target: `render-${s.id}`, current: s.cfg.c })}
    </div>
  </article>`).join('');
}

function doorsList() {
  return DOORS.map((d, i) => `<article class="door door-${i + 1}" id="${d.id}">
    <figure class="door-fig"${i ? ` data-reveal="${i % 2 ? 'left' : 'up'}"` : ''}>${pic(d.photo, '(min-width: 900px) 40vw, 100vw', '', i === 0 ? 'lcp' : 'lazy')}</figure>
    <div class="door-text">
      <p class="tb-k">${d.kind} · ${d.materials}</p>
      <h2>${d.name} <span class="demo">[DEMO]</span></h2>
      <p class="lead">${d.lead}</p>
      <dl class="spec-mini">${d.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <a class="btn" href="uzklausa.html?produktas=${encodeURIComponent(`${d.name} – ${d.kind}`)}" data-testid="door-cta">Užklausa dėl ${d.name} durų</a>
    </div>
  </article>`).join('');
}

function seriesRows() {
  return SERIES.map((s, i) => `<article class="sr sr-${i + 1}">
    <figure class="sr-photo"${i ? ` data-reveal="${i % 2 ? 'left' : 'right'}"` : ''}>${pic(s.photo, '(min-width: 900px) 58vw, 100vw', '', i === 0 ? 'lcp' : 'lazy')}</figure>
    <div class="sr-text">
      <p class="tb-k">${s.kind}</p>
      <h2><a href="${s.page}">${s.name}</a> <span class="demo">[DEMO]</span></h2>
      <p>${s.lead}</p>
      <div class="sr-render">${renderBlock(s.cfg, { title: `${s.name} langas`, vt: `render-${s.id}` })}</div>
      <a class="arrow-link" href="${s.page}" data-testid="series-link">Apie ${s.name} sistemą</a>
    </div>
  </article>`).join('');
}

function typeGrid() {
  const types = [
    ['vl', 'Varstomas', 'Atsidaro į vidų kaip durys.', { s: 1, o: ['vl'], w: 800, h: 1400 }],
    ['kl', 'Varstomas-verčiamas', 'Dažniausias: atveriamas ir pravėdinamas.', { s: 1, o: ['kl'], w: 900, h: 1400 }],
    ['v', 'Verčiamas', 'Vėdinimui viršuje ar vonioje.', { s: 1, o: ['v'], w: 900, h: 600 }],
    ['n', 'Nevarstomas', 'Didžiausias stiklas, mažiausia kaina.', { s: 1, o: ['n'], w: 1200, h: 1400 }],
    ['s', 'Slankiojamas', 'Didelės angos į terasą.', { s: 2, o: ['s', 'n'], w: 2400, h: 2200, m: 'aliuminis', c: 'ral7016' }],
  ];
  return types.map(([t, name, text, c]) => `<li><a class="tg-item" href="konfiguratorius.html?${toQuery(full({ m: 'pvc', ...c }))}" data-testid="type-link">${otype(t)}<span><strong>${name}</strong><span class="muted">${text}</span></span></a></li>`).join('');
}

const pick = id => PROJECTS.find(p => p.id === id);
function gallery() {
  return PROJECTS.map((p, i) => `<article class="proj" data-testid="filter-item" data-material="${p.material}" data-product="${p.product.join(' ')}" data-building="${p.building}" id="${p.id}">
    <button type="button" class="proj-open" data-testid="gallery-item" aria-haspopup="dialog" aria-controls="projektas">
      <span class="proj-media">${pic(p, i === 0 ? '(min-width: 1100px) 60vw, (min-width: 700px) 50vw, 100vw' : '(min-width: 1100px) 30vw, (min-width: 700px) 50vw, 100vw', 'proj-img', i === 0 ? 'lcp' : i === 1 ? 'eager' : 'lazy')}</span>
      <span class="proj-cap">
        <span class="proj-title">${p.title}</span>
        <span class="proj-tags">${p.place} · ${MATERIAL_LABEL[p.material]} · ${p.product.map(x => PRODUCT_LABEL[x]).join(', ')}</span>
      </span>
    </button>
    <template class="proj-detail">
      <p>${p.text} <span class="demo">[DEMO]</span></p>
      ${elevBlock({ cfg: p.cfg, opts: { title: `${p.mark}: pagrindinio lango brėžinys` }, cls: 'detail', maxh: '30svh' })}
      <p><a class="btn btn-line" href="konfiguratorius.html?${toQuery(full(p.cfg))}">Konfigūruoti panašų langą</a></p>
    </template>
  </article>`).join('\n');
}

function homeProjects() {
  const a = pick('moletai'), b = pick('kacergine');
  return `<figure class="pm-a" data-reveal="up">${pic(a, '(min-width: 900px) 58vw, 100vw')}<figcaption>${a.title}, ${a.place} <span class="demo">[DEMO]</span></figcaption></figure>
    <figure class="pm-b" data-reveal="left">${pic({ img: 'detale-rankena-durys', iw: 1000, ih: 1000, alt: 'Pilka durų rankena ant tamsios varčios' }, '(min-width: 900px) 24vw, 50vw')}</figure>
    <figure class="pm-c" data-reveal="right">${pic(b, '(min-width: 900px) 30vw, 100vw')}<figcaption>${b.title}, ${b.place} <span class="demo">[DEMO]</span></figcaption></figure>`;
}

// ---------- Series page (generated) ----------
function seriesPage(s) {
  const mat = MATERIALS[s.material];
  const related = PROJECTS.filter(p => p.material === s.material).slice(0, 3);
  const others = SERIES.filter(x => x.id !== s.id);
  return `<!--${JSON.stringify({ title: `${s.name} – ${s.kind.toLowerCase()} | VITRA`, description: `${s.name}: ${s.lead} Spalvos, techniniai duomenys ir konfigūratorius.`, nav: 'langai', styles: ['css/catalog.css'] })}-->
<nav class="wrap crumbs" aria-label="Kelias"><a href="langai.html">Langai</a> <span aria-hidden="true">/</span> <span aria-current="page">${s.name}</span></nav>
<section class="wrap pp" aria-labelledby="h1" data-series="${s.id}">
  <div class="pp-media">
    <figure class="pp-photo">${pic(s.photo, '(min-width: 1000px) 55vw, 100vw', '', 'lcp')}</figure>
    <div class="pp-stage" data-testid="product-render">${renderBlock(s.cfg, { title: `${s.name} langas`, vt: `render-${s.id}` })}</div>
  </div>
  <div class="pp-info">
    <p class="tb-k">${s.kind}</p>
    <h1 id="h1">${s.name} <span class="demo">[DEMO]</span></h1>
    <p class="lead">${s.lead}</p>
    ${swatches(s.material, { target: 'pp', current: s.cfg.c })}
    <div class="pp-actions">
      <a class="btn" href="konfiguratorius.html?${toQuery(full(s.cfg))}" data-testid="series-configure">Konfigūruoti ${s.name}</a>
      <a class="arrow-link" href="uzklausa.html?produktas=${encodeURIComponent(`${s.name} – ${s.kind}`)}">Užsakyti matavimą</a>
    </div>
  </div>
</section>
<section class="wrap section pp-specs" aria-labelledby="specs-h">
  <div class="pp-specs-text">
    <h2 id="specs-h">Techniniai duomenys</h2>
    <p class="muted">Duomenys pavyzdiniai <span class="demo">[DEMO]</span>. Tikslias konkrečios sistemos vertes nurodome pasiūlyme.</p>
    <figure class="pp-detail" data-reveal="up">${pic(s.detail, '(min-width: 900px) 30vw, 100vw')}</figure>
  </div>
  <div>
    <table class="spec-table" data-testid="spec-table"><caption class="visually-hidden">${s.name} techniniai duomenys</caption>
      <tbody>${s.specs.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}
      <tr><th scope="row">Spalvos</th><td>${mat.colours.map(c => c.name).join(', ')}</td></tr></tbody></table>
    <h3 class="pp-h3">Atidarymo tipai</h3>
    <ul class="pp-types">${mat.openings.map(t => `<li>${otype(t)}<span>${OPENINGS[t].name}</span></li>`).join('')}</ul>
  </div>
</section>
${related.length ? `<section class="wrap pp-related" aria-labelledby="rel-h">
  <h2 id="rel-h">Projektai su ${({ pvc: 'PVC', mediena: 'mediniais', aliuminis: 'aliuminio' })[s.material]} langais</h2>
  <div class="rel-grid" style="--n:${related.length}">${related.map((p, i) => `<a class="rel" href="projektai.html?medziaga=${s.material}#${p.id}"><span class="rel-media" data-reveal="${i % 2 ? 'left' : 'up'}">${pic(p, '(min-width: 900px) 30vw, 100vw')}</span><span class="rel-title">${p.title}</span><span class="muted">${p.place} <span class="demo">[DEMO]</span></span></a>`).join('')}</div>
</section>` : ''}
<section class="wrap section pp-others" aria-label="Kitos sistemos">
  ${others.map(o => `<a class="po" href="${o.page}"><span class="po-render">${renderBlock(o.cfg, { title: `${o.name} langas`, vt: `render-${o.id}` })}</span><span><span class="tb-k">${o.kind}</span><span class="po-name">${o.name}</span></span></a>`).join('')}
</section>`;
}

const blocks = {
  'SERIES-BAND': seriesBand, 'SERIES-ROWS': seriesRows, DOORS: doorsList, TYPES: typeGrid,
  PROJECTS: gallery, 'HOME-PROJECTS': homeProjects,
  'ELEV-INIT': () => elevation(full(DEFAULT_CONFIG), { figure: true }).svg,
};
function expand(body) {
  return body
    .replace(/<!--ELEV (\{[\s\S]*?\})-->/g, (_, j) => elevBlock(JSON.parse(j)))
    .replace(/<!--RENDER (\{[\s\S]*?\})-->/g, (_, j) => { const o = JSON.parse(j); return renderBlock(o.cfg, o); })
    .replace(/<!--OTYPE ([a-z]+)-->/g, (_, t) => otype(t))
    .replace(/<!--([A-Z-]+)-->/g, (m, k) => blocks[k] ? blocks[k]() : m);
}

// ---------- Page shell ----------
const NAV = [
  ['langai', 'langai.html', 'Langai'], ['durys', 'durys.html', 'Durys'],
  ['konfiguratorius', 'konfiguratorius.html', 'Konfigūratorius'], ['projektai', 'projektai.html', 'Projektai'],
  ['uzklausa', 'uzklausa.html', 'Kontaktai'],
];
const mark = `<svg viewBox="0 0 24 30" aria-hidden="true"><rect x="1.25" y="1.25" width="21.5" height="27.5" fill="none" stroke="currentColor" stroke-width="2.5"/><g class="brand-sash"><rect x="5" y="5" width="14" height="20" fill="none" stroke="currentColor" stroke-width="1.5"/></g></svg>`;
const header = cur => `<a class="skip" href="#turinys">Pereiti prie turinio</a>
<p class="demo-bar">Demonstracinė svetainė: <span class="demo-long">VITRA – išgalvotas prekės ženklas, kainos ir projektai pavyzdiniai</span><span class="demo-short">duomenys pavyzdiniai</span>. <a href="saltiniai.html">Daugiau</a></p>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="./"${cur === 'home' ? ' aria-current="page"' : ''}>${mark}<span class="brand-word">VITRA</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="meniu" data-testid="nav-toggle">Meniu</button>
    <nav class="nav" id="meniu" aria-label="Pagrindinis" data-testid="nav-menu">
      <ul>${NAV.map(([k, href, label]) => `<li><a href="${href}"${k === cur ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
      <a class="btn" href="uzklausa.html#forma">Užsakyti matavimą</a>
    </nav>
  </div>
</header>
<div class="config-band" data-config-band role="region" aria-label="Jūsų pasirinktas langas" hidden></div>`;

const footer = `<footer class="site-foot">
  <div class="wrap foot-grid">
    <div><p class="foot-brand">VITRA</p><p>Langai ir durys iš PVC, medienos ir aliuminio: gamyba, matavimas ir montavimas. <span class="demo">[DEMO]</span></p></div>
    <div><span class="tb-k">Produktai</span><ul><li><a href="langai.html">Langai</a></li><li><a href="durys.html">Durys</a></li><li><a href="konfiguratorius.html">Konfigūratorius</a></li><li><a href="projektai.html">Projektai</a></li></ul></div>
    <div><span class="tb-k">Kontaktai <span class="demo">[DEMO]</span></span><ul><li><a href="tel:+37060000000">+370 600 00000</a></li><li><a href="mailto:info@vitra.example">info@vitra.example</a></li><li><span>Pramonės g. 0, Kaunas</span></li></ul></div>
    <div><span class="tb-k">Salonas <span class="demo">[DEMO]</span></span><p>I–V 8–17 val.<br>VI 10–14 val.</p></div>
  </div>
  <div class="wrap foot-meta"><span>© 2026 VITRA (demonstracinis projektas)</span><a href="privatumas.html">Privatumo pranešimas</a><a href="saltiniai.html">Nuotraukų šaltiniai</a></div>
</footer>`;

const head = m => `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${m.title}</title>
<meta name="description" content="${m.description.replace(/"/g, '&quot;')}">
${m.noindex ? '<meta name="robots" content="noindex">\n' : ''}${m.refresh ? `<meta http-equiv="refresh" content="0; url=${m.refresh}">\n` : ''}<link rel="canonical" href="${SITE}/${m.file === 'index.html' ? '' : m.file}">
<meta property="og:title" content="${m.title}">
<meta property="og:description" content="${m.description.replace(/"/g, '&quot;')}">
<meta property="og:type" content="website">
<meta property="og:locale" content="lt_LT">
<meta name="theme-color" content="#F6F6F3">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/hedvig-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/albert-latin.woff2" as="font" type="font/woff2" crossorigin>
${m.preload ? `<link rel="preload" as="image" href="${m.preload}"${m.preloadSrcset ? ` imagesrcset="${m.preloadSrcset}" imagesizes="${m.preloadSizes}"` : ''} fetchpriority="high">\n` : ''}<link rel="stylesheet" href="css/site.css">${m.tilt ? `
<script>try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!sessionStorage.getItem('vitra.tilt'))document.documentElement.classList.add('tilt-pending')}catch(e){}</script>` : ''}
${(m.styles || []).map(s => `<link rel="stylesheet" href="${s}">`).join('\n')}
</head>`;

function build(file, raw) {
  const m = JSON.parse(raw.match(/^<!--(\{[\s\S]*?\})-->/)[1]);
  m.file = file;
  const body = raw.replace(/^<!--\{[\s\S]*?\}-->\s*/, '');
  const scripts = ['js/site.js', ...(m.scripts || [])].map(s => `<script type="module" src="${s}"></script>`).join('\n');
  writeFileSync(file, `${head(m)}
<body>
${header(m.nav)}
<main id="turinys">
${expand(body.trim())}
</main>
${footer}
${scripts}
</body>
</html>
`);
}

for (const f of readdirSync('src/pages').filter(f => f.endsWith('.html'))) build(f, readFileSync(`src/pages/${f}`, 'utf8'));
for (const s of SERIES) build(s.page, seriesPage(s));
console.log('pages built');
