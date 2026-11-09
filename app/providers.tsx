"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/lib/commerce/react/cart-provider";
import { StoreProvider } from "@/lib/commerce/react/store-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <CartProvider>{children}</CartProvider>
    </StoreProvider>
  );
}
