"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./client";

type Result<T> = { key: string; data: T | null; error: string | null };

/**
 * GET a JSON endpoint and track loading / error / data. Pass null to skip fetching.
 * `refetchKey` forces a reload when something outside the URL changes (e.g. who is logged in).
 */
export function useApi<T>(path: string | null, refetchKey?: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  // Each distinct request gets a key; we are "loading" until a result for that key arrives.
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
  const loading = key === null || result?.key !== key;
  return {
    data: loading ? null : (result?.data ?? null),
    error: loading ? null : (result?.error ?? null),
    loading,
    reload,
  };
}
