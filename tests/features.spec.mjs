// Project-specific functional tests, one describe per feature in DESIGN.md "Business functionality".
// Tag each describe with its feature (@contact-form …) and list required tags in qa.config.json.
// scripts/gate.mjs BLOCKS launch if a required feature has no tests or any of its tests are skipped.
// Templates below are skipped: adapt them (remove .skip) or delete the ones that don't apply.
// Convention: interactive elements carry data-testid (infrastructure, not layout).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const CFG = JSON.parse(readFileSync('qa.config.json', 'utf8'));
// Paths are relative to basePath (GitHub Pages): 'kontaktai.html' or 'kontaktai', never 'kontaktai.html'.

const INTEGRATION = process.env.INTEGRATION === '1';

// ---------- Contact form (mocked endpoint: runs on every gate) ----------
test.describe.skip('contact form @contact-form', () => {
  const ENDPOINT = '**/api/contact**'; // TODO: the form's real endpoint pattern
  let requests;
  test.beforeEach(async ({ page }) => {
    requests = [];
    await page.route(ENDPOINT, async r => { requests.push(r.request()); await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
    await page.goto('kontaktai.html');
  });

  test('invalid input: Lithuanian errors, aria-invalid, nothing sent', async ({ page }) => {
    const form = page.getByTestId('contact-form');
    await form.getByLabel(/el\. paštas/i).fill('neteisingas');
    await form.getByRole('button', { name: /siųsti/i }).click();
    await expect(form.getByLabel(/el\. paštas/i)).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByTestId('form-error').first()).toContainText(/[ąčęėįšųūž]|privaloma|neteising/i);
    expect(requests, 'no request on invalid input').toHaveLength(0);
  });

  test('consent is required', async ({ page }) => {
    const form = page.getByTestId('contact-form');
    await fillValid(form);
    await form.getByRole('button', { name: /siųsti/i }).click();
    expect(requests).toHaveLength(0);
    await expect(form.getByTestId('form-error').first()).toBeVisible();
  });

  test('valid submit sends correct payload once and shows success', async ({ page }) => {
    const form = page.getByTestId('contact-form');
    await fillValid(form);
    await form.getByTestId('consent').check();
    await form.getByRole('button', { name: /siųsti/i }).click();
    await expect(page.getByTestId('form-success')).toBeVisible();
    await expect(page.getByTestId('form-success')).toContainText(/ačiū|gavome|išsiųsta/i);
    expect(requests, 'exactly one request').toHaveLength(1);
    const data = payload(requests[0]);
    expect(data).toMatchObject({ name: 'Testas Testaitis', email: 'testas@example.com', message: 'Bandomoji žinutė' }); // TODO: field names
    await expect(form.getByRole('button', { name: /siųsti/i })).toBeEnabled();
  });

  test('server error shows a helpful message', async ({ page }) => {
    await page.unroute(ENDPOINT);
    await page.route(ENDPOINT, r => r.fulfill({ status: 500, body: 'err' }));
    const form = page.getByTestId('contact-form');
    await fillValid(form);
    await form.getByTestId('consent').check();
    await form.getByRole('button', { name: /siųsti/i }).click();
    await expect(page.getByTestId('form-error-server')).toBeVisible();
    await expect(page.getByTestId('form-success')).toBeHidden();
  });
});

// ---------- Contact form: REAL integration (gate --final sets INTEGRATION=1) ----------
// Safe by design: one submission, explicit test marker, test inbox, never against production unless allowed.
test.describe.skip('contact form real delivery @contact-form @integration', () => {
  test.describe.configure({ retries: 0 });
  test('submits one marked test message to the real endpoint', async ({ page, baseURL }, info) => {
    test.skip(!INTEGRATION, 'set INTEGRATION=1 (done by gate --final)');
    test.skip(info.project.name !== 'desktop', 'run once, desktop only');
    // Safety: local production preview by default; a live URL needs explicit client approval.
    const isLocal = /localhost|127\.0\.0\.1|\[::1\]/.test(baseURL || '');
    test.skip(!isLocal && process.env.ALLOW_PROD_SUBMIT !== '1', 'live URL: set ALLOW_PROD_SUBMIT=1 after client approval');
    const email = process.env.QA_TEST_EMAIL || '';
    const { endpointHost, testEmailPattern, clientEmails = [] } = CFG.integration || {};
    expect(email, 'QA_TEST_EMAIL must be your own test inbox').toMatch(new RegExp(testEmailPattern));
    expect(clientEmails.map(e => e.toLowerCase())).not.toContain(email.toLowerCase());

    await page.goto('kontaktai.html');
    const form = page.getByTestId('contact-form');
    await form.getByLabel(/vardas/i).fill('QA TESTAS');
    await form.getByLabel(/el\. paštas/i).fill(email);
    await form.getByLabel(/žinutė/i).fill(`[QA TEST – ignoruokite] ${new Date().toISOString()}`);
    await form.getByTestId('consent').check();
    const [res] = await Promise.all([
      page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).hostname.endsWith(endpointHost), { timeout: 20000 }),
      form.getByRole('button', { name: /siųsti/i }).click(),
    ]);
    expect(new URL(res.url()).hostname, 'form posts to the configured endpoint only').toMatch(new RegExp(`${endpointHost.replace(/\./g, '\\.')}$`));
    expect(res.status(), 'real endpoint status').toBeLessThan(300);
    await expect(page.getByTestId('form-success')).toBeVisible();
    console.log(`MANUAL CHECK: confirm the "[QA TEST" message arrived at the client inbox/CRM and in ${email}.`);
  });
});

