"use client";

import { LogOut, ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

const NAV = [
  { href: "/events", label: "Events" },
  { href: "/feed", label: "My Feed" },
];

export function SiteHeader() {
  const { session, status, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/events");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/events" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Ticket className="size-5" aria-hidden />
          </span>
          <span className="text-lg">Events Board</span>
        </Link>

        <nav className="order-last flex w-full gap-1 sm:order-none sm:w-auto" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition sm:flex-none ${
                  active ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-black/5 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {session?.user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition sm:flex-none ${
                pathname.startsWith("/admin") ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-black/5 hover:text-ink"
              }`}
            >
              <ShieldCheck className="size-4" aria-hidden /> Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {status === "loading" && <div className="h-9 w-32 animate-pulse rounded-xl bg-line" aria-hidden />}
          {status === "anonymous" && (
            <>
              <Link href="/login" className="btn-ghost px-3 py-2">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary px-3.5 py-2">
                Sign up
              </Link>
            </>
          )}
          {status === "authenticated" && session && (
            <>
              <span className="hidden max-w-48 truncate text-sm text-muted md:inline" title={session.user.email}>
                {session.user.email}
              </span>
              <button onClick={handleLogout} className="btn-secondary px-3 py-2" aria-label="Log out">
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Shown while the header waits for the URL (needed for the active tab) during prerender.
export function SiteHeaderFallback() {
  return (
    <header className="sticky top-0 z-40 h-[61px] border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 font-extrabold tracking-tight sm:px-6">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
          <Ticket className="size-5" aria-hidden />
        </span>
        <span className="text-lg">Events Board</span>
      </div>
    </header>
  );
}
