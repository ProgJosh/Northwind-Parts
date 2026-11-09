"use client";

import { createContext, use, useState, type ReactNode } from "react";
import type { StoreAdapter } from "../adapter";
import { createStoreAdapter } from "../create-store";

const StoreContext = createContext<StoreAdapter | null>(null);

/** Makes one StoreAdapter available to the whole app. Tests can pass their own. */
export function StoreProvider({ adapter, children }: { adapter?: StoreAdapter; children: ReactNode }) {
  const [store] = useState(() => adapter ?? createStoreAdapter());
  return <StoreContext value={store}>{children}</StoreContext>;
}

export function useStore(): StoreAdapter {
  const store = use(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>.");
  return store;
}
