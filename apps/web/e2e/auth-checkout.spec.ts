import { expect, test } from "@playwright/test";

const email = `e2e+${Date.now()}@example.tn`;
const password = "Motdepasse123";

test("authenticated user signup → login → checkout → order in /compte/commandes", async ({
  page,
}) => {
  await page.goto("/compte/inscription");
  await page.getByLabel("Nom complet").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Mot de passe/).fill(password);
  await page.getByRole("button", { name: /Créer mon compte/i }).click();

  await expect(page).toHaveURL(/\/compte/, { timeout: 10_000 });

  await page.goto("/boutique/cosmetique");
  await page.locator("article").first().getByRole("link").first().click();
  await page.getByRole("button", { name: /Ajouter au panier/i }).click();

  await page.goto("/commande");
  await page.getByLabel("Nom complet").fill("E2E User");
  await page.getByLabel("Téléphone").first().fill("+216 22 110 220");
  await page.getByLabel("Adresse").fill("12 rue Ibn Khaldoun");
  await page.getByLabel("Ville").fill("Nabeul");
  await page.getByLabel("Code postal").fill("8000");
  await page.getByRole("button", { name: /Confirmer la commande/i }).click();

  await expect(page).toHaveURL(/\/commande\/confirmation\//);

  await page.goto("/compte/commandes");
  await expect(page.getByText(/JMS-\d{4}-\d+/)).toBeVisible();
});
