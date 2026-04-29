import { expect, test } from "@playwright/test";

test.describe("demo smoke — storefront", () => {
  test("landing page renders editorial hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Prenez soin de vous/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Boutique", exact: true }).first()).toBeVisible();
  });

  test("boutique parent category surfaces products from descendant leaves", async ({ page }) => {
    await page.goto("/boutique/cosmetique");
    const productLinks = page.locator('a[href^="/produit/"]');
    await expect(productLinks.first()).toBeVisible();
    expect(await productLinks.count()).toBeGreaterThan(20);
  });

  test("boutique leaf category renders", async ({ page }) => {
    await page.goto("/boutique/visage");
    const productLinks = page.locator('a[href^="/produit/"]');
    await expect(productLinks.first()).toBeVisible();
  });

  test("product detail page renders", async ({ page }) => {
    // Pick the first product from the boutique to avoid hard-coded slug drift.
    await page.goto("/boutique/visage");
    const firstProduct = page.locator('a[href^="/produit/"]').first();
    const href = await firstProduct.getAttribute("href");
    await page.goto(href!);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("notre-histoire content page", async ({ page }) => {
    await page.goto("/notre-histoire");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("contact page", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
