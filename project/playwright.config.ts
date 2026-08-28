import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 45000,
  use: {
    baseURL: process.env.SPEAKING_AUDIT_BASE_URL ?? "http://localhost:3128",
    trace: "retain-on-failure",
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
  ],
  webServer: {
    command: "npm run start -- -p 3128",
    port: 3128,
    reuseExistingServer: true,
    timeout: 30000,
    // E2E starts a production-mode Next server locally.  It must use the
    // explicit test-only store and signing secret; production continues to
    // require its configured database and secret.
    env: {
      ...process.env,
      ALLOW_MEMORY_STORE: "true",
      AUTH_SECRET: "playwright-local-e2e-secret-not-for-production",
      E2E_MEMORY_ONLY: "true",
    },
  },
});
