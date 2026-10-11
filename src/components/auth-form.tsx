"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, type Session } from "@/lib/client";
import { useAuth } from "./auth-provider";
import { Spinner } from "./ui";

type Mode = "login" | "signup" | "admin";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only allow local paths so ?next= can't send people to another site.
  const nextParam = searchParams.get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await api<Session & { token: string }>(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      if (mode === "admin" && session.user.role !== "ADMIN") {
        await logout();
        throw new Error("This account is not an admin");
      }
      setSession({ user: session.user, favourites: session.favourites });

      let dest = next ?? "/events";
      if (mode === "admin") dest = next ?? "/admin";
      // New users (or users who never chose) pick their favourite categories first.
      else if (session.favourites.length === 0) dest = `/favourites${next ? `?next=${encodeURIComponent(next)}` : ""}`;
      // Next.js keeps visited pages alive in the background, so clear the form for next time.
      setEmail("");
      setPassword("");
      router.replace(dest);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "signup" ? "Create your account" : mode === "admin" ? "Admin login" : "Welcome back";
  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "signup" ? "Save reminders and get a feed of events you love." : "Log in with your email and password."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Email</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Password</span>
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
            {mode === "signup" && <span className="mt-1 block text-xs text-muted">At least 8 characters</span>}
          </label>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting && <Spinner />}
            {mode === "signup" ? "Sign up" : "Log in"}
          </button>
        </form>
        {mode !== "admin" && (
          <p className="mt-6 text-center text-sm text-muted">
            {mode === "signup" ? "Already have an account? " : "New here? "}
            <Link
              href={`${mode === "signup" ? "/login" : "/signup"}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-semibold text-brand-700 underline-offset-2 hover:underline"
            >
              {mode === "signup" ? "Log in" : "Create an account"}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
