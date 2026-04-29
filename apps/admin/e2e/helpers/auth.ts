import { type Page, expect } from "@playwright/test";

/**
 * Sign-in helpers for admin E2E specs.
 *
 * Both helpers fill the `/login` form and wait for the post-redirect URL
 * (admin home `/`). Credentials come from env vars, with documented
 * fallbacks matching the seed (`packages/db/seed.ts`). The seed-loaded
 * Supabase project must have these users provisioned via
 * `supabase auth admin create-user` before running specs — see
 * README "Running admin E2E tests".
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@jasmin.tn";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Demo1234!";
const MANAGER_EMAIL = process.env.E2E_MANAGER_EMAIL ?? "manager@jasmin.tn";
const MANAGER_PASSWORD = process.env.E2E_MANAGER_PASSWORD ?? "Demo1234!";
const CASHIER_EMAIL = process.env.E2E_CASHIER_EMAIL ?? "cashier@jasmin.tn";
const CASHIER_PASSWORD = process.env.E2E_CASHIER_PASSWORD ?? "Demo1234!";

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  // NOTE: Next dev + Server Actions can race with Playwright clicks. If this
  // times out, the demo still works — humans clicking the form sign in fine.
  // For automated CI, switch to a `next start` build (Server Actions are stable
  // there) or run admin specs against a deployed preview.
  await expect
    .poll(() => page.url(), { timeout: 15_000, intervals: [200, 500, 1000] })
    .not.toMatch(/\/login(\?|$)/);
}

export async function signInAsAdmin(page: Page): Promise<void> {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
}

export async function signInAsManager(page: Page): Promise<void> {
  await signIn(page, MANAGER_EMAIL, MANAGER_PASSWORD);
}

export async function signInAsCashier(page: Page): Promise<void> {
  await signIn(page, CASHIER_EMAIL, CASHIER_PASSWORD);
}
