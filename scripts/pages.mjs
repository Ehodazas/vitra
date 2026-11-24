// Assembles static pages: src/pages/*.html + shared head/header/footer → ./*.html
// Each page starts with a JSON comment: <!--{"title":"…","description":"…","nav":"projektai","preload":"assets/img/…","scripts":["js/home.js"]}-->
// Run: node scripts/pages.mjs  (also used as qa.config.json preview.build)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { elevation } from '../js/drawing.js';
import { SCHEDULE, PROJECTS, MATERIAL_LABEL, PRODUCT_LABEL, BUILDING_LABEL } from '../js/data.js';
import { MATERIALS, OPENINGS, DEFAULT_CONFIG } from '../js/catalog.js';
import { toQuery, normalise } from '../js/state.js';
import { validate } from '../js/pricing.js';

// ---------- Server-rendered drawings and data blocks ----------
const full = cfg => normalise({ c: '', g: 3, q: 1, ...cfg });
for (const r of SCHEDULE) if (validate(full(r.cfg)).length) throw new Error(`schedule ${r.mark}: ${JSON.stringify(validate(full(r.cfg)))}`);
for (const p of PROJECTS) if (validate(full(p.cfg)).length) throw new Error(`project ${p.id}: ${JSON.stringify(validate(full(p.cfg)))}`);

function elevBlock({ cfg, opts = {}, cls = '', maxh, inputs = false, testid }) {
  const r = elevation(full(cfg), opts);
  const style = `--ar:${r.ar.toFixed(4)}${maxh ? `;--maxh:${maxh}` : ''}`;
  const inp = !inputs ? '' : ['w', 'h'].map(k => `<label class="dim-input" data-dim="${k}" style="left:${r.anchors[k].x.toFixed(2)}%;top:${r.anchors[k].y.toFixed(2)}%"><span class="visually-hidden">${k === 'w' ? 'Angos plotis' : 'Angos aukštis'}, mm</span><input name="${k}" type="number" inputmode="numeric" min="400" max="4500" step="10" value="${cfg[k]}" data-testid="dim-${k}" aria-describedby="hero-error"><span aria-hidden="true">mm</span></label>`).join('');
  return `<div class="elev ${cls}" style="${style}"${testid ? ` data-testid="${testid}"` : ''}>${inp}<div class="elev-draw">${r.svg}</div></div>`;
}

const openingShort = cfg => cfg.o.map(t => OPENINGS[t].short).join(' · ');

