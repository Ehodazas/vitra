// VITRA feature tests – one describe per feature in DESIGN.md "Business functionality".
// Expected prices are computed by hand from the [DEMO] rates in js/catalog.js.
import { test, expect } from '@playwright/test';
import { validate, estimate } from '../js/pricing.js';

const sp = s => s.replace(/[  ]/g, ' ');
const FORMSPREE = 'https://formspree.io/f/**';
const DEFAULT = { w: 1480, h: 1460, m: 'pvc', c: 'balta', s: 3, o: ['kl', 'n', 'kr'], g: 3, q: 1 };
const ALU_Q = 'w=2400&h=2200&m=aliuminis&c=ral9005&s=2&o=s,n&g=3&q=1';

// ---------- Pricing (pure function) ----------
test.describe('pricing @pricing', () => {
  test('default PVC window: every line and the range', () => {
    const e = estimate(DEFAULT);
    expect(e.lines.map(l => l.value)).toEqual([410.55, 170, 60.5, 130.56]);
    expect(e.total).toBe(933.65);
    expect([e.low, e.high]).toEqual([790, 1070]);
  });
  test('minimum billable area, colour surcharge, quantity', () => {
    const e = estimate({ w: 600, h: 600, m: 'pvc', c: 'antracitas', s: 1, o: ['v'], g: 2, q: 2 });
    expect(e.area).toBe(0.8);
    expect(e.lines.find(l => l.key === 'colour').value).toBe(23.64);
    expect(e.net).toBe(618.88);
    expect(e.total).toBe(748.84);
    expect([e.low, e.high]).toEqual([640, 860]);
  });
  test('aluminium sliding unit', () => {
    const e = estimate({ w: 2400, h: 2200, m: 'aliuminis', c: 'ral9005', s: 2, o: ['s', 'n'], g: 3, q: 1 });
    expect(e.total).toBe(3402.05);
    expect([e.low, e.high]).toEqual([2890, 3910]);
  });
  test('range always contains the total', () => {
    for (const w of [400, 777, 1480, 2400]) for (const m of ['pvc', 'mediena', 'aliuminis']) {
      const e = estimate({ ...DEFAULT, w, h: 1200, m, c: m === 'pvc' ? 'balta' : m === 'mediena' ? 'naturali' : 'ral9016', s: w < 800 ? 1 : 2, o: w < 800 ? ['kl'] : ['kl', 'kr'] });
      expect(e, `${m} ${w}`).not.toBeNull();
      expect(e.low).toBeLessThanOrEqual(e.total);
      expect(e.high).toBeGreaterThanOrEqual(e.total);
    }
  });
  test('invalid configurations give no price', () => {
    const bad = [
      { ...DEFAULT, w: 200 },
      { ...DEFAULT, w: NaN },
      { ...DEFAULT, h: 2700 },
      { ...DEFAULT, m: 'mediena', c: 'naturali', s: 2, o: ['s', 'n'] },   // no sliding timber
      { ...DEFAULT, w: 3000, s: 1, o: ['kl'] },                             // sash too wide
      { ...DEFAULT, w: 3000, s: 1, o: ['n'] },                              // fixed pane too wide
      { ...DEFAULT, q: 0 },
    ];
    for (const b of bad) { expect(validate(b).length, JSON.stringify(b)).toBeGreaterThan(0); expect(estimate(b)).toBeNull(); }
  });
});

