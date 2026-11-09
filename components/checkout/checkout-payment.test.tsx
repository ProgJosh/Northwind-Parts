/** @vitest-environment jsdom */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CART_ID_KEY } from "@/lib/commerce/react/cart-provider";
import { BUYER, createMockStore, VARIANTS } from "@/test/fixtures";
import { renderWithStore } from "@/test/render";
import { CheckoutPayment } from "./checkout-payment";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

/** The fake gateway waits about a second before answering. */
const GATEWAY_WAIT = { timeout: 3_000 };

async function renderPaymentStep() {
  const store = createMockStore();
  const { id } = await store.createCart();
  await store.addToCart(id, VARIANTS.tubePresta, 1);
  await store.updateBuyerIdentity(id, BUYER);
  window.localStorage.setItem(CART_ID_KEY, id);

  renderWithStore(<CheckoutPayment />, store);
  await screen.findByLabelText("Test card number");
  return { store, user: userEvent.setup() };
}

beforeEach(() => push.mockClear());

describe("CheckoutPayment (simulated gateway)", () => {
  it("documents the test cards and labels the payment as simulated", async () => {
    await renderPaymentStep();
    expect(screen.getByText("4242 4242 4242 4242")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pay CHF\s19\.80 \(simulated\)$/ })).toBeEnabled();
    expect(screen.getByText(/DEMO STORE – no real orders or payments/)).toBeInTheDocument();
  });

  it("refuses a number that is not a test card, before any payment", async () => {
    const { store, user } = await renderPaymentStep();
    await user.type(screen.getByLabelText("Test card number"), "5555 5555 5555 4444");
    await user.type(screen.getByLabelText("Expiry (MM/YY)"), "12/40");
    await user.type(screen.getByLabelText("Security code"), "123");
    await user.click(screen.getByRole("button", { name: /^Pay / }));

    expect(screen.getByText(/only accepts the test card numbers/)).toBeInTheDocument();
    expect(screen.getByLabelText("Test card number")).toHaveFocus();
    expect(await store.getOrders()).toEqual([]);
  });

  it("shows a decline and keeps the shopper on the payment step", async () => {
    const { store, user } = await renderPaymentStep();
    await user.click(screen.getByRole("button", { name: "Use the declined test card" }));
    await user.click(screen.getByRole("button", { name: /^Pay / }));

    expect(await screen.findByRole("alert", {}, GATEWAY_WAIT)).toHaveTextContent(/declined \(simulated\)/);
    expect(push).not.toHaveBeenCalled();
    expect(await store.getOrders()).toEqual([]);
  });

  it("places the order with the approved test card", async () => {
    const { store, user } = await renderPaymentStep();
    await user.click(screen.getByRole("button", { name: "Use the approved test card" }));
    await user.click(screen.getByRole("button", { name: /^Pay / }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1), GATEWAY_WAIT);
    const [order] = await store.getOrders();
    expect(push).toHaveBeenCalledWith(`/orders/${order.id}`);
    expect(order.paymentReference).toMatch(/^fakeauth_/);
    expect(window.localStorage.getItem(CART_ID_KEY)).toBeNull();
  });
});
