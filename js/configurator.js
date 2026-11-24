// Configurator: controls → state (URL + storage) → drawing + estimate + breakdown.
import { MATERIALS, OPENINGS, GLAZING, DEFAULT_CONFIG, RULES } from './catalog.js';
import { validate, estimate, range, fmtNum } from './pricing.js';
import { fromParams, toQuery, normalise, save, load, clear, summary } from './state.js';
import { mount } from './drawing.js';

const form = document.getElementById('cfg');
if (form) init();

function init() {
  const params = new URLSearchParams(location.search);
  const known = ['w', 'h', 'm', 'c', 's', 'o', 'g', 'q'];
  const fromUrl = known.some(k => params.has(k));
  let cfg = fromUrl ? fromParams(params) : (load() || structuredClone(DEFAULT_CONFIG));
  // Raw text of the number fields, so a half-typed value is not overwritten.
  const rawOf = k => (fromUrl && params.has(k)) ? params.get(k) : String(cfg[k]);
  const raw = { w: rawOf('w'), h: rawOf('h'), q: rawOf('q') };

  const $ = s => form.querySelector(s);
  const elev = $('[data-testid="cfg-elev"]');
  const priceEl = $('[data-testid="cfg-price"]');
  const coloursEl = $('[data-colours]');
  const sashesEl = $('[data-sashes]');
  const linesEl = document.querySelector('[data-lines]');
  const totalsEl = document.querySelector('[data-totals]');
  const quoteLinks = document.querySelectorAll('[data-quote-link]');

  function writeControls() {
    form.w.value = raw.w; form.h.value = raw.h; form.q.value = raw.q;
    form.querySelector(`input[name="m"][value="${cfg.m}"]`).checked = true;
    form.querySelector(`input[name="s"][value="${cfg.s}"]`).checked = true;
    form.querySelector(`input[name="g"][value="${cfg.g}"]`).checked = true;
    const mat = MATERIALS[cfg.m];
    document.querySelector('[data-range="w"]').textContent = `${mat.name}: ${mat.width[0]}–${mat.width[1]} mm`;
    document.querySelector('[data-range="h"]').textContent = `${mat.name}: ${mat.height[0]}–${mat.height[1]} mm`;
    coloursEl.innerHTML = mat.colours.map(c => `<label class="choice"><input type="radio" name="c" value="${c.id}"${c.id === cfg.c ? ' checked' : ''}><span><i class="swatch" style="background:${c.hex}"></i>${c.name}${c.pct ? ` <small>+${Math.round(c.pct * 100)} %</small>` : ''}</span></label>`).join('');
    sashesEl.innerHTML = cfg.o.map((t, i) => `<div class="field sash-field">
      <label for="cfg-o${i}">${i + 1} varčia</label>
      <select id="cfg-o${i}" data-sash="${i}" data-testid="cfg-o${i}" aria-describedby="cfg-o${i}-err">
        ${mat.openings.map(k => `<option value="${k}"${k === t ? ' selected' : ''}>${OPENINGS[k].name}</option>`).join('')}
      </select>
      <span class="field-error" id="cfg-o${i}-err" data-err="o${i}"></span></div>`).join('');
  }

  function readNumbers() {
    const n = v => /^\s*\d+\s*$/.test(v) ? parseInt(v, 10) : NaN;
    cfg.w = n(raw.w); cfg.h = n(raw.h); cfg.q = n(raw.q);
  }

  function render() {
    const errors = validate(cfg);
    form.querySelectorAll('[data-err]').forEach(el => { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    for (const e of errors) {
      const slot = form.querySelector(`[data-err="${e.field}"]`) || form.querySelector('[data-err="o"]');
      slot.textContent = slot.textContent ? `${slot.textContent} ${e.msg}` : e.msg;
      const input = { w: form.w, h: form.h, q: form.q }[e.field] || form.querySelector(`[data-sash="${e.field.slice(1)}"]`);
      input?.setAttribute('aria-invalid', 'true');
    }
    const est = errors.length ? null : estimate(cfg);
    priceEl.textContent = est ? range(est) : '—';
    priceEl.dataset.valid = String(!!est);
    if (est) {
      mount(elev, cfg, { figure: true, title: `Lango brėžinys: ${summary(cfg)}` });
      const q = toQuery(cfg);
      history.replaceState(null, '', `?${q}`);
      save(cfg);
      quoteLinks.forEach(a => { a.href = `uzklausa.html?${q}`; a.removeAttribute('aria-disabled'); });
      linesEl.innerHTML = est.lines.map(l => `<tr><td>${l.label}</td><td class="num">${fmtNum(l.value, 2)}</td></tr>`).join('');
      totalsEl.innerHTML = `
        <tr><th scope="row">Vienam langui be PVM</th><td class="num">${fmtNum(est.perUnit, 2)}</td></tr>
        <tr><th scope="row">× ${est.qty} vnt., be PVM</th><td class="num">${fmtNum(est.net, 2)}</td></tr>
        <tr><th scope="row">PVM ${Math.round(RULES.vat * 100)} %</th><td class="num">${fmtNum(est.vat, 2)}</td></tr>
        <tr class="calc-total"><th scope="row">Apskaičiuota suma su PVM</th><td class="num" data-testid="cfg-total">${fmtNum(est.total, 2)}</td></tr>
        <tr class="calc-range"><th scope="row">Orientacinis intervalas (±${Math.round(RULES.spread * 100)} %)</th><td class="num">${range(est)}</td></tr>`;
    } else {
      quoteLinks.forEach(a => { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); });
      linesEl.innerHTML = `<tr><td colspan="2">Kaina neskaičiuojama, kol konfigūracijoje yra klaidų: ${errors.map(e => e.msg).join(' ')}</td></tr>`;
      totalsEl.innerHTML = '';
    }
  }

  form.addEventListener('input', e => {
    const t = e.target;
    if (['w', 'h', 'q'].includes(t.name)) { raw[t.name] = t.value; readNumbers(); render(); return; }
    if (t.name === 'm') { cfg.m = t.value; normalise(cfg); writeControls(); }
    else if (t.name === 'c') cfg.c = t.value;
    else if (t.name === 's') { cfg.s = parseInt(t.value, 10); normalise(cfg); writeControls(); }
    else if (t.name === 'g') cfg.g = parseInt(t.value, 10);
    else if (t.dataset.sash) cfg.o[+t.dataset.sash] = t.value;
    render();
  });
  form.addEventListener('click', e => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const k = b.dataset.step;
    const cur = Number.isFinite(cfg[k]) ? cfg[k] : (k === 'w' ? DEFAULT_CONFIG.w : DEFAULT_CONFIG.h);
    raw[k] = String(Math.max(0, cur + parseInt(b.dataset.d, 10)));
    form[k].value = raw[k]; readNumbers(); render();
  });
  form.addEventListener('submit', e => e.preventDefault());
  // Announce the price once a value is committed, not on every keystroke.
  const status = document.querySelector('[data-price-status]');
  form.addEventListener('change', () => { status.textContent = priceEl.dataset.valid === 'true' ? `Orientacinė kaina: ${priceEl.textContent}` : 'Kaina neskaičiuojama – patikrinkite klaidas.'; });

  document.querySelector('[data-copy]')?.addEventListener('click', async () => {
    const status = document.querySelector('[data-copy-status]');
    try { await navigator.clipboard.writeText(location.href); status.textContent = 'Nuoroda nukopijuota.'; }
    catch { status.textContent = `Nukopijuokite nuorodą iš adreso juostos: ${location.href}`; }
  });
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    clear(); cfg = structuredClone(DEFAULT_CONFIG);
    raw.w = String(cfg.w); raw.h = String(cfg.h); raw.q = String(cfg.q);
    writeControls(); render();
  });

  readNumbers(); writeControls(); render();
}