// ---------- Configurator UI ----------
test.describe('configurator @configurator', () => {
  test.beforeEach(async ({ page }) => { await page.goto('konfiguratorius.html'); await page.evaluate(() => localStorage.clear()); await page.goto('konfiguratorius.html'); });

  test('default renders drawing, price and breakdown', async ({ page }) => {
    await expect(page.getByTestId('cfg-elev').locator('svg')).toBeVisible();
    expect(sp(await page.getByTestId('cfg-price').textContent())).toBe('790–1 070 €');
    expect(sp(await page.getByTestId('cfg-total').textContent())).toBe('933,65');
    await expect(page.getByTestId('cfg-breakdown').locator('tbody tr')).toHaveCount(4);
  });

  test('width change redraws the dimension and updates the price', async ({ page }) => {
    await page.getByTestId('cfg-w').fill('2000');
    await expect(page.getByTestId('cfg-elev').locator('svg text', { hasText: /^2000$/ })).toHaveCount(1);
    await expect(page).toHaveURL(/w=2000/);
    expect(sp(await page.getByTestId('cfg-price').textContent())).not.toBe('790–1 070 €');
  });

  test('stepper buttons change width by 10 mm', async ({ page }) => {
    await page.getByRole('button', { name: 'Plotis daugiau 10 mm' }).click();
    await expect(page.getByTestId('cfg-w')).toHaveValue('1490');
  });

  test('out-of-range size: Lithuanian error, aria-invalid, no price, quote link disabled', async ({ page }) => {
    await page.getByTestId('cfg-w').fill('3500');
    await expect(page.getByTestId('cfg-w')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('cfg-w-error')).toContainText('nuo 400 iki 3000 mm');
    await expect(page.getByTestId('cfg-price')).toHaveText('—');
    await expect(page.getByTestId('cfg-to-quote')).toHaveAttribute('aria-disabled', 'true');
    await page.getByTestId('cfg-w').fill('abc');
    await expect(page.getByTestId('cfg-price')).toHaveText('—');
    await expect(page.getByTestId('cfg-price')).not.toHaveText(/NaN|undefined/);
  });

  test('material switch changes colours and available opening types', async ({ page }) => {
    await page.locator('input[name="m"][value="mediena"]').check();
    await expect(page.getByTestId('cfg-colours').getByRole('radio')).toHaveCount(3);
    await expect(page.getByTestId('cfg-colours')).toContainText('lazūra');
    await expect(page.getByTestId('cfg-o0').locator('option[value="s"]')).toHaveCount(0);
    await page.locator('input[name="m"][value="aliuminis"]').check();
    await expect(page.getByTestId('cfg-o0').locator('option[value="s"]')).toHaveCount(1);
  });

  test('sash count changes the per-sash selects and the drawing', async ({ page }) => {
    await page.locator('input[name="s"][value="2"]').check();
    await expect(page.locator('[data-sash]')).toHaveCount(2);
    await expect(page).toHaveURL(/s=2/);
  });

  test('keyboard only: change material and sash type', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard flow checked on desktop');
    await page.getByTestId('cfg-w').focus();
    await page.keyboard.press('Tab'); // +
    await page.keyboard.press('Tab'); // height −
    await page.locator('input[name="m"][value="pvc"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('input[name="m"][value="mediena"]')).toBeChecked();
    await page.getByTestId('cfg-o1').selectOption('v');
    await expect(page).toHaveURL(/o=kl%2Cv%2Ckr|o=kl,v,kr/);
  });
});

