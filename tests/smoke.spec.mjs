// Generic, layout-agnostic checks reused in every project. Pages come from qa.config.json.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const { pages: PAGES } = JSON.parse(readFileSync('qa.config.json', 'utf8')); // relative to basePath: '' = home
const go = (page, p) => page.goto(p || './', { waitUntil: 'load' });

for (const path of PAGES) {
  test(`page /${path} loads cleanly @smoke`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => m.type() === 'error' && errors.push(m.text()));
    page.on('response', r => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    const res = await go(page, path);
    expect(res?.status(), 'HTTP status').toBeLessThan(400);
    await expect(page).toHaveTitle(/\S{3,}/);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.getAttribute('html', 'lang')).toMatch(/^lt/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S{20,}/);
    expect(errors, 'console/JS/HTTP errors').toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'horizontal scroll').toBeLessThanOrEqual(1);
  });
}

test.describe('navigation @navigation', () => {
  test('every nav link opens a working page', async ({ page, isMobile }) => {
    await go(page, '');
    if (isMobile) await page.getByTestId('nav-toggle').click();
    const links = await page.getByTestId('nav-menu').getByRole('link').evaluateAll(as => as.map(a => ({ raw: a.getAttribute('href'), abs: a.href })));
    expect(links.length, 'nav links').toBeGreaterThan(0);
    const origin = new URL(page.url()).origin;
    for (const { raw, abs } of links) {
      if (!raw || !abs.startsWith(origin)) continue;                       // external, mailto:, tel:
      const u = new URL(abs);
      if (u.hash && u.pathname === new URL(page.url()).pathname) {          // same-page anchor
        await expect(page.locator(`[id="${decodeURIComponent(u.hash.slice(1))}"]`), `anchor ${raw}`).toHaveCount(1); continue;
      }
      const res = await page.request.get(abs.split('#')[0]);
      expect(res.status(), raw).toBeLessThan(400);
    }
  });

  test('clicking a nav link navigates (and closes the mobile menu)', async ({ page, isMobile }) => {
    await go(page, '');
    const toggle = page.getByTestId('nav-toggle');
    if (isMobile) await toggle.click();
    const link = page.getByTestId('nav-menu').getByRole('link').last();
    const target = await link.evaluate(a => a.href);
    await link.click();
    await expect(page).toHaveURL(target);
    if (isMobile && new URL(target).hash) await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('mobile menu: toggle, aria-expanded, Escape, focus', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await go(page, '');
    const toggle = page.getByTestId('nav-toggle');
    const menu = page.getByTestId('nav-menu');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});
