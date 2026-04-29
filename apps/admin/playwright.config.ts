import { defineConfig } from "@playwright/test";

/**
 * Admin Playwright config — mirrors `apps/web/playwright.config.ts` but
 * targets port 3001 (the admin Next.js dev server). Specs live under
 * `./e2e` and are excluded from `bun test` via `bunfig.toml`'s
 * `[test] pathIgnorePatterns`.
 *
 * Specs assume a provisioned Supabase project with the schema migrated
 * and seed loaded. See README "Running admin E2E tests" for the
 * required environment variables.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
    locale: "fr-TN",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: "bun run dev",
        cwd: __dirname,
        url: "http://localhost:3001",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
