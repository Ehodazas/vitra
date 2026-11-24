// Shared: mobile navigation and the "your window" band that follows the visitor to the quote.
import { load, toQuery, summary, clear } from './state.js';
import { estimate, range } from './pricing.js';

const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('meniu');
if (toggle && nav) {
  const set = open => { toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { set(false); toggle.focus(); }
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
}

const band = document.querySelector('[data-config-band]');
const page = location.pathname.split('/').pop();
if (band && !/konfiguratorius|uzklausa/.test(page)) renderBand();

function renderBand() {
  const cfg = load();
  if (!cfg) { band.hidden = true; return; }
  const est = estimate(cfg);
  band.innerHTML = `<div class="wrap"><strong>Jūsų langas</strong><span data-testid="band-summary">${summary(cfg)}</span>
    <span>${est ? `apie ${range(est)}` : ''}</span><span class="spacer"></span>
    <a href="konfiguratorius.html?${toQuery(cfg)}">Tęsti konfigūravimą</a>
    <a href="uzklausa.html?${toQuery(cfg)}">Siųsti užklausą</a>
    <button type="button" class="btn-link" data-band-clear>Pašalinti</button></div>`;
  band.hidden = false;
  band.querySelector('[data-band-clear]').addEventListener('click', () => {
    clear(); band.hidden = true;
    const h1 = document.querySelector('main h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus(); }
  });
}
