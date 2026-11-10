import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/api/health',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      AUTH_MODE: 'local',
      STAKEUP_E2E: '1',
      APP_ORIGIN: 'http://localhost:5173',
      LOCAL_DATA_FILE: `.local/e2e-${Date.now()}.json`,
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1080 } },
    },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
});
