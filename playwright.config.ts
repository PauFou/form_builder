import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [
      "html",
      {
        outputFolder: "playwright-report",
        open: "never",
      },
    ],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"],
    ["line"],
  ],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile viewports
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  webServer: [
    {
      command: "pnpm --filter @forms/builder dev",
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    // API server commented out until backend is ready
    // {
    //   command: 'cd services/api && python manage.py runserver',
    //   port: 8000,
    //   reuseExistingServer: !process.env.CI,
    //   timeout: 120000,
    // },
    {
      command: "node scripts/webhook-receiver.js",
      port: 9000,
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
  ],
});
