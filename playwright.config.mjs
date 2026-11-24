import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync('qa.config.json', 'utf8'));
const DEV_PORT = 5173;
// BASE_URL is set by scripts/gate.mjs --final (production preview). Otherwise the dev server is used.
// baseURL ends with the GitHub Pages basePath; tests use relative paths ('', 'kontaktai.html').
const baseURL = process.env.BASE_URL || new URL(cfg.basePath || '/', `http://127.0.0.1:${DEV_PORT}`).href;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  forbidOnly: true,
  reporter: [['line']],
  outputDir: '.qa/test-results',
  use: { baseURL, locale: 'lt-LT', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 60_000 },
});
