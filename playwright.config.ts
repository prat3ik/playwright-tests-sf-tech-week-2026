// playwright.config.ts
// Baseline follows playwright-skill/core/configuration.md ("Production-Ready Config"),
// trimmed to what this project needs: a remote target (no webServer) and one browser.
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const isCI = !!process.env.CI;

export default defineConfig({
  // ── Test discovery ──────────────────────────────────────────────
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // ── Execution ───────────────────────────────────────────────────
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Local cap: the demo store's login view is lazy-loaded and slow on a cold
  // hit; more than ~3 concurrent Chrome instances on a laptop pushes
  // navigations past their timeout.
  workers: isCI ? '50%' : 3,

  // ── Reporting ───────────────────────────────────────────────────
  reporter: isCI
    ? [['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'on-failure' }]],

  // ── Timeouts ────────────────────────────────────────────────────
  // The store's login chunk can take 10s+ to render, so these sit at the
  // upper end of the skill's recommended ranges rather than the defaults.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // ── Shared browser context options ──────────────────────────────
  use: {
    baseURL: process.env.BASE_URL || 'https://storedemo.testdino.com',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',

    locale: 'en-US',
    testIdAttribute: 'data-testid',
  },

  // ── Projects ────────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.BROWSER_CHANNEL || 'chrome',
      },
    },
  ],
});
