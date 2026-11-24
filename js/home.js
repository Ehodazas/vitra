// Home hero: the dimension figures on the drawing are inputs; drawing and estimate redraw live.
import { mount } from './drawing.js';
import { validate, estimate, range } from './pricing.js';
import { normalise } from './state.js';

const form = document.querySelector('[data-testid="hero-form"]');
if (form) {
  const elev = form.querySelector('.hero-elev');
  const price = form.querySelector('[data-testid="hero-price"]');
  const err = form.querySelector('#hero-error');
  const photo = { href: 'assets/img/namas-sodas-800.webp' };
  const read = () => normalise({
    w: /^\d+$/.test(form.w.value.trim()) ? parseInt(form.w.value, 10) : NaN,
    h: /^\d+$/.test(form.h.value.trim()) ? parseInt(form.h.value, 10) : NaN,
    m: form.m.value, c: '', s: 3, o: ['kl', 'n', 'kr'], g: 3, q: 1,
  });
  let last = null;
  const update = (first = false) => {
    const cfg = read();
    const errors = validate(cfg);
    for (const k of ['w', 'h']) form[k].setAttribute('aria-invalid', String(errors.some(e => e.field === k)));
    err.textContent = errors.map(e => e.msg).join(' ');
    const est = errors.length ? null : estimate(cfg);
    price.textContent = est ? range(est) : '—';
    if (!errors.length && !first) { mount(elev, cfg, { editable: true, photo, title: `Trijų dalių langas ${cfg.w} × ${cfg.h} mm` }); last = cfg; }
  };
  form.addEventListener('input', () => update());
  form.addEventListener('submit', e => { if (validate(read()).length) { e.preventDefault(); update(); form.querySelector('[aria-invalid="true"]')?.focus(); } });
  update(true);
}
