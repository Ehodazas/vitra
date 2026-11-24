// Tiny static server for plain HTML/CSS/JS and GitHub Pages projects (no dependencies).
// Serves <dir> under qa.config.json "basePath" (e.g. "/grindas/" like GitHub Pages project sites).
// Usage: node scripts/serve.mjs [dir=.] [port=4173]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, normalize, extname, resolve, sep } from 'node:path';

const dir = resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 4173);
const base = (existsSync('qa.config.json') && JSON.parse(readFileSync('qa.config.json', 'utf8')).basePath) || '/';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml', '.pdf': 'application/pdf' };

// Never served: dotfiles/dirs, dependencies, QA/test infrastructure and project config.
const PRIVATE_DIRS = new Set(['node_modules', 'tests', 'src']);
const QA_SCRIPTS = /^scripts\/(gate|shot|lh|serve|pages)\.mjs$/; // site JS in scripts/ stays public
const PRIVATE_FILES = /^(package(-lock)?\.json|qa\.config\.json|playwright\.config\.[cm]?js|DESIGN\.md|PRODUCT\.md|CLAUDE\.md|.*\.config\.[cm]?[jt]s)$/i;
const isPrivate = rel => { const parts = rel.split(/[\\/]/).filter(p => p && p !== '.');
  return parts.some(p => p.startsWith('.') || PRIVATE_DIRS.has(p)) || PRIVATE_FILES.test(parts.at(-1) || '') || QA_SCRIPTS.test(parts.join('/')); };

async function file(p) { try { const s = await stat(p); return s.isDirectory() ? file(join(p, 'index.html')) : p; } catch { return null; } }

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (base !== '/' && url === base.replace(/\/$/, '')) { res.writeHead(301, { Location: base }); return res.end(); }
  if (!url.startsWith(base)) { res.writeHead(404); return res.end('outside basePath'); }
  const rel = normalize(url.slice(base.length)).replace(/^([/\\])+/, '');
  if (isPrivate(rel)) { res.writeHead(404); return res.end('Not found'); }
  const target = join(dir, rel);
  if (!target.startsWith(dir + sep) && target !== dir) { res.writeHead(403); return res.end(); }
  // GitHub Pages behaviour: /path → /path.html → /path/index.html → 404.html
  const found = (await file(target)) || (await file(target + '.html'));
  if (found) { res.writeHead(200, { 'Content-Type': types[extname(found).toLowerCase()] || 'application/octet-stream' }); return res.end(await readFile(found)); }
  const nf = await file(join(dir, '404.html'));
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(nf ? await readFile(nf) : 'Not found');
}).listen(port, '127.0.0.1', () => console.log(`Serving ${dir} at http://127.0.0.1:${port}${base} (local only)`));
