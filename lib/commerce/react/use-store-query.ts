"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { errorMessage, type StoreAdapter } from "../adapter";
import { useStore } from "./store-provider";

export type QueryState<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

/**
 * Loads data through the StoreAdapter in the browser.
 * `key` must change whenever the inputs of `load` change; while a new key
 * loads, the status is "loading". The data reloads whenever the page is shown
 * again, so stock levels stay fresh after back/forward navigation.
 */
export function useStoreQuery<T>(
  key: string,
  load: (store: StoreAdapter) => Promise<T>,
): QueryState<T> & { reload: () => void } {
  const store = useStore();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: QueryState<T> } | null>(null);
  const requestKey = `${key}#${attempt}`;
  const runLoad = useEffectEvent(() => load(store));

  useEffect(() => {
    let active = true;
    runLoad().then(
      (data) => {
        if (active) setResult({ key: requestKey, state: { status: "success", data } });
      },
      (error: unknown) => {
        if (active) setResult({ key: requestKey, state: { status: "error", error: errorMessage(error) } });
      },
    );
    return () => {
      active = false;
    };
  }, [requestKey]);

  const state: QueryState<T> = result?.key === requestKey ? result.state : { status: "loading" };
  return { ...state, reload: () => setAttempt((count) => count + 1) };
}
