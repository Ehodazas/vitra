// Lighthouse via Node API (no shell quoting issues on Windows), using Playwright's Chromium.
// Usage: node scripts/lh.mjs <url> [<url> ...] [--desktop]
// Prints scores, key metrics and top failed audits per URL.
// Exit 1 if any run failed or a score is below qa.config.json "lighthouseMin" (defaults P85 A90 BP90 SEO90).
// Final checks must target the production build (scripts/gate.mjs --final does this).
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const urls = args.filter(a => !a.startsWith('--'));
const desktop = args.includes('--desktop');
if (!urls.length) { console.error('Usage: node scripts/lh.mjs <url> [<url> ...] [--desktop]'); process.exit(1); }
mkdirSync('.qa', { recursive: true });
const MIN = { performance: 85, accessibility: 90, 'best-practices': 90, seo: 90,
  ...(existsSync('qa.config.json') ? JSON.parse(readFileSync('qa.config.json', 'utf8')).lighthouseMin : {}) };

let failed = 0;
let chrome;
try {
  chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
} catch (e) {
  console.log(`LIGHTHOUSE ERROR: could not launch Chromium (${e.message}). Run: npx playwright install chromium`);
  process.exit(1);
}

try {
  for (const url of urls) {
    try {
      const flags = { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] };
      const res = await lighthouse(url, flags, desktop ? desktopConfig : undefined);
      const lhr = res?.lhr;
      if (!lhr) throw new Error('no result');
      const name = (new URL(url).pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home') + (desktop ? '-desktop' : '');
      writeFileSync(`.qa/lh-${name}.json`, res.report);

      if (lhr.runtimeError) { console.log(`${url}: LIGHTHOUSE ERROR ${lhr.runtimeError.code} – ${lhr.runtimeError.message}`); failed++; continue; }
      const s = k => lhr.categories[k]?.score == null ? '–' : Math.round(lhr.categories[k].score * 100);
      const a = lhr.audits;
      console.log(`${url} [${desktop ? 'desktop' : 'mobile'}]: P${s('performance')} A${s('accessibility')} BP${s('best-practices')} SEO${s('seo')} | LCP ${a['largest-contentful-paint']?.displayValue ?? '–'} CLS ${a['cumulative-layout-shift']?.displayValue ?? '–'} TBT ${a['total-blocking-time']?.displayValue ?? '–'}`);
      const low = Object.entries(MIN).filter(([k, m]) => typeof lhr.categories[k]?.score !== 'number' || lhr.categories[k].score * 100 < m).map(([k, m]) => `${k} ${s(k)}<${m}`);
      if (low.length) { console.log(`  BELOW THRESHOLD: ${low.join(', ')}`); failed++; }
      if (lhr.runWarnings?.length) console.log(`  warnings: ${lhr.runWarnings.slice(0, 2).join(' ; ')}`);
      const top = Object.values(a)
        .filter(x => x.score !== null && x.score < 0.9 && ['binary', 'numeric', 'metricSavings'].includes(x.scoreDisplayMode))
        .sort((x, y) => x.score - y.score).slice(0, 8)
        .map(x => `  - ${x.title}${x.displayValue ? ` (${x.displayValue})` : ''}`);
      if (top.length) console.log(top.join('\n'));
    } catch (e) {
      console.log(`${url}: LIGHTHOUSE ERROR – ${e.message.split('\n')[0]} (is the dev server running?)`);
      failed++;
    }
  }
} finally {
  await chrome.kill();
}
process.exit(failed ? 1 : 0);
