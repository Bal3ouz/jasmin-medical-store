import { expect, test } from "@playwright/test";

test("guest can browse → add to cart → checkout COD → see confirmation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Prenez soin de vous/i })).toBeVisible();

  await page.getByRole("link", { name: "Boutique", exact: true }).first().click();
  await expect(page).toHaveURL(/\/boutique/);

  // Open the first category
  await page
    .getByRole("link", { name: /Cosmétique|Orthopédie/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/boutique\//);

  // Open the first product
  await page.locator("article").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/produit\//);

  await page.getByRole("button", { name: /Ajouter au panier/i }).click();
  await expect(page.getByText(/Ajouté au panier|Votre panier/i)).toBeVisible({ timeout: 5000 });

  await page.goto("/commande");
  await page.getByLabel("Nom complet").fill("Test Acheteur");
  await page.locator('input[name="phone"]').first().fill("+216 22 110 220");
  await page.locator('input[name="street"]').fill("12 rue Ibn Khaldoun");
  await page.locator('input[name="city"]').fill("Nabeul");
  await page.locator('input[name="postalCode"]').fill("8000");
  await page.locator('input[name="email"]').first().fill("guest+e2e@example.tn");

  await page.getByRole("button", { name: /Confirmer la commande/i }).click();
  await expect(page).toHaveURL(/\/commande\/confirmation\//);
  await expect(page.getByText(/JMS-\d{4}-\d+/)).toBeVisible();
});