// ---------- Configuration hand-off ----------
test.describe('configuration hand-off @config-handoff', () => {
  test('pasted URL restores the identical configuration and price', async ({ page }) => {
    await page.goto(`konfiguratorius.html?${ALU_Q}`);
    await expect(page.getByTestId('cfg-w')).toHaveValue('2400');
    await expect(page.getByTestId('cfg-h')).toHaveValue('2200');
    await expect(page.locator('input[name="m"][value="aliuminis"]')).toBeChecked();
    await expect(page.locator('input[name="c"][value="ral9005"]')).toBeChecked();
    await expect(page.getByTestId('cfg-o0')).toHaveValue('s');
    expect(sp(await page.getByTestId('cfg-price').textContent())).toBe('2 890–3 910 €');
  });

  test('configurator → quote carries the configuration into the form', async ({ page }) => {
    await page.goto('konfiguratorius.html');
    await page.getByTestId('cfg-w').fill('1200');
    await page.getByTestId('cfg-to-quote').click();
    await expect(page).toHaveURL(/uzklausa\.html\?.*w=1200/);
    const box = page.getByTestId('quote-config');
    await expect(box).toContainText('1200 × 1460 mm');
    await expect(box).toContainText('PVC profilis');
    await expect(page.locator('input[name="konfiguracija"]')).toHaveValue(/Matmenys: 1200 × 1460 mm/);
    await expect(page.locator('input[name="konfiguracijos_nuoroda"]')).toHaveValue(/konfiguratorius\.html\?w=1200/);
  });

  test('series page "Konfigūruoti" opens the series preset', async ({ page }) => {
    await page.goto('langai-lumen.html');
    await page.getByTestId('series-configure').click();
    await expect(page.getByTestId('cfg-w')).toHaveValue('2400');
    await expect(page.locator('input[name="m"][value="aliuminis"]')).toBeChecked();
    await expect(page.getByTestId('cfg-o0')).toHaveValue('s');
  });

  test('opening-type link opens the configurator with that type', async ({ page }) => {
    await page.goto('langai.html');
    await page.getByTestId('type-link').filter({ has: page.locator('strong', { hasText: /^Verčiamas$/ }) }).first().click();
    await expect(page.locator('[data-sash]')).toHaveCount(1);
    await expect(page.getByTestId('cfg-o0')).toHaveValue('v');
  });

  test('door enquiry carries the product into the quote form', async ({ page }) => {
    await page.goto('durys.html');
    await page.getByTestId('door-cta').nth(1).click();
    await expect(page.getByTestId('quote-product')).toContainText('Terra');
    await expect(page.locator('input[name="produktas"]')).toHaveValue(/Terra/);
  });

  test('hero dimensions submit into the configurator', async ({ page }) => {
    await page.goto('');
    await page.getByTestId('dim-w').fill('1800');
    await expect(page.getByTestId('hero-price')).not.toHaveText('—');
    await page.getByTestId('hero-submit').click();
    await expect(page.getByTestId('cfg-w')).toHaveValue('1800');
  });

  test('hero rejects impossible size and stays on page', async ({ page }) => {
    await page.goto('');
    await page.getByTestId('dim-w').fill('50');
    await expect(page.getByTestId('hero-error')).toContainText('plotis');
    await page.getByTestId('hero-submit').click();
    await expect(page).not.toHaveURL(/konfiguratorius/);
  });

  test('selected window band follows to other pages and can be removed', async ({ page }) => {
    await page.goto(`konfiguratorius.html?${ALU_Q}`);
    await page.goto('projektai.html');
    await expect(page.getByTestId('band-summary')).toContainText('2400 × 2200 mm');
    await page.getByRole('button', { name: 'Pašalinti' }).click();
    await expect(page.getByTestId('band-summary')).toBeHidden();
  });

  test('quote config can be removed', async ({ page }) => {
    await page.goto(`uzklausa.html?${ALU_Q}`);
    await page.getByRole('button', { name: 'Pašalinti iš užklausos' }).click();
    await expect(page.getByTestId('quote-config')).toContainText('Konfigūracija nepridėta');
    await expect(page.locator('input[name="konfiguracija"]')).toHaveValue('');
  });
});

