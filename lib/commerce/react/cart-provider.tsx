"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { errorMessage } from "../adapter";
import type { Cart, CartBuyerIdentity } from "../types";
import { useStore } from "./store-provider";

/** The cart id survives a refresh; the cart itself lives in the store backend. */
export const CART_ID_KEY = "northwind-parts:cart-id";

export type CartResult = { ok: true; cart: Cart } | { ok: false; error: string };

interface CartContextValue {
  /** `undefined` while the saved cart loads, `null` when there is no cart yet. */
  cart: Cart | null | undefined;
  quantityInCart(variantId: string): number;
  addItem(variantId: string, quantity: number): Promise<CartResult>;
  updateLine(lineId: string, quantity: number): Promise<CartResult>;
  removeLine(lineId: string): Promise<CartResult>;
  saveBuyerIdentity(identity: CartBuyerIdentity): Promise<CartResult>;
  selectDeliveryOption(handle: string): Promise<CartResult>;
  /** Forgets the cart, e.g. after its order was placed. */
  clear(): void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readCartId(): string | null {
  try {
    return window.localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

function writeCartId(cartId: string | null): void {
  try {
    if (cartId) window.localStorage.setItem(CART_ID_KEY, cartId);
    else window.localStorage.removeItem(CART_ID_KEY);
  } catch {
    // Storage is blocked: the cart then lasts until the page reloads.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const [cart, setCart] = useState<Cart | null | undefined>(undefined);

  // Load the saved cart, and reload it when another tab changes the store data.
  useEffect(() => {
    let active = true;
    const load = () => {
      const cartId = readCartId();
      const request = cartId ? store.getCart(cartId) : Promise.resolve(null);
      request.then(
        (loaded) => {
          if (!active) return;
          if (cartId && !loaded) writeCartId(null);
          setCart(loaded);
        },
        () => {
          if (active) setCart(null);
        },
      );
    };
    load();
    window.addEventListener("storage", load);
    return () => {
      active = false;
      window.removeEventListener("storage", load);
    };
  }, [store]);

  const apply = useCallback(
    async (change: (cartId: string) => Promise<Cart>, createIfMissing = false): Promise<CartResult> => {
      let cartId = readCartId();
      try {
        if (createIfMissing && !(cartId && (await store.getCart(cartId)))) {
          cartId = (await store.createCart()).id;
          writeCartId(cartId);
        }
        if (!cartId) return { ok: false, error: "Your cart is empty." };
        const next = await change(cartId);
        setCart(next);
        return { ok: true, cart: next };
      } catch (error) {
        // Re-read the cart so the page shows what the store really holds.
        if (cartId) {
          try {
            const current = await store.getCart(cartId);
            if (!current) writeCartId(null);
            setCart(current);
          } catch {
            // The store is unreachable: keep the saved cart id and try again on the next action.
          }
        }
        return { ok: false, error: errorMessage(error) };
      }
    },
    [store],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      quantityInCart: (variantId) =>
        cart?.lines.find((line) => line.merchandise.id === variantId)?.quantity ?? 0,
      addItem: (variantId, quantity) => apply((id) => store.addToCart(id, variantId, quantity), true),
      updateLine: (lineId, quantity) => apply((id) => store.updateCartLine(id, lineId, quantity)),
      removeLine: (lineId) => apply((id) => store.removeCartLine(id, lineId)),
      saveBuyerIdentity: (identity) => apply((id) => store.updateBuyerIdentity(id, identity)),
      selectDeliveryOption: (handle) => apply((id) => store.selectDeliveryOption(id, handle)),
      clear: () => {
        writeCartId(null);
        setCart(null);
      },
    }),
    [cart, apply, store],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const value = use(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>.");
  return value;
}