function scheduleTable() {
  const rows = SCHEDULE.map(r => {
    const cfg = full(r.cfg);
    return `<tr>
      <th scope="row" class="sch-mark">${r.mark}</th>
      <td class="sch-draw">${elevBlock({ cfg, opts: { dims: false, title: `${r.mark}: ${cfg.w} × ${cfg.h} mm` }, cls: 'mini', maxh: '120px' })}</td>
      <td><span class="sch-k">Matmenys</span>${cfg.w} × ${cfg.h}</td>
      <td><span class="sch-k">Medžiaga</span>${MATERIALS[cfg.m].name}</td>
      <td><span class="sch-k">Atidarymas</span>${openingShort(cfg)}</td>
      <td><span class="sch-k">Vieta</span>${r.room}</td>
      <td class="sch-q"><span class="sch-k">Kiekis</span>${cfg.q}</td>
      <td class="sch-go"><a href="konfiguratorius.html?${toQuery({ ...cfg, q: 1 })}" data-testid="schedule-link">Konfigūruoti ${r.mark}<span class="visually-hidden"> tipą</span></a></td>
    </tr>`;
  }).join('');
  return `<table class="schedule" data-testid="schedule">
    <caption class="visually-hidden">Pavyzdinio namo langų žiniaraštis</caption>
    <thead><tr><th scope="col">Žymė</th><th scope="col">Vaizdas</th><th scope="col">Matmenys, mm</th><th scope="col">Medžiaga</th><th scope="col">Atidarymas</th><th scope="col">Vieta</th><th scope="col">Kiekis</th><th scope="col"><span class="visually-hidden">Veiksmas</span></th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

const pic = (p, sizes, cls = '', load = 'lazy') => { const sm = p.iw === 1600 ? 800 : 640; return `<img class="${cls}" src="assets/img/${p.img}-${sm}.webp" srcset="assets/img/${p.img}-${sm}.webp ${sm}w, assets/img/${p.img}-${p.iw}.webp ${p.iw}w" sizes="${sizes}" width="${p.iw}" height="${p.ih}" alt="${p.alt}" ${load === 'lcp' ? 'fetchpriority="high"' : load === 'eager' ? '' : 'loading="lazy"'} decoding="async">`; };

function homeProjects() {
  const pick = ['kacergine', 'traku', 'palanga'].map(id => PROJECTS.find(p => p.id === id));
  return pick.map((p, i) => `<figure class="hp hp-${i + 1}">
    ${pic(p, i === 0 ? '(min-width: 900px) 55vw, 100vw' : '(min-width: 900px) 30vw, 100vw')}
    <figcaption>
      ${elevBlock({ cfg: p.cfg, opts: { dims: false, title: `${p.mark} lango schema` }, cls: 'mini key', maxh: '110px' })}
      <span class="hp-mark">${p.mark}</span>
      <span class="hp-title">${p.title} <span class="demo">[DEMO]</span></span>
      <span class="muted">${p.place} · ${MATERIAL_LABEL[p.material]}</span>
    </figcaption>
  </figure>`).join('');
}

function gallery() {
  return PROJECTS.map((p, i) => `<article class="proj" data-testid="filter-item" data-material="${p.material}" data-product="${p.product.join(' ')}" data-building="${p.building}" id="${p.id}">
    <button type="button" class="proj-open" data-testid="gallery-item" aria-haspopup="dialog" aria-controls="projektas">
      ${pic(p, i === 0 ? '(min-width: 1100px) 66vw, (min-width: 700px) 50vw, 100vw' : '(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 100vw', 'proj-img', i === 0 ? 'lcp' : i === 1 ? 'eager' : 'lazy')}
      <span class="proj-cap">
        <span class="proj-key">${elevBlock({ cfg: p.cfg, opts: { dims: false, title: `${p.mark} lango schema` }, cls: 'mini key', maxh: '96px' }).replace(/<div/g, '<span').replace(/<\/div>/g, '</span>')}</span>
        <span class="proj-mark">${p.mark}</span>
        <span class="proj-title">${p.title}</span>
        <span class="muted">${p.place}</span>
        <span class="proj-tags">${MATERIAL_LABEL[p.material]} · ${p.product.map(x => PRODUCT_LABEL[x]).join(', ')} · ${BUILDING_LABEL[p.building]}</span>
      </span>
    </button>
    <template class="proj-detail">
      <p>${p.text} <span class="demo">[DEMO]</span></p>
      ${elevBlock({ cfg: p.cfg, opts: { title: `${p.mark}: pagrindinio lango brėžinys` }, cls: 'detail', maxh: '34svh' })}
      <p><a class="btn btn-line" href="konfiguratorius.html?${toQuery(full(p.cfg))}">Konfigūruoti panašų langą</a></p>
    </template>
  </article>`).join('\n');
}

const blocks = {
  SCHEDULE: scheduleTable,
  'HOME-PROJECTS': homeProjects,
  PROJECTS: gallery,
  'ELEV-INIT': () => elevation(full(DEFAULT_CONFIG), { figure: true }).svg,
};
function expand(body) {
  return body
    .replace(/<!--ELEV (\{[\s\S]*?\})-->/g, (_, j) => elevBlock(JSON.parse(j)))
    .replace(/<!--([A-Z-]+)-->/g, (m, k) => blocks[k] ? blocks[k]() : m);
}

const SITE = 'https://vitra.example'; // [DEMO] replace with the real domain at launch
const NAV = [
  ['konfiguratorius', 'konfiguratorius.html', 'Konfigūratorius'],
  ['medziagos', 'medziagos.html', 'Medžiagos'],
  ['projektai', 'projektai.html', 'Projektai'],
];
const mark = `<svg viewBox="0 0 26 30" aria-hidden="true"><rect x="1.5" y="1.5" width="23" height="27" fill="none" stroke="currentColor" stroke-width="3"/><line x1="13" y1="3" x2="13" y2="27" stroke="currentColor" stroke-width="1.5"/><polyline points="24,3 3,15 24,27" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;

const header = cur => `<a class="skip" href="#turinys">Pereiti prie turinio</a>
<p class="demo-bar">Demonstracinė svetainė: <span class="demo-long">VITRA – išgalvotas prekės ženklas, kainos ir projektai pavyzdiniai</span><span class="demo-short">duomenys pavyzdiniai</span>. <a href="saltiniai.html">Daugiau</a></p>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="./"${cur === 'home' ? ' aria-current="page"' : ''}>${mark}VITRA</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="meniu" data-testid="nav-toggle">Meniu</button>
    <nav class="nav" id="meniu" aria-label="Pagrindinis" data-testid="nav-menu">
      <ul>${NAV.map(([k, href, label]) => `<li><a href="${href}"${k === cur ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
      <a class="btn" href="uzklausa.html"${cur === 'uzklausa' ? ' aria-current="page"' : ''}>Užsakyti matavimą</a>
    </nav>
  </div>
</header>
<div class="config-band" data-config-band role="region" aria-label="Jūsų pasirinktas langas" hidden></div>`;

const footer = `<footer class="site-foot">
  <div class="wrap">
    <div class="title-block">
      <div><span class="tb-name">VITRA</span><p class="muted" style="margin:8px 0 0">Langai ir durys iš PVC, medienos ir aliuminio. Gamyba ir montavimas. <span class="demo">[DEMO]</span></p></div>
      <div><span class="tb-k">Kontaktai <span class="demo">[DEMO]</span></span>
        <ul><li><a href="tel:+37060000000">+370 600 00000</a></li><li><a href="mailto:info@vitra.example">info@vitra.example</a></li><li>Pramonės g. 0, Kaunas</li></ul></div>
      <div><span class="tb-k">Puslapiai</span>
        <ul><li><a href="konfiguratorius.html">Lango konfigūratorius</a></li><li><a href="medziagos.html">Medžiagų palyginimas</a></li><li><a href="projektai.html">Projektai</a></li><li><a href="uzklausa.html">Užklausa ir matavimas</a></li></ul></div>
      <div><span class="tb-k">Darbo laikas <span class="demo">[DEMO]</span></span><p style="margin:0">I–V 8–17 val.</p></div>
    </div>
    <div class="foot-meta"><span>© 2026 VITRA (demonstracinis projektas)</span><a href="privatumas.html">Privatumo pranešimas</a><a href="saltiniai.html">Nuotraukų šaltiniai</a></div>
  </div>
</footer>`;

const head = m => `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${m.title}</title>
<meta name="description" content="${m.description}">
${m.noindex ? '<meta name="robots" content="noindex">\n' : ''}<link rel="canonical" href="${SITE}/${m.file === 'index.html' ? '' : m.file}">
<meta property="og:title" content="${m.title}">
<meta property="og:description" content="${m.description}">
<meta property="og:type" content="website">
<meta property="og:locale" content="lt_LT">
<meta name="theme-color" content="#F3F0EA">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/sofia-sans-extra-condensed-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/sofia-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
${m.preload ? `<link rel="preload" as="image" href="${m.preload}" fetchpriority="high">\n` : ''}<link rel="stylesheet" href="css/site.css">
${(m.styles || []).map(s => `<link rel="stylesheet" href="${s}">`).join('\n')}
</head>`;

for (const f of readdirSync('src/pages').filter(f => f.endsWith('.html'))) {
  const raw = readFileSync(`src/pages/${f}`, 'utf8');
  const m = JSON.parse(raw.match(/^<!--(\{[\s\S]*?\})-->/)[1]);
  m.file = f;
  const body = raw.replace(/^<!--\{[\s\S]*?\}-->\s*/, '');
  const scripts = ['js/site.js', ...(m.scripts || [])].map(s => `<script type="module" src="${s}"></script>`).join('\n');
  const html = `${head(m)}
<body>
${header(m.nav)}
<main id="turinys">
${expand(body.trim())}
</main>
${footer}
${scripts}
</body>
</html>
`;
  writeFileSync(f, html);
}
console.log('pages built');