// ---------- Quote form ----------
test.describe('quote form @quote-form', () => {
  let requests;
  const fill = async page => {
    await page.getByLabel('Vardas').fill('Testas Testaitis');
    await page.getByLabel('El. paštas').fill('testas@example.com');
    await page.getByLabel('Žinutė').fill('Bandomoji žinutė');
  };
  test.beforeEach(async ({ page }) => {
    requests = [];
    await page.route(FORMSPREE, r => { requests.push(r.request()); return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  });

  test('missing contact: Lithuanian error, aria-invalid, nothing sent', async ({ page }) => {
    await page.goto('uzklausa.html');
    await page.getByLabel('Vardas').fill('Testas');
    await page.getByTestId('consent').check();
    await page.getByTestId('quote-submit').click();
    await expect(page.getByLabel('Telefonas')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('form-error').filter({ hasText: /telefoną arba el. paštą/ })).toBeVisible();
    expect(requests).toHaveLength(0);
  });

  test('invalid email and missing consent are reported', async ({ page }) => {
    await page.goto('uzklausa.html');
    await page.getByLabel('Vardas').fill('Testas');
    await page.getByLabel('El. paštas').fill('neteisingas');
    await page.getByTestId('quote-submit').click();
    await expect(page.getByLabel('El. paštas')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('consent')).toHaveAttribute('aria-invalid', 'true');
    expect(requests).toHaveLength(0);
  });

  test('endpoint not connected: honest error, no success, nothing sent', async ({ page }) => {
    await page.goto('uzklausa.html');
    await fill(page);
    await page.getByTestId('consent').check();
    await page.getByTestId('quote-submit').click();
    await expect(page.getByTestId('form-error-server')).toContainText('neišsiųsta');
    await expect(page.getByTestId('form-success')).toBeHidden();
    await expect(page.getByLabel('Vardas')).toHaveValue('Testas Testaitis');
    expect(requests).toHaveLength(0);
  });

  test('connected endpoint (mocked 200): success only after response, payload carries config', async ({ page }) => {
    await page.addInitScript(() => { window.VITRA_FORM_ENDPOINT = 'https://formspree.io/f/testform'; });
    await page.goto(`uzklausa.html?${ALU_Q}`);
    await fill(page);
    await page.getByTestId('consent').check();
    await page.getByTestId('quote-submit').click();
    await expect(page.getByTestId('form-success')).toBeVisible();
    expect(requests).toHaveLength(1);
    const body = requests[0].postData() || '';
    expect(body).toContain('Testas Testaitis');
    expect(body).toContain('2400 × 2200 mm');
    expect(body).toContain('konfiguracijos_nuoroda');
  });

  test('connected endpoint failing (mocked 500): error, data kept, no success', async ({ page }) => {
    await page.unroute(FORMSPREE);
    await page.route(FORMSPREE, r => r.fulfill({ status: 500, body: 'err' }));
    await page.addInitScript(() => { window.VITRA_FORM_ENDPOINT = 'https://formspree.io/f/testform'; });
    await page.goto('uzklausa.html');
    await fill(page);
    await page.getByTestId('consent').check();
    await page.getByTestId('quote-submit').click();
    await expect(page.getByTestId('form-error-server')).toContainText('nepavyko');
    await expect(page.getByTestId('form-success')).toBeHidden();
    await expect(page.getByLabel('El. paštas')).toHaveValue('testas@example.com');
    await expect(page.getByTestId('quote-submit')).toBeEnabled();
  });
});

// ---------- Materials ----------
test.describe('materials comparison @materials', () => {
  test('accessible table with three materials and row headers', async ({ page }) => {
    await page.goto('langai.html');
    const t = page.getByTestId('materials-table');
    await expect(t.locator('thead th[scope="col"]')).toHaveCount(4);
    expect(await t.locator('tbody th[scope="row"]').count()).toBeGreaterThanOrEqual(6);
  });
  test('"Konfigūruoti iš …" preselects the material', async ({ page, isMobile }) => {
    await page.goto('langai.html');
    if (isMobile) await page.getByTestId('compare-b').selectOption('aliuminis');
    await page.getByRole('link', { name: 'Konfigūruoti iš aliuminio' }).click();
    await expect(page.locator('input[name="m"][value="aliuminis"]')).toBeChecked();
  });
  test('mobile: choose two materials to compare', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('langai.html');
    const col = m => page.getByTestId('materials-table').locator(`thead [data-col="${m}"]`);
    await expect(col('aliuminis')).toBeHidden();
    await page.getByTestId('compare-b').selectOption('aliuminis');
    await expect(col('aliuminis')).toBeVisible();
    await expect(col('mediena')).toBeHidden();
  });
});

// ---------- Gallery / filters ----------
test.describe('project gallery @gallery', () => {
  test('each filter shows only matching projects; count is live', async ({ page }) => {
    await page.goto('projektai.html');
    const items = page.getByTestId('filter-item');
    const all = await items.count();
    expect(all).toBeGreaterThan(5);
    const map = { material: 'data-material', product: 'data-product', building: 'data-building' };
    for (const opt of await page.getByTestId('filter-option').all()) {
      const v = await opt.getAttribute('data-value');
      const attr = map[await opt.getAttribute('data-dim')];
      await page.goto('projektai.html');
      await page.locator(`[data-value="${v}"]`).first().click();
      await expect(page.locator(`[data-value="${v}"]`).first()).toHaveAttribute('aria-pressed', 'true');
      const visible = items.filter({ visible: true });
      const n = await visible.count();
      expect(n, v).toBeGreaterThan(0);
      await expect(page.getByTestId('filter-count')).toHaveText(`Rodoma projektų: ${n}`);
      for (const it of await visible.all()) await expect(it).toHaveAttribute(attr, new RegExp(`\\b${v}\\b`));
    }
  });

  test('empty combination shows empty state; reset restores all; URL and back work', async ({ page }) => {
    await page.goto('projektai.html');
    const all = await page.getByTestId('filter-item').count();
    await page.locator('[data-filter="medziaga"] [data-value="mediena"]').click();
    await expect(page).toHaveURL(/medziaga=mediena/);
    await page.locator('[data-filter="pastatas"] [data-value="komercinis"]').click();
    await expect(page.getByTestId('filter-empty')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('filter-empty')).toBeHidden();
    await expect(page.locator('[data-filter="medziaga"] [data-value="mediena"]')).toHaveAttribute('aria-pressed', 'true');
    await page.goto('projektai.html?medziaga=mediena&pastatas=komercinis');
    await page.getByTestId('filter-reset').click();
    await expect(page.getByTestId('filter-item').filter({ visible: true })).toHaveCount(all);
  });

  test('project dialog opens with drawing, closes on Escape and returns focus', async ({ page }) => {
    await page.goto('projektai.html');
    const first = page.getByTestId('gallery-item').first();
    await first.click();
    const dlg = page.getByTestId('lightbox');
    await expect(dlg).toBeVisible();
    await expect(dlg.locator('.elev svg')).toBeVisible();
    await expect(dlg.getByRole('link', { name: 'Konfigūruoti panašų langą' })).toHaveAttribute('href', /konfiguratorius\.html\?w=/);
    const img = dlg.locator('img');
    await expect(img).toHaveJSProperty('complete', true);
    expect(await img.evaluate(i => i.naturalWidth)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    await expect(first).toBeFocused();
  });
});

// ---------- Mobile usability ----------
test.describe('mobile usability @mobile', () => {
  const PAGES = ['', 'langai.html', 'langai-norma.html', 'durys.html', 'konfiguratorius.html', 'projektai.html', 'uzklausa.html'];
  test('no horizontal scroll at 360 px', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(p || './');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `/${p}`).toBeLessThanOrEqual(1);
    }
    await ctx.close();
  });

  test('main controls are at least 44 px tall', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    for (const p of ['konfiguratorius.html', 'projektai.html', 'uzklausa.html', '', 'langai-silva.html', 'durys.html']) {
      await page.goto(p || './');
      const small = await page.evaluate(() => [...document.querySelectorAll('main button, main select, main input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([name=_gotcha]), main .choice span')]
        .filter(el => el.offsetParent !== null).map(el => [el.outerHTML.slice(0, 60), el.getBoundingClientRect().height]).filter(([, h]) => h < 43.5));
      expect(small, `/${p}`).toEqual([]);
    }
  });

  test('configurator: drawing and price stay visible while editing lower controls', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('konfiguratorius.html');
    await page.getByTestId('cfg-q').scrollIntoViewIfNeeded();
    await page.getByTestId('cfg-q').fill('3');
    await expect(page.getByTestId('cfg-price')).toBeInViewport();
    await expect(page.getByTestId('cfg-elev')).toBeInViewport();
  });
});

