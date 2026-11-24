// Screenshots + layout checks + optional link check. Prints a short summary only.
// Usage: node scripts/shot.mjs <url> [--final] [--links] [--external]
//   default : 390 (fold + full page) and 1440 (full page)
//   --final : also 360, 430, 768, 1024, 1280, 1920 (full page)
// Exit 1 on critical issues (load failure, JS/HTTP errors, horizontal scroll, missing alt, lazy/extra-priority
// hero images, broken images/links/anchors, h1 count, lorem). Minor issues are printed only.
//   --links : check same-origin links, images, anchors; --external also checks external links
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
const has = f => args.includes(f);
if (!url) { console.error('Usage: node scripts/shot.mjs <url> [--final] [--links] [--external]'); process.exit(1); }

const slug = (new URL(url).pathname.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home');
const dir = `.qa/${slug}`;
mkdirSync(dir, { recursive: true });

const base = [
  { name: 'mobile', w: 390, h: 844, mobile: true, fold: true },
  { name: 'desktop', w: 1440, h: 900 },
];
const extra = [
  { name: 'm360', w: 360, h: 740, mobile: true },
  { name: 'm430', w: 430, h: 932, mobile: true },
  { name: 't768', w: 768, h: 1024, mobile: true },
  { name: 'd1024', w: 1024, h: 768 },
  { name: 'd1280', w: 1280, h: 800 },
  { name: 'd1920', w: 1920, h: 1080 },
];
const views = has('--final') ? [...base, ...extra] : base;

async function load(page) {
  // 'load' + short best-effort network idle: avoids hanging on analytics, chat widgets, websockets.
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
}

async function scrollThrough(page) {
  // Trigger lazy images/scroll animations so full-page screenshots aren't blank.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

const browser = await chromium.launch();
let exitCode = 0;
try {
  for (const v of views) {
    const ctx = await browser.newContext({
      viewport: { width: v.w, height: v.h }, isMobile: !!v.mobile, hasTouch: !!v.mobile,
      deviceScaleFactor: v.mobile ? 2 : 1, locale: 'lt-LT', reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(`js: ${e.message}`));
    page.on('console', m => m.type() === 'error' && errors.push(`console: ${m.text()}`));
    page.on('response', r => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    try { await load(page); } catch (e) { console.log(`${v.name}: LOAD FAILED – ${e.message.split('\n')[0]}`); exitCode = 1; await ctx.close(); continue; }

    // critical → exit 1; minor → warning only
    const { critical, minor } = await page.evaluate(() => {
      const critical = [], minor = [];
      const vw = window.innerWidth, vh = window.innerHeight;
      if (document.documentElement.scrollWidth > vw + 1) critical.push(`horizontal scroll (${document.documentElement.scrollWidth}px)`);
      const visible = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const small = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button]')]
        .filter(visible).filter(e => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; })
        .filter(e => !(e.tagName === 'A' && e.closest('p,li') && getComputedStyle(e).display === 'inline')); // inline text links exempt
      if (small.length) minor.push(`${small.length} tap targets <44px`);
      const imgs = [...document.images];
      const noAlt = imgs.filter(i => !i.hasAttribute('alt'));
      if (noAlt.length) critical.push(`${noAlt.length} <img> missing alt attribute`);
      const fold = imgs.filter(i => { const r = i.getBoundingClientRect(); return r.top < vh && r.bottom > 0 && r.width > 0; });
      if (fold.some(i => i.loading === 'lazy')) critical.push(`${fold.filter(i => i.loading === 'lazy').length} above-the-fold image(s) loading=lazy`);
      const high = imgs.filter(i => i.getAttribute('fetchpriority') === 'high');
      if (high.length > 1) critical.push(`${high.length} images with fetchpriority=high (only the main LCP image may have it)`);
      const largest = fold.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0];
      if (largest && largest.getBoundingClientRect().width > vw * 0.4 && largest.getAttribute('fetchpriority') !== 'high') minor.push('largest above-the-fold image lacks fetchpriority=high (check it is the LCP element)');
      if (high.some(i => !fold.includes(i))) minor.push('fetchpriority=high on an image outside the first screen at this viewport');
      const unsized = imgs.filter(i => !i.getAttribute('width') || !i.getAttribute('height')).length;
      if (unsized) minor.push(`${unsized} images without width/height`);
      const broken = imgs.filter(i => i.complete && i.naturalWidth === 0 && i.currentSrc).length;
      if (broken) critical.push(`${broken} images failed to load`);
      const h1 = document.querySelectorAll('h1').length;
      if (h1 !== 1) critical.push(`h1 count ${h1}`);
      const tiny = [...document.querySelectorAll('p,li,a,span,label')].filter(visible)
        .filter(e => e.childElementCount === 0 && e.textContent.trim().length > 20 && parseFloat(getComputedStyle(e).fontSize) < 14).length;
      if (tiny) minor.push(`${tiny} text elements <14px`);
      if (/lorem ipsum/i.test(document.body.innerText)) critical.push('lorem ipsum found');
      return { critical, minor };
    });
    if (critical.length) exitCode = 1;

    const shots = [];
    if (v.fold) { await page.screenshot({ path: `${dir}/${v.name}-fold.png` }); shots.push(`${dir}/${v.name}-fold.png`); }
    await scrollThrough(page);
    await page.screenshot({ path: `${dir}/${v.name}.png`, fullPage: true });
    shots.push(`${dir}/${v.name}.png`);

    console.log(`${v.name} ${v.w}px: ${shots.join(', ')}${critical.length ? ' | CRITICAL: ' + critical.join('; ') : ''}${minor.length ? ' | minor: ' + minor.join('; ') : ''}${!critical.length && !minor.length ? ' | ok' : ''}`);
    if (errors.length) { console.log(`  CRITICAL errors (${errors.length}): ${[...new Set(errors)].slice(0, 5).join(' ; ')}`); exitCode = 1; }

    if (has('--links') && v.name === 'desktop') {
      const { links, anchors } = await page.evaluate(() => ({
        links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => /^https?:/.test(h)))],
        anchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.getElementById(decodeURIComponent(h.slice(1)))),
      }));
      const origin = new URL(url).origin;
      const targets = links.filter(h => has('--external') || h.startsWith(origin)).map(h => h.split('#')[0]);
      const bad = [];
      for (const h of [...new Set(targets)]) {
        try {
          let r = await page.request.head(h, { timeout: 15000, failOnStatusCode: false });
          if (r.status() === 405 || r.status() === 403) r = await page.request.get(h, { timeout: 15000, failOnStatusCode: false });
          if (r.status() >= 400) bad.push(`${r.status()} ${h}`);
        } catch (e) { bad.push(`ERR ${h}`); }
      }
      console.log(`  links: ${targets.length} checked, ${bad.length} broken${bad.length ? ': ' + bad.slice(0, 10).join(' ; ') : ''}${anchors.length ? ` | missing anchor targets: ${anchors.join(', ')}` : ''}`);
      if (bad.length || anchors.length) exitCode = 1;
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
process.exit(exitCode);
