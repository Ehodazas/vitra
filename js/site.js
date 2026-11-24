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

// ---------- Motion & swatches (shared) ----------
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mask reveals: images open in the direction a sash opens; once, never hides content without JS.
const revealEls = document.querySelectorAll('[data-reveal]');
if (revealEls.length && !reduced && 'IntersectionObserver' in window) {
  const vh = innerHeight;
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  revealEls.forEach(el => { if (el.getBoundingClientRect().top < vh * 0.9) el.classList.add('in'); io.observe(el); });
  document.documentElement.classList.add('reveal-ready');
}

// Colour swatches: recolour the hero frame or a product render (clip-path wipe), keep links in sync.
document.addEventListener('click', e => {
  const btn = e.target.closest('.swatch-btn');
  if (!btn) return;
  const group = btn.closest('[data-swatches]');
  group.querySelectorAll('.swatch-btn').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  const name = group.querySelector('.swatch-name');
  if (name) name.textContent = btn.dataset.name;
  const hex = btn.dataset.hex;
  if (group.dataset.target === 'hero') {
    document.querySelector('[data-testid="hero-frame"]')?.style.setProperty('--frame', hex);
    return;
  }
  const scope = group.closest('.sb, [data-series]') || document;
  const render = scope.querySelector('[data-render]');
  if (render) recolour(render, hex);
  if (btn.dataset.colour) scope.querySelectorAll('a[href*="konfiguratorius.html?"]').forEach(a => {
    const u = new URL(a.getAttribute('href'), location.href);
    u.searchParams.set('c', btn.dataset.colour);
    a.setAttribute('href', `konfiguratorius.html?${u.searchParams}`);
  });
});

function recolour(render, hex) {
  const svg = render.querySelector('svg:not(.wipe)');
  render.dataset.hex = hex;
  if (reduced) { svg.style.setProperty('--frame', hex); return; }
  render.querySelectorAll('svg.wipe').forEach(s => s.remove());
  const next = svg.cloneNode(true);
  next.classList.add('wipe');
  next.removeAttribute('aria-label'); next.setAttribute('aria-hidden', 'true');
  next.style.setProperty('--frame', hex);
  render.append(next);
  next.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 700, easing: 'cubic-bezier(.2,.7,.1,1)' })
    .finished.then(() => { svg.style.setProperty('--frame', hex); next.remove(); }).catch(() => {});
}
