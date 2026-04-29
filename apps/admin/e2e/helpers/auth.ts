import { expect, type Page } from "@playwright/test";

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
const CASHIER_EMAIL = process.env.E2E_CASHIER_EMAIL ?? "cashier@jasmin.tn";
const CASHIER_PASSWORD = process.env.E2E_CASHIER_PASSWORD ?? "Demo1234!";

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  // Admin actions redirect to "/" on success. We only wait for *anything
  // other than* /login — error redirects bring back the form with a query
  // string, which we'd want to surface as a failed expectation.
  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 10_000 });
}

export async function signInAsAdmin(page: Page): Promise<void> {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
}

export async function signInAsCashier(page: Page): Promise<void> {
  await signIn(page, CASHIER_EMAIL, CASHIER_PASSWORD);
}
