import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

/**
 * Walks one pending order through the full happy-path lifecycle:
 *
 *   pending → confirmed → preparing → shipped → delivered
 *
 * Each transition is driven by clicking the action button rendered by
 * `OrderTransitionMenu` and asserting the badge label flips to match
 * `OrderStateBadge`. After all four transitions, the order's events
 * history must contain 5 entries: the initial `created` event seeded
 * with the order, plus one event per transition.
 *
 * Requires a provisioned Supabase project with at least one seeded
 * order in `pending` status — the seed loaded by `bun db:seed` includes
 * these.
 */
test("admin walks order through pending → confirmed → preparing → shipped → delivered", async ({
  page,
}) => {
  await signInAsAdmin(page);

  // Filter to the pending queue so the first row click is deterministic.
  await page.goto("/commandes?status=pending");
  await expect(page.getByRole("heading", { name: "File d'attente" })).toBeVisible();

  // The orders table renders rows as `<a>` inside `<tbody>` (DataTable's
  // `rowHref`), so we click the first row link inside the table body.
  // Since ?status=pending filters the result set, every visible row is
  // a pending order — the first one is fine.
  const firstRow = page.locator("tbody a").first();
  await expect(firstRow).toBeVisible({ timeout: 10_000 });
  await firstRow.click();

  await expect(page).toHaveURL(/\/commandes\/JMS-/);
  await expect(page.getByText("En attente").first()).toBeVisible();

  // Confirmer → Confirmée
  await page.getByRole("button", { name: "Confirmer", exact: true }).click();
  await expect(page.getByText("Confirmée").first()).toBeVisible({ timeout: 5_000 });

  // Préparer → Préparation
  await page.getByRole("button", { name: "Préparer", exact: true }).click();
  await expect(page.getByText("Préparation").first()).toBeVisible({ timeout: 5_000 });

  // Expédier → Expédiée
  await page.getByRole("button", { name: "Expédier", exact: true }).click();
  await expect(page.getByText("Expédiée").first()).toBeVisible({ timeout: 5_000 });

  // Marquer livrée → Livrée
  await page.getByRole("button", { name: "Marquer livrée", exact: true }).click();
  await expect(page.getByText("Livrée").first()).toBeVisible({ timeout: 5_000 });

  // Verify the events history list now contains 5 entries (created +
  // 4 transitions). The "Historique" section is the only `<ul>` rendered
  // inside the events `<section>`; we anchor on the heading and count
  // its sibling list items.
  const historySection = page.locator("section", { has: page.getByRole("heading", { name: "Historique" }) });
  await expect(historySection.locator("ul > li")).toHaveCount(5, { timeout: 5_000 });
});