// ---------- Catalogue ----------
test.describe('catalogue @catalog', () => {
  test('Langai lists the three series with working pages', async ({ page }) => {
    await page.goto('langai.html');
    const links = page.getByTestId('series-link');
    await expect(links).toHaveCount(3);
    for (const href of await links.evaluateAll(as => as.map(a => a.href))) expect((await page.request.get(href)).status()).toBe(200);
  });

  test('series swatch recolours the render and updates the configure link', async ({ page }) => {
    await page.goto('langai-norma.html');
    const sw = page.getByTestId('swatch').nth(1);
    await sw.click();
    await expect(sw).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('swatch').first()).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => page.getByTestId('product-render').locator('svg:not(.wipe)').evaluate(s => s.style.getPropertyValue('--frame').trim().toUpperCase())).toBe('#3B4045');
    await expect(page.getByTestId('series-configure')).toHaveAttribute('href', /c=antracitas/);
    await expect(page.getByTestId('spec-table').locator('tr')).toHaveCount(7);
  });

  test('home series band swatches recolour their own render only', async ({ page }) => {
    await page.goto('');
    const band = page.locator('.sb').nth(1);
    await band.getByTestId('swatch').nth(1).click();
    await expect.poll(() => band.locator('[data-render] svg:not(.wipe)').evaluate(s => s.style.getPropertyValue('--frame').trim())).toBe('#F4F4F0');
    const other = await page.locator('.sb').nth(0).locator('[data-render] svg').first().evaluate(s => s.style.getPropertyValue('--frame').trim());
    expect(other).toBe('#F4F4F0');
  });

  test('Durys shows three door lines with specs', async ({ page }) => {
    await page.goto('durys.html');
    await expect(page.locator('.door')).toHaveCount(3);
    await expect(page.locator('.spec-mini').first().locator('div')).toHaveCount(3);
  });

  test('old materials URL forwards to the comparison', async ({ page }) => {
    await page.goto('medziagos.html');
    await expect(page).toHaveURL(/langai\.html#palyginimas/);
  });
});

