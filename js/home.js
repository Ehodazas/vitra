// Home: configurator teaser (editable dimensions) + signature tilt-and-turn of the hero sash.
import { mount } from './drawing.js';
import { validate, estimate, range } from './pricing.js';
import { normalise } from './state.js';

// ---------- Teaser: the dimension figures on the drawing are inputs ----------
const form = document.querySelector('[data-testid="hero-form"]');
if (form) {
  const elev = form.querySelector('.teaser-elev');
  const price = form.querySelector('[data-testid="hero-price"]');
  const err = form.querySelector('#hero-error');
  const read = () => normalise({
    w: /^\d+$/.test(form.w.value.trim()) ? parseInt(form.w.value, 10) : NaN,
    h: /^\d+$/.test(form.h.value.trim()) ? parseInt(form.h.value, 10) : NaN,
    m: 'pvc', c: '', s: 3, o: ['kl', 'n', 'kr'], g: 3, q: 1,
  });
  const update = (first = false) => {
    const cfg = read();
    const errors = validate(cfg);
    for (const k of ['w', 'h']) form[k].setAttribute('aria-invalid', String(errors.some(e => e.field === k)));
    err.textContent = errors.map(e => e.msg).join(' ');
    const est = errors.length ? null : estimate(cfg);
    price.textContent = est ? range(est) : '—';
    if (!errors.length && !first) mount(elev, cfg, { editable: true, title: `Trijų dalių langas ${cfg.w} × ${cfg.h} mm` });
  };
  form.addEventListener('input', () => update());
  form.addEventListener('submit', e => { if (validate(read()).length) { e.preventDefault(); update(); form.querySelector('[aria-invalid="true"]')?.focus(); } });
  update(true);
}

// ---------- Signature: tilt-and-turn (Web Animations API; once per session) ----------
const root = document.documentElement;
const sash = document.querySelector('[data-sash]');
if (sash && root.classList.contains('tilt-pending')) {
  const img = sash.querySelector('img');
  const handle = sash.querySelector('.handle');
  const ease = 'cubic-bezier(.2,.7,.1,1)';
  let started = false;
  const run = () => {
    if (started) return; started = true;
    root.classList.remove('tilt-pending');
    try { sessionStorage.setItem('vitra.tilt', '1'); } catch {}
    // 1. From the tilt position (top leaning into the room) the sash settles closed; the handle turns down.
    sash.animate([{ transform: 'rotateX(-9deg)' }, { transform: 'rotateX(0deg)' }], { duration: 950, easing: ease, fill: 'backwards' });
    handle?.animate([{ transform: 'rotate(-180deg)' }, { transform: 'rotate(-90deg)', offset: 0.45 }, { transform: 'rotate(0deg)' }], { duration: 1700, easing: ease, fill: 'backwards' });
    img?.animate([{ filter: 'blur(6px)', transform: 'scale(1.06)' }, { filter: 'blur(0)', transform: 'scale(1)' }], { duration: 1300, easing: ease, fill: 'backwards' });
    // 2. Turn: the sash swings open a little on its left hinge and closes again.
    sash.animate([
      { transform: 'rotateY(0deg)', transformOrigin: '0 50%' },
      { transform: 'rotateY(-13deg)', transformOrigin: '0 50%', offset: 0.45 },
      { transform: 'rotateY(0deg)', transformOrigin: '0 50%' },
    ], { duration: 1300, delay: 1050, easing: 'cubic-bezier(.45,.05,.25,1)' });
  };
  if (img && !img.complete) img.addEventListener('load', run, { once: true }); else run();
  setTimeout(run, 1800); // never wait long for the photo
}
