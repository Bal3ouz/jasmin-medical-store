import { expect, test } from "@playwright/test";
import { signInAsAdmin, signInAsCashier, signInAsManager } from "./helpers/auth";

test.describe("demo smoke — admin", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Espace équipe/i })).toBeVisible();
  });

  test("admin sees dashboard with KPIs + queue cards", async ({ page }) => {
    await signInAsAdmin(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // KPI tiles + queue cards
    await expect(page.getByText(/Chiffre du jour/i)).toBeVisible();
    await expect(page.getByText(/Commandes à traiter/i)).toBeVisible();
  });

  test("admin sees orders queue with seeded orders", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/commandes");
    await expect(page.getByText(/JMS-/).first()).toBeVisible();
  });

  test("admin sees products list with seeded catalog", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/catalogue/produits");
    const productRows = page.locator("table tbody tr");
    await expect(productRows.first()).toBeVisible();
    expect(await productRows.count()).toBeGreaterThan(5);
  });

  test("admin sees stock list with seeded inventory", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/stock");
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("admin sees BI overview with all 6 reports", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/decisionnel");
    await expect(page.getByRole("heading", { name: "Décisionnel", exact: true })).toBeVisible();
    await expect(page.getByText(/Tendances de vente/i)).toBeVisible();
    await expect(page.getByText(/Meilleures ventes/i)).toBeVisible();
    await expect(page.getByText(/Paniers types/i)).toBeVisible();
    await expect(page.getByText(/Santé du stock/i)).toBeVisible();
    await expect(page.getByText(/Cohortes clients/i)).toBeVisible();
    await expect(page.getByText(/Conversion/i)).toBeVisible();
  });

  test("manager can access dashboard", async ({ page }) => {
    await signInAsManager(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("cashier sees orders + walk-in form", async ({ page }) => {
    await signInAsCashier(page);
    await page.goto("/commandes/nouvelle");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("cashier blocked from /decisionnel (BI)", async ({ page }) => {
    await signInAsCashier(page);
    await page.goto("/decisionnel");
    // Layout redirects cashier to /
    await expect(page).toHaveURL("/");
  });
});
