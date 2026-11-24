// Quote form: carries the configuration; success only after the endpoint confirms delivery.
// Endpoint: data-endpoint on the form (Formspree, e.g. https://formspree.io/f/xxxxxxx). Empty = not connected.
import { fromParams, load, toQuery, detailLines, clear } from './state.js';
import { estimate, range } from './pricing.js';
import { elevation } from './drawing.js';

const form = document.querySelector('[data-testid="quote-form"]');
if (form) init();

function init() {
  const endpoint = (window.VITRA_FORM_ENDPOINT || form.dataset.endpoint || '').trim();
  const params = new URLSearchParams(location.search);
  let cfg = ['w', 'h', 'm'].some(k => params.has(k)) ? fromParams(params) : load();
  const body = form.querySelector('[data-config-body]');
  const emptyHtml = body.innerHTML;
  const ok = form.querySelector('[data-testid="form-success"]');
  const bad = form.querySelector('[data-testid="form-error-server"]');
  const submit = form.querySelector('[data-testid="quote-submit"]');
  const sending = form.querySelector('[data-sending]');

  function showConfig() {
    const est = cfg && estimate(cfg);
    if (!cfg || !est) {
      body.innerHTML = emptyHtml;
      form.konfiguracija.value = form.konfiguracijos_nuoroda.value = form.orientacine_kaina.value = '';
      return;
    }
    const q = toQuery(cfg);
    const url = new URL(`konfiguratorius.html?${q}`, location.href).href;
    const r = elevation(cfg, { dims: false, title: 'Pridėto lango brėžinys' });
    body.innerHTML = `<div class="q-cfg">
      <div class="elev q-elev" style="--ar:${r.ar.toFixed(4)}"><div class="elev-draw">${r.svg}</div></div>
      <dl class="q-cfg-list">${detailLines(cfg).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
        <div><dt>Orientacinė kaina</dt><dd data-testid="quote-price">${range(est)} su PVM</dd></div></dl>
    </div>
    <p class="q-cfg-actions"><a href="konfiguratorius.html?${q}">Keisti konfigūraciją</a>
      <button type="button" class="btn-link" data-remove>Pašalinti iš užklausos</button></p>`;
    form.konfiguracija.value = detailLines(cfg).map(([k, v]) => `${k}: ${v}`).join('\n');
    form.konfiguracijos_nuoroda.value = url;
    form.orientacine_kaina.value = `${range(est)} su PVM (orientacinė)`;
    body.querySelector('[data-remove]').addEventListener('click', () => {
      cfg = null; clear(); history.replaceState(null, '', location.pathname); showConfig();
      form.querySelector('#q-config-h').focus?.();
    });
  }
  showConfig();
  // Product chosen on a door or series page
  const product = (params.get('produktas') || '').slice(0, 80);
  if (product) {
    const p = form.querySelector('[data-testid="quote-product"]');
    p.textContent = `Domina: ${product}`; p.hidden = false;
    form.produktas.value = product;
  }

  const fields = {
    vardas: form.vardas, telefonas: form.telefonas, email: form.email, sutikimas: form.sutikimas,
  };
  const errOf = el => document.getElementById(el.getAttribute('aria-describedby').split(' ').pop());
  function setErr(el, msg) {
    errOf(el).textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }
  function validateForm() {
    const v = {};
    v.vardas = fields.vardas.value.trim().length < 2 ? 'Įrašykite vardą.' : '';
    const phone = fields.telefonas.value.trim(), email = fields.email.value.trim();
    const phoneOk = /^\+?[\d\s()-]{8,}$/.test(phone);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    v.telefonas = phone && !phoneOk ? 'Patikrinkite telefono numerį, pvz., +370 600 00000.' : '';
    v.email = email && !emailOk ? 'Patikrinkite el. pašto adresą, pvz., vardas@pastas.lt.' : '';
    if (!phone && !email) { v.telefonas = 'Nurodykite telefoną arba el. paštą.'; }
    v.sutikimas = fields.sutikimas.checked ? '' : 'Pažymėkite sutikimą, kad galėtume atsakyti.';
    Object.entries(v).forEach(([k, msg]) => setErr(fields[k], msg));
    return Object.entries(v).find(([, m]) => m)?.[0];
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    ok.hidden = true; bad.hidden = true;
    const firstBad = validateForm();
    if (firstBad) { fields[firstBad].focus(); return; }
    if (!endpoint) {
      showError('Užklausų forma šioje demonstracinėje svetainėje dar neprijungta, todėl užklausa <strong>neišsiųsta</strong>. Jūsų įvesti duomenys liko formoje. Susisiekti galite telefonu <a href="tel:+37060000000">+370 600 00000</a> <span class="demo">[DEMO]</span>.');
      return;
    }
    submit.disabled = true; sending.textContent = 'Siunčiama…';
    try {
      const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      ok.hidden = false; ok.focus();
      form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]), textarea, select').forEach(el => { el.value = ''; });
      fields.sutikimas.checked = false;
    } catch {
      showError('Užklausos išsiųsti nepavyko – jūsų duomenys liko formoje. Bandykite dar kartą po minutės arba skambinkite <a href="tel:+37060000000">+370 600 00000</a> <span class="demo">[DEMO]</span>.');
    } finally {
      submit.disabled = false; sending.textContent = '';
    }
  });
  function showError(html) { bad.innerHTML = html; bad.hidden = false; bad.focus(); }
  form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid')) validateForm(); });
}
