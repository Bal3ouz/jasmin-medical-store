import path from "node:path";
import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

const SAMPLE_JPEG = path.join(__dirname, "fixtures", "sample.jpg");

/**
 * End-to-end product authoring flow:
 *
 *   create form → submit → redirect to edit page →
 *   upload image → publish → public storefront page renders product.
 *
 * Uses a unique slug suffixed with `Date.now()` so reruns don't collide
 * with prior fixture rows. The first brand and category options come
 * from seed data — both lists are required, both have entries, so
 * picking the second `<option>` (index 1, skipping the placeholder) is
 * deterministic.
 *
 * Step 7 opens a tab to the public web app on `:3000` and asserts the
 * product page renders the name. Requires the web dev server to be
 * running concurrently — `bun dev` at the monorepo root starts both.
 */
test("admin creates + publishes product, appears on storefront", async ({ page, context }) => {
  await signInAsAdmin(page);

  const slug = `test-e2e-svr-creme-${Date.now()}`;
  const name = "Test E2E SVR Crème";

  await page.goto("/catalogue/produits/nouveau");
  await expect(page.getByRole("heading", { name: "Nouveau produit" })).toBeVisible();

  // Fill the basic fields. Slug doesn't auto-fill in this build, so we
  // set it explicitly.
  await page.locator("input[name='name']").fill(name);
  await page.locator("input[name='slug']").fill(slug);

  // Brand + category — pick the first non-placeholder option.
  const brandSelect = page.locator("select[name='brandId']");
  const brandValues = await brandSelect
    .locator("option")
    .evaluateAll((opts) =>
      (opts as HTMLOptionElement[]).map((o) => o.value).filter((v) => v.length > 0),
    );
  expect(brandValues.length, "seed must include at least one brand").toBeGreaterThan(0);
  await brandSelect.selectOption(brandValues[0]!);

  const categorySelect = page.locator("select[name='categoryId']");
  const categoryValues = await categorySelect
    .locator("option")
    .evaluateAll((opts) =>
      (opts as HTMLOptionElement[]).map((o) => o.value).filter((v) => v.length > 0),
    );
  expect(categoryValues.length, "seed must include at least one category").toBeGreaterThan(0);
  await categorySelect.selectOption(categoryValues[0]!);

  // hasVariants stays unchecked by default — fill SKU + price for the
  // single-SKU path.
  await page.locator("input[name='sku']").fill(`E2E-${Date.now()}`);
  await page.locator("input[name='priceTnd']").fill("29.500");

  await page.getByRole("button", { name: "Créer le produit" }).click();

  // ProductForm's createProductAction redirects to
  // `/catalogue/produits/<uuid>` on success.
  await expect(page).toHaveURL(/\/catalogue\/produits\/[0-9a-f-]{36}/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name })).toBeVisible();

  // Upload the fixture image via the ImageUploader's file input + submit
  // button. `setInputFiles` puts the bytes into the `<input type="file">`,
  // then we click "Téléverser" to invoke `uploadProductImageAction`.
  await page.locator("input[type='file'][name='file']").setInputFiles(SAMPLE_JPEG);
  await page.getByRole("button", { name: "Téléverser" }).click();

  // After upload completes, an `<li>` image card appears in the gallery
  // grid. Wait for the success flash + at least one image card.
  await expect(page.locator("ul li img")).toHaveCount(1, { timeout: 10_000 });

  // Publish — the toolbar button reads "Publier" when the product is a
  // draft, "Dépublier" once published. After clicking, the page reloads
  // with the inverse label and the "Publié" pill.
  await page.getByRole("button", { name: "Publier", exact: true }).click();
  await expect(page.getByText("Publié", { exact: true })).toBeVisible({ timeout: 5_000 });

  // Open the storefront in a new tab and assert the product page renders
  // the product name. The storefront base URL defaults to localhost:3000;
  // override via `E2E_STOREFRONT_URL` if needed.
  const storefrontBase = process.env.E2E_STOREFRONT_URL ?? "http://localhost:3000";
  const storefrontPage = await context.newPage();
  await storefrontPage.goto(`${storefrontBase}/produit/${slug}`);
  await expect(storefrontPage.getByRole("heading", { name })).toBeVisible({ timeout: 10_000 });
});
