"use client";

import { MapPin, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { EventGrid } from "@/components/event-card";
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState, EventGridSkeleton } from "@/components/ui";
import type { EventDto, Paginated } from "@/lib/client";
import { CATEGORIES } from "@/lib/constants";
import { useApi } from "@/lib/use-api";

// Filters live in the URL (?category=Music&city=Coimbatore&q=night&page=2), so they
// survive a refresh, work with the back button and can be shared as a link.
export function EventsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useAuth();

  const category = searchParams.get("category") ?? "";
  const city = searchParams.get("city") ?? "";
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const updateFilters = useCallback(
    (changes: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      if (!("page" in changes)) params.delete("page"); // any filter change goes back to page 1
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // The text box is local state so typing feels instant; the URL is updated after a pause.
  const [searchText, setSearchText] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    // The URL changed from outside the box (back button, "Clear filters"): follow it.
    setSyncedQ(q);
    setSearchText(q);
  }

  // Debounce typing so we query once the user pauses, not on every keystroke.
  useEffect(() => {
    if (searchText.trim() === q) return;
    const t = setTimeout(() => updateFilters({ q: searchText.trim() }), 350);
    return () => clearTimeout(t);
  }, [searchText, q, updateFilters]);

  const apiParams = new URLSearchParams();
  if (category) apiParams.set("category", category);
  if (city) apiParams.set("city", city);
  if (q) apiParams.set("q", q);
  if (page > 1) apiParams.set("page", String(page));

  // Wait until we know who is logged in, so "Reminder set" states are right first time.
  const events = useApi<Paginated<EventDto>>(status === "loading" ? null : `/api/events?${apiParams}`, status);
  const cities = useApi<{ cities: string[] }>("/api/cities");

  const hasFilters = Boolean(category || city || q);
  const clearFilters = () => {
    setSearchText("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <div>
      <div className="card mb-6 space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search events</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search events, e.g. “night”"
              className="field pl-10"
            />
          </label>
          <label className="relative sm:w-56">
            <span className="sr-only">City</span>
            <MapPin
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <select
              value={city}
              onChange={(e) => updateFilters({ city: e.target.value })}
              className="field appearance-none pl-10"
            >
              <option value="">All cities</option>
              {cities.data?.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5" role="group" aria-label="Category">
          {["", ...CATEGORIES].map((c) => (
            <button
              key={c || "all"}
              onClick={() => updateFilters({ category: c })}
              aria-pressed={category === c}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                category === c
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-surface text-muted hover:border-ink/30 hover:text-ink"
              }`}
            >
              {c || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex min-h-8 items-center justify-between gap-3 text-sm text-muted">
        <p aria-live="polite">
          {events.data && `${events.data.total} ${events.data.total === 1 ? "event" : "events"} found`}
        </p>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost px-2 py-1">
            <X className="size-4" /> Clear filters
          </button>
        )}
      </div>

      <div
        aria-busy={events.refreshing}
        className={`transition-opacity duration-200 ${events.refreshing ? "opacity-60" : ""}`}
      >
        {events.error ? (
          <ErrorState message={events.error} onRetry={events.reload} />
        ) : !events.data ? (
          <EventGridSkeleton />
        ) : events.data.items.length === 0 ? (
          <EmptyState
            emoji={hasFilters ? "🔍" : "🗓️"}
            title={hasFilters ? "No events match those filters" : "No upcoming events yet"}
            message={
              hasFilters
                ? "Try another category or city, or a shorter search word."
                : "Check back soon, new events are added every week."
            }
            action={
              hasFilters && (
                <button className="btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <>
            <EventGrid events={events.data.items} />
            <Pagination
              page={events.data.page}
              totalPages={events.data.totalPages}
              onChange={(p) => {
                updateFilters({ page: p > 1 ? String(p) : "" });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
