// Project gallery: filters (aria-pressed, URL-synced), live count, empty state, <dialog> detail.
const grid = document.querySelector('[data-gallery]');
if (grid) init();

function init() {
  const items = [...grid.querySelectorAll('.proj')];
  const groups = [...document.querySelectorAll('[data-filter]')];
  const count = document.querySelector('[data-testid="filter-count"]');
  const empty = document.querySelector('[data-testid="filter-empty"]');
  const keyToAttr = { medziaga: 'material', gaminys: 'product', pastatas: 'building' };

  const state = () => Object.fromEntries(groups.map(g => [g.dataset.filter, g.querySelector('[aria-pressed="true"]')?.dataset.value || '']));
  function setGroup(g, value) {
    let found = false;
    g.querySelectorAll('button').forEach(b => { const on = b.dataset.value === value; if (on) found = true; b.setAttribute('aria-pressed', String(on)); });
    if (!found) g.querySelector('button').setAttribute('aria-pressed', 'true');
  }
  function apply(push) {
    const s = state();
    let n = 0;
    for (const it of items) {
      const show = Object.entries(s).every(([k, v]) => !v || it.dataset[keyToAttr[k]].split(' ').includes(v));
      it.hidden = !show; if (show) n++;
    }
    count.textContent = n ? `Rodoma projektų: ${n}` : 'Projektų nerasta';
    empty.hidden = n > 0;
    const p = new URLSearchParams(Object.entries(s).filter(([, v]) => v));
    const url = `${location.pathname}${p.toString() ? `?${p}` : ''}`;
    if (push && url !== location.pathname + location.search) history.pushState(null, '', url);
  }
  function fromUrl() {
    const p = new URLSearchParams(location.search);
    groups.forEach(g => setGroup(g, p.get(g.dataset.filter) || ''));
    apply(false);
  }
  groups.forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    setGroup(g, b.dataset.value); apply(true);
  }));
  empty.querySelector('[data-testid="filter-reset"]').addEventListener('click', () => {
    groups.forEach(g => setGroup(g, '')); apply(true);
    groups[0].querySelector('button').focus();
  });
  window.addEventListener('popstate', fromUrl);
  fromUrl();

  // Detail dialog
  const dlg = document.getElementById('projektas');
  const title = dlg.querySelector('.dlg-title');
  const body = dlg.querySelector('.dlg-body');
  let opener = null;
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.proj-open'); if (!btn) return;
    const art = btn.closest('.proj');
    opener = btn;
    title.textContent = `${art.querySelector('.proj-mark').textContent} ${art.querySelector('.proj-title').textContent}`;
    const img = art.querySelector('img');
    const full = (img.getAttribute('srcset') || '').split(',').map(s => s.trim().split(' ')[0]).pop() || img.src;
    body.innerHTML = `<img src="${full}" alt="${img.alt}" width="${img.width ? img.getAttribute('width') : ''}" height="${img.getAttribute('height')}" class="dlg-img">
      <div class="dlg-text"><p class="muted">${art.querySelector('.proj-cap .muted').textContent} · ${art.querySelector('.proj-tags').textContent}</p></div>`;
    body.querySelector('.dlg-text').append(art.querySelector('template').content.cloneNode(true));
    dlg.showModal();
  });
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  dlg.addEventListener('close', () => { opener?.focus(); });
}
