/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * End-to-end tests: the production build served by `vite preview`, driven in Chromium.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // The offline test opts back in; elsewhere a cached app shell would only hide changes.
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 820 } }, testIgnore: '**/mobile.e2e.ts' },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: '**/mobile.e2e.ts' },
  ],
  webServer: {
    command: `pnpm run build && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
