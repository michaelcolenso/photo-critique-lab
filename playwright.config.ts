import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const executablePath =
  process.env.CHROMIUM_PATH ||
  (!process.env.CI && existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const chromiumOptions = {
  launchOptions: { ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] }
};
export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: process.env.PCL_RUNTIME === 'worker' ? ['**/pixels.spec.ts'] : [],
  fullyParallel: true,
  retries: 0,
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'artifacts/e2e.xml' }]]
    : 'list',
  use: {
    baseURL: process.env.PCL_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...chromiumOptions } },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        ...chromiumOptions,
        defaultBrowserType: 'chromium',
        viewport: { width: 320, height: 740 }
      }
    },
    ...(process.env.PCL_CROSS_BROWSER === 'true'
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          {
            name: 'webkit',
            use: { ...devices['iPhone 13'], viewport: { width: 320, height: 740 } }
          }
        ]
      : [])
  ],
  webServer: process.env.PCL_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000
      }
});
