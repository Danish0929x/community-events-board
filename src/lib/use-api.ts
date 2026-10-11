"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./client";

type Result<T> = { key: string; data: T | null; error: string | null };

/**
 * GET a JSON endpoint and track loading / error / data. Pass null to skip fetching.
 * `refetchKey` forces a reload when something outside the URL changes (e.g. who is logged in).
 *
 * While a new request is in flight the previous data is kept, so lists don't flash back to
 * skeletons on every filter change or revisit. `loading` is true only when there is nothing
 * to show yet; `refreshing` is true when old data is on screen and new data is on its way.
 */
export function useApi<T>(path: string | null, refetchKey?: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  // Each distinct request gets a key; it is pending until a result for that key arrives.
  const key = path === null ? null : `${path}|${refetchKey ?? ""}|${attempt}`;

  useEffect(() => {
    if (key === null || path === null) return;
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal })
      .then((data) => setResult({ key, data, error: null }))
      .catch((err: Error) => {
        if (err.name !== "AbortError") setResult({ key, data: null, error: err.message });
      });
    return () => controller.abort(); // ignore responses for filters the user has already changed
  }, [key, path]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const pending = key === null || result?.key !== key;
  const data = result?.data ?? null;
  return {
    data,
    error: pending ? null : (result?.error ?? null),
    loading: pending && data === null,
    refreshing: pending && data !== null,
    reload,
  };
}
