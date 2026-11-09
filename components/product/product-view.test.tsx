/** @vitest-environment jsdom */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CART_ID_KEY } from "@/lib/commerce/react/cart-provider";
import { createMockStore } from "@/test/fixtures";
import { renderWithStore } from "@/test/render";
import { ProductView } from "./product-view";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

async function openRidgeTyre(size: string | RegExp) {
  const user = userEvent.setup();
  const store = createMockStore();
  renderWithStore(<ProductView handle="ridge-trail-tyre" />, store);
  await user.click(await screen.findByRole("radio", { name: size }));
  return { user, store };
}

describe("ProductView", () => {
  it("shows live stock and caps the quantity at what is left", async () => {
    const { user } = await openRidgeTyre("29 × 2.4");
    expect(screen.getByText("Only 4 left.")).toBeInTheDocument();

    const increase = screen.getByRole("button", { name: /Increase quantity/ });
    for (let click = 0; click < 3; click++) await user.click(increase);
    expect(screen.getByRole("spinbutton", { name: /Quantity of/ })).toHaveValue(4);
    expect(increase).toBeDisabled();
  });

  it("keeps sold-out options visible but not buyable", async () => {
    await openRidgeTyre(/29 × 2\.6/);
    expect(screen.getByRole("radio", { name: "29 × 2.6 (sold out)" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Sold out" })).toBeDisabled();
  });

  it("adds to the cart and then blocks going over the stock", async () => {
    const { user, store } = await openRidgeTyre("29 × 2.4");
    const increase = screen.getByRole("button", { name: /Increase quantity/ });
    for (let click = 0; click < 3; click++) await user.click(increase);
    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(await screen.findByText("Added 4 × Ridge Trail Tyre (29 × 2.4) to your cart.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
    expect(screen.getByText(/Your cart already holds all the units/)).toBeInTheDocument();

    const cartId = window.localStorage.getItem(CART_ID_KEY);
    expect((await store.getCart(cartId ?? ""))?.totalQuantity).toBe(4);
  });
});