// ---------- Filters ----------
test.describe.skip('filters @filters', () => {
  test('each filter shows only matching items; reset restores all', async ({ page }) => {
    await page.goto('projektai.html');
    const items = page.getByTestId('filter-item');
    const all = await items.count();
    expect(all).toBeGreaterThan(1);
    for (const opt of await page.getByTestId('filter-option').all()) {
      const cat = await opt.getAttribute('data-category');
      await opt.click();
      await expect(opt).toHaveAttribute('aria-pressed', 'true');
      const visible = items.filter({ visible: true });
      expect(await visible.count()).toBeGreaterThan(0);
      for (const it of await visible.all()) await expect(it).toHaveAttribute('data-category', new RegExp(`\\b${cat}\\b`));
    }
    await page.getByTestId('filter-reset').click();
    await expect(items.filter({ visible: true })).toHaveCount(all);
  });
});

// ---------- Calculator (expected values from the client's formula, never invented) ----------
test.describe.skip('calculator @calculator', () => {
  const cases = [ // TODO: from DESIGN.md formula; include boundaries and rounding
    { area: '100', expected: '1 250,00 €' },
    { area: '0,5', expected: '6,25 €' },
  ];
  for (const c of cases) {
    test(`area ${c.area} → ${c.expected}`, async ({ page }) => {
      await page.goto('skaiciuokle.html');
      await page.getByTestId('calc-area').fill(c.area);
      await expect(page.getByTestId('calc-result')).toHaveText(c.expected);
    });
  }
  for (const bad of ['-5', 'abc', '']) {
    test(`rejects "${bad}"`, async ({ page }) => {
      await page.goto('skaiciuokle.html');
      await page.getByTestId('calc-area').fill(bad);
      await expect(page.getByTestId('calc-error')).toBeVisible();
      await expect(page.getByTestId('calc-result')).not.toHaveText(/NaN|undefined|Infinity/);
    });
  }
});

// ---------- Gallery / lightbox ----------
test.describe.skip('gallery @gallery', () => {
  test('opens selected image, navigates, closes and returns focus', async ({ page }) => {
    await page.goto('galerija.html');
    const first = page.getByTestId('gallery-item').first();
    await first.click();
    const box = page.getByTestId('lightbox');
    await expect(box).toBeVisible();
    const img = box.locator('img');
    const src1 = await img.getAttribute('src');
    await expect(img).toHaveJSProperty('complete', true);
    expect(await img.evaluate(i => i.naturalWidth)).toBeGreaterThan(0);
    await page.keyboard.press('ArrowRight');
    await expect(img).not.toHaveAttribute('src', src1);
    await page.keyboard.press('Escape');
    await expect(box).toBeHidden();
    await expect(first).toBeFocused();
  });
});

function payload(req) {
  const raw = req.postData() || '';
  const type = req.headers()['content-type'] || '';
  if (type.includes('json')) return JSON.parse(raw);
  if (type.includes('urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  const out = {}; // multipart/form-data
  for (const m of raw.matchAll(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n--/g)) out[m[1]] = m[2];
  return out;
}

async function fillValid(form) {
  await form.getByLabel(/vardas/i).fill('Testas Testaitis');
  await form.getByLabel(/el\. paštas/i).fill('testas@example.com');
  await form.getByLabel(/žinutė/i).fill('Bandomoji žinutė');
}
