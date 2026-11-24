// Launch gate. Exit 0 = pass, 1 = blocked. Prints a short summary and blockers only.
//   node scripts/gate.mjs           checkpoint: functional tests on the dev server + required-feature coverage
//   node scripts/gate.mjs --final   production build → preview server → tests, Lighthouse, screenshots, links
// qa.config.json "mode": "client" = full QA (integration test, [DEMO] blocks, all pages/widths)
//                        "demo"   = light QA (no integration, [DEMO] allowed, Lighthouse + screenshots on main pages only)
import { spawnSync, spawn } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const final = process.argv.includes('--final');
const cfg = JSON.parse(readFileSync('qa.config.json', 'utf8'));
const client = cfg.mode !== 'demo';
const isWin = process.platform === 'win32';
const blockers = [];
const sh = (cmdline, env = {}) => spawnSync(cmdline, { shell: true, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 });
const lastLine = r => ((r.stderr || '') + (r.stdout || '')).split('\n').map(s => s.trim()).filter(Boolean).slice(-1)[0] || `exit ${r.status}`;
const base = cfg.basePath || '/';
const urlFor = (root, p) => new URL(p.replace(/^\//, ''), new URL(base, root)).href;

function runTests(baseURL, extraEnv) {
  const pw = sh('npx playwright test --reporter=json', { ...(baseURL ? { BASE_URL: baseURL } : {}), ...extraEnv });
  let report;
  try { report = JSON.parse(pw.stdout); } catch { blockers.push(`Playwright gave no report: ${lastLine(pw)}`); return; }
  if (report.errors?.length) blockers.push(`Playwright errors: ${report.errors[0].message?.split('\n')[0]}`);
  const tests = [];
  const walk = (s, path = '') => {
    const p = `${path} ${s.title || ''}`;
    (s.specs || []).forEach(sp => sp.tests.forEach(t => tests.push({
      title: sp.title, status: t.status, project: t.projectName,
      tags: [...new Set([...(sp.tags || []).map(x => x.startsWith('@') ? x : `@${x}`), ...(`${p} ${sp.title}`.match(/@[\w-]+/g) || [])])],
    })));
    (s.suites || []).forEach(c => walk(c, p));
  };
  (report.suites || []).forEach(s => walk(s));
  const failed = tests.filter(t => t.status === 'unexpected' || t.status === 'flaky');
  failed.slice(0, 8).forEach(t => blockers.push(`test failed [${t.project}]: ${t.title}`));
  const required = cfg.requiredFeatures.map(f => [f, false]);
  if (final && client) (cfg.integrationFeatures || []).forEach(f => required.push([f, true]));
  for (const [tag, isInt] of required) {
    const mine = tests.filter(t => t.tags.includes(tag) && t.tags.includes('@integration') === isInt);
    const label = `required ${isInt ? 'integration ' : ''}feature ${tag}`;
    if (!mine.length) { blockers.push(`${label}: no tests`); continue; }
    const byTitle = {};
    mine.forEach(t => (byTitle[t.title] ||= []).push(t.status));
    const never = Object.entries(byTitle).filter(([, st]) => !st.includes('expected')).map(([t]) => t);
    if (never.length) blockers.push(`${label}: skipped/not passing in any project: ${never.slice(0, 3).join(' | ')}`);
  }
  // Respect Playwright's own exit code even if the report looked fine.
  if (pw.status !== 0 && !failed.length) blockers.push(`Playwright exited ${pw.status}: ${lastLine(pw)}`);
  console.log(`Tests${baseURL ? ` (${baseURL})` : ''}: ${tests.filter(t => t.status === 'expected').length} passed, ${failed.length} failed, ${tests.filter(t => t.status === 'skipped').length} skipped`);
}

function checkTestEmail() {
  const email = process.env.QA_TEST_EMAIL || '';
  const i = cfg.integration || {};
  if (!email) return blockers.push('QA_TEST_EMAIL not set (needed for the real-integration test)'), false;
  if (!new RegExp(i.testEmailPattern || '^$').test(email)) return blockers.push(`QA_TEST_EMAIL ${email} does not match integration.testEmailPattern (use your own test inbox, e.g. name+qa@…)`), false;
  if ((i.clientEmails || []).map(e => e.toLowerCase()).includes(email.toLowerCase())) return blockers.push('QA_TEST_EMAIL is a client address – use your own test inbox'), false;
  if (/@(example\.|test\.|localhost)/i.test(email)) return blockers.push('QA_TEST_EMAIL must be a real inbox you control'), false;
  if (!i.endpointHost) return blockers.push('integration.endpointHost not set in qa.config.json'), false;
  return true;
}

if (!final) {
  runTests(null, {});
} else {
  // 1. Demo markers (client launches only)
  if (client) {
    const hits = [];
    const skip = new Set(['node_modules', 'scripts', 'tests', 'dist', 'build', 'out', '.next']);
    const scan = d => existsSync(d) && readdirSync(d).forEach(n => {
      if (n.startsWith('.') || skip.has(n)) return;
      const p = join(d, n); const s = statSync(p);
      if (s.isDirectory()) scan(p);
      else if (/\.(html|astro|jsx?|tsx?|vue|svelte|md|mdx|json)$/i.test(n) && n !== 'qa.config.json' && readFileSync(p, 'utf8').includes('[DEMO')) hits.push(p);
    });
    cfg.sourceDirs.forEach(scan);
    if (hits.length) blockers.push(`[DEMO] markers in: ${hits.slice(0, 5).join(', ')}`);
  }

  // 2. Production build (skipped for plain HTML: preview.build = null)
  let built = true;
  if (cfg.preview.build) {
    const b = sh(cfg.preview.build);
    if (b.status !== 0) { built = false; blockers.push(`production build failed: ${lastLine(b)}`); }
  }

  // 3. Preview server → tests, Lighthouse, screenshots on the production build
  if (built) {
    const server = spawn(cfg.preview.serve, { shell: true, stdio: 'ignore', detached: !isWin });
    const home = urlFor(cfg.preview.url, '');
    try {
      let up = false;
      for (let i = 0; i < 60 && !up; i++) { try { up = (await fetch(home, { redirect: 'follow' })).ok; } catch {} if (!up) await new Promise(r => setTimeout(r, 1000)); }
      if (!up) blockers.push(`preview server did not return a successful (2xx) response at ${home} within 60 s`);
      else {
        const hasIntegrations = client && (cfg.integrationFeatures || []).length > 0;
        const integrationOk = hasIntegrations && checkTestEmail();
        runTests(home, integrationOk ? { INTEGRATION: '1' } : {});
        const pages = client ? cfg.pages : cfg.pages.slice(0, 1);
        const urls = pages.map(p => urlFor(cfg.preview.url, p));
        const lh = sh(`node scripts/lh.mjs ${urls.map(u => `"${u}"`).join(' ')}`); process.stdout.write(lh.stdout);
        if (lh.status !== 0) blockers.push('Lighthouse (mobile, production) below thresholds or failed');
        if (client) {
          const lhd = sh(`node scripts/lh.mjs "${urls[0]}" --desktop`); process.stdout.write(lhd.stdout);
          if (lhd.status !== 0) blockers.push('Lighthouse (desktop, production) below thresholds or failed');
        }
        for (const u of (client ? urls : cfg.pages.map(p => urlFor(cfg.preview.url, p)))) {
          const s = sh(`node scripts/shot.mjs "${u}" --links${client ? ' --final' : ''}`); process.stdout.write(s.stdout);
          if (s.status !== 0) blockers.push(`critical screenshot/link issues: ${u}`);
        }
      }
    } finally {
      try { isWin ? spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F']) : process.kill(-server.pid); } catch {}
    }
  }
}

const label = final ? (client ? 'LAUNCH GATE (client)' : 'DEMO GATE') : 'CHECKPOINT GATE';
if (blockers.length) { console.log(`\n${label}: BLOCKED (${blockers.length})\n- ${blockers.join('\n- ')}`); process.exit(1); }
console.log(`\n${label}: PASS${final && client ? '\nManual: confirm the "[QA TEST" message arrived in your test inbox and the client inbox/CRM.' : ''}`);
