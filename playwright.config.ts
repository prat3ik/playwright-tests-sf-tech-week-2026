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

    // ── Video (Playwright 1.63 native annotations) ──────────────────
    // VIDEO=1 records every test and overlays what the test is doing:
    //   show.actions  highlights each element the test interacts with, with
    //                 the action title (click, fill, expect.toHaveText …)
    //   show.test     shows the test title and the live test.step() stack
    // Chapter and assertion cards are added by tests/support/video-narration.ts
    // through page.screencast.showChapter() / showOverlay().
    video: {
      mode: process.env.VIDEO ? 'on' : isCI ? 'retain-on-failure' : 'off',
      size: { width: 1280, height: 720 },
      show: {
        actions: { duration: 900, position: 'top-right', fontSize: 20, cursor: 'pointer' },
        test: { level: 'step', position: 'top-left', fontSize: 16 },
      },
    },

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
