"use client";

import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiClientError, type Session } from "@/lib/client";

type AuthContextValue = {
  session: Session | null;
  status: "loading" | "authenticated" | "anonymous";
  setSession: (session: Session | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const setSession = useCallback((next: Session | null) => {
    setSessionState(next);
    setStatus(next ? "authenticated" : "anonymous");
  }, []);

  // The token lives in an httpOnly cookie, so ask the API who we are. The result is applied
  // as a transition so React finishes hydrating the header (which is inside <Suspense>)
  // before the login state changes, instead of hitting a hydration mismatch.
  useEffect(() => {
    api<Session>("/api/me")
      .then((s) => startTransition(() => setSession(s)))
      .catch((err) => {
        if (!(err instanceof ApiClientError) || err.status !== 401) console.error(err);
        startTransition(() => setSession(null));
      });
  }, [setSession]);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setSession(null);
  }, [setSession]);

  const value = useMemo(() => ({ session, status, setSession, logout }), [session, status, setSession, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