// ---------- Motion ----------
test.describe('motion @motion', () => {
  test('signature tilt-and-turn plays once and leaves the sash closed', async ({ page }) => {
    await page.goto('');
    const sash = page.locator('[data-sash]');
    await expect(page.locator('html')).not.toHaveClass(/tilt-pending/, { timeout: 4000 });
    await expect.poll(() => sash.evaluate(el => el.getAnimations().length), { timeout: 5000 }).toBe(0);
    expect(await sash.evaluate(el => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    expect(await page.evaluate(() => sessionStorage.getItem('vitra.tilt'))).toBe('1');
  });

  test('reduced motion: no tilt, no masks, content visible', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('./');
    await expect(page.locator('html')).not.toHaveClass(/tilt-pending|reveal-ready/);
    expect(await page.locator('[data-sash]').evaluate(el => el.getAnimations().length)).toBe(0);
    const clip = await page.locator('[data-reveal]').first().evaluate(el => getComputedStyle(el).clipPath);
    expect(clip).toBe('none');
    await ctx.close();
  });

  test('hero swatch recolours the window frame', async ({ page }) => {
    await page.goto('');
    await page.getByTestId('hero-frame').locator('xpath=../..').getByTestId('swatch').nth(1).click();
    await expect(page.getByTestId('hero-frame')).toHaveAttribute('style', /--frame:\s*#3B4045/i);
  });
});
