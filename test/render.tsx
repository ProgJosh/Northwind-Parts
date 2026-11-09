import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import type { StoreAdapter } from "@/lib/commerce/adapter";
import { CartProvider } from "@/lib/commerce/react/cart-provider";
import { StoreProvider } from "@/lib/commerce/react/store-provider";

/** Renders UI inside the app's store and cart providers, backed by the given adapter. */
export function renderWithStore(ui: ReactNode, store: StoreAdapter) {
  return render(
    <StoreProvider adapter={store}>
      <CartProvider>{ui}</CartProvider>
    </StoreProvider>,
  );
}
