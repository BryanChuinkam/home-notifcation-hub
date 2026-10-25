import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e", fullyParallel: true, forbidOnly: !!process.env.CI,
  retries: 0,
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3217" } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", baseURL: "http://127.0.0.1:3218" } },
  ],
  webServer: [{ command: "npx tsx tests/fixtures/home-assistant-server.ts", url: "http://127.0.0.1:8123/__hnh_fixture_health", reuseExistingServer: false, gracefulShutdown: { signal: "SIGTERM", timeout: 10000 } }, ...[3217, 3218].map(port => ({
    command: `npx tsx scripts/e2e-server.ts ${port}`,
    url: `http://127.0.0.1:${port}/api/health`, reuseExistingServer: false, timeout: 60000,
    gracefulShutdown: { signal: "SIGTERM" as const, timeout: 10000 },
  }))],
});
