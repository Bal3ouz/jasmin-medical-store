import { expect, test } from "@playwright/test";

test("newsletter footer signup confirms", async ({ page }) => {
  await page.goto("/");
  const email = `news+${Date.now()}@example.tn`;
  await page.getByLabel("Adresse email").fill(email);
  await page.getByRole("button", { name: /Je m'inscris/i }).click();
  await expect(page.getByText(/Merci, à très vite/i)).toBeVisible({ timeout: 5000 });
});
