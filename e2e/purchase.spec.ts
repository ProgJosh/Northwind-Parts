import { expect, test, type Page } from "@playwright/test";

const DEMO_NOTE = "DEMO STORE – no real orders or payments";

async function expectDemoBanner(page: Page) {
  await expect(page.getByRole("note", { name: "Demo notice" })).toHaveText(DEMO_NOTE);
}

async function fillDeliveryDetails(page: Page) {
  await page.getByLabel("Email").fill("anna@example.com");
  await page.getByLabel("First name").fill("Anna");
  await page.getByLabel("Last name").fill("Muster");
  await page.getByLabel("Street and house number").fill("Seestrasse 12");
  await page.getByLabel("Postcode").fill("8002");
  await page.getByLabel("Town or city").fill("Zürich");
}

test("browse, add to cart, and check out with the approved test card", async ({ page }) => {
  await page.goto("/");
  await expectDemoBanner(page);

  // Browse a category, then open a product.
  await page.getByRole("navigation", { name: "Categories" }).getByRole("link", { name: "Wheels & Tyres" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Wheels & Tyres" })).toBeVisible();
  await page.getByRole("link", { name: "Ridge Trail Tyre" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Ridge Trail Tyre" })).toBeVisible();
  await expectDemoBanner(page);

  // Pick the low-stock size and add two.
  await page.getByRole("radio", { name: "29 × 2.4", exact: true }).check();
  await expect(page.getByText("Only 4 left.")).toBeVisible();
  await page.getByRole("button", { name: /Increase quantity/ }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Added 2 × Ridge Trail Tyre (29 × 2.4) to your cart.")).toBeVisible();

  // The cart survives a refresh.
  await page.reload();
  await page.getByRole("link", { name: "Cart, 2 items" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Your cart" })).toBeVisible();
  const summary = page.getByRole("complementary", { name: "Order summary" });
  await expect(summary).toContainText(/Shipping · Standard post\s*Free/);
  await expect(summary).toContainText(/Total\s*CHF\s129\.80/);
  await expectDemoBanner(page);
  await page.getByRole("link", { name: "Check out" }).click();

  // Details: the step validates before moving on.
  await expectDemoBanner(page);
  await expect(page.getByRole("complementary", { name: "Demo notice" })).toContainText(DEMO_NOTE);
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByText("Enter your email address.")).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
  await fillDeliveryDetails(page);
  await page.getByRole("button", { name: "Continue to payment" }).click();

  // Payment with the documented approved test card.
  await expect(page.getByRole("complementary", { name: "Demo notice" })).toContainText(DEMO_NOTE);
  await page.getByLabel("Test card number").fill("4242 4242 4242 4242");
  await page.getByLabel("Expiry (MM/YY)").fill("12/40");
  await page.getByLabel("Security code").fill("123");
  await page.getByRole("button", { name: /^Pay CHF\s129\.80 \(simulated\)$/ }).click();

  // Confirmation with a demo order number and the demo note.
  await expect(page.getByRole("heading", { level: 1, name: "Thank you, Anna!" })).toBeVisible();
  await expect(page).toHaveURL(/\/orders\/order_[0-9a-f]+$/);
  await expect(page.getByText("Demo order #DEMO-1001")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Demo notice" })).toContainText(DEMO_NOTE);
  await expectDemoBanner(page);
  await expect(page.getByRole("link", { name: "Cart, 0 items" })).toBeVisible();

  // The order took the stock down by two.
  await page.goto("/products/ridge-trail-tyre?variant=100102");
  await expect(page.getByText("Only 2 left.")).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "#DEMO-1001" })).toBeVisible();
});

test("refuses a real-looking card, shows a decline, then lets the shopper retry", async ({ page }) => {
  await page.goto("/products/glow-rear-light");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Added 1 × Glow Rear Light to your cart.")).toBeVisible();

  await page.goto("/checkout");
  await fillDeliveryDetails(page);
  // The delivery choice is saved to the cart before the radio shows as selected.
  await page.getByRole("radio", { name: /Express courier/ }).click();
  await expect(page.getByRole("radio", { name: /Express courier/ })).toBeChecked();
  await page.getByRole("button", { name: "Continue to payment" }).click();

  // A number that is not a test card never reaches the gateway.
  await page.getByLabel("Test card number").fill("5555 5555 5555 4444");
  await page.getByLabel("Expiry (MM/YY)").fill("12/40");
  await page.getByLabel("Security code").fill("123");
  await page.getByRole("button", { name: /^Pay / }).click();
  await expect(page.getByText(/only accepts the test card numbers listed on this page/)).toBeVisible();

  // The declined test card fails, and the shopper stays on the payment step.
  await page.getByRole("button", { name: "Use the declined test card" }).click();
  await page.getByRole("button", { name: /^Pay / }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Your card was declined (simulated)" })).toBeVisible();
  await expect(page).toHaveURL(/\/checkout\/payment$/);

  // Retrying with the approved test card places the order.
  await page.getByRole("button", { name: "Use the approved test card" }).click();
  await page.getByRole("button", { name: /^Pay CHF\s48\.90 \(simulated\)$/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Thank you, Anna!" })).toBeVisible();
  await expect(page.getByText("Express courier", { exact: true })).toBeVisible();
});
