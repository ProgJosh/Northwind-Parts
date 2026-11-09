/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createMockStore, VARIANTS } from "@/test/fixtures";
import { StoreError } from "../adapter";
import type { MockStoreAdapter } from "../mock/mock-adapter";
import { CART_ID_KEY, CartProvider, useCart, type CartResult } from "./cart-provider";
import { StoreProvider } from "./store-provider";

async function renderCart(store: MockStoreAdapter) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StoreProvider adapter={store}>
      <CartProvider>{children}</CartProvider>
    </StoreProvider>
  );
  const hook = renderHook(() => useCart(), { wrapper });
  await waitFor(() => expect(hook.result.current.cart).not.toBeUndefined());
  return hook;
}

describe("CartProvider", () => {
  it("creates a cart on the first add and remembers its id", async () => {
    const { result } = await renderCart(createMockStore());
    expect(result.current.cart).toBeNull();

    let outcome: CartResult | undefined;
    await act(async () => {
      outcome = await result.current.addItem(VARIANTS.tubePresta, 2);
    });

    expect(outcome).toMatchObject({ ok: true });
    expect(result.current.cart?.totalQuantity).toBe(2);
    expect(result.current.quantityInCart(VARIANTS.tubePresta)).toBe(2);
    expect(window.localStorage.getItem(CART_ID_KEY)).toBe(result.current.cart?.id);
  });

  it("reports stock errors and keeps the cart as it was", async () => {
    const { result } = await renderCart(createMockStore());
    await act(async () => {
      await result.current.addItem(VARIANTS.ridge29, 3);
    });

    let outcome: CartResult | undefined;
    await act(async () => {
      outcome = await result.current.addItem(VARIANTS.ridge29, 2);
    });

    expect(outcome).toEqual({ ok: false, error: "Only 4 of Ridge Trail Tyre (29 × 2.4) are available." });
    expect(result.current.quantityInCart(VARIANTS.ridge29)).toBe(3);
  });

  it("keeps the saved cart when the store is unreachable", async () => {
    const store = createMockStore();
    const { id } = await store.addToCart((await store.createCart()).id, VARIANTS.tubePresta, 1);
    window.localStorage.setItem(CART_ID_KEY, id);
    const { result } = await renderCart(store);

    const offline = new StoreError("BACKEND", "Could not reach the store. Check your connection and try again.");
    vi.spyOn(store, "removeCartLine").mockRejectedValue(offline);
    vi.spyOn(store, "getCart").mockRejectedValue(offline);

    let outcome: CartResult | undefined;
    await act(async () => {
      outcome = await result.current.removeLine(result.current.cart?.lines[0].id ?? "");
    });

    expect(outcome).toEqual({ ok: false, error: offline.message });
    expect(window.localStorage.getItem(CART_ID_KEY)).toBe(id);
    expect(result.current.cart?.totalQuantity).toBe(1);
  });
});
