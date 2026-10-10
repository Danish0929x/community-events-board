"use client";

import Link from "next/link";
import { useState } from "react";
import { EventGrid } from "@/components/event-card";
import { Pagination } from "@/components/pagination";
import { CategoryBadge, EmptyState, ErrorState, EventGridSkeleton, PageHeader } from "@/components/ui";
import type { EventDto, Paginated } from "@/lib/client";
import type { Category } from "@/lib/constants";
import { useApi } from "@/lib/use-api";

export function FeedView() {
  const [page, setPage] = useState(1);
  const feed = useApi<Paginated<EventDto> & { favourites: Category[] }>(`/api/feed?page=${page}`);

  return (
    <>
      <PageHeader title="My Feed" subtitle="Upcoming events from the categories you follow.">
        <Link href="/favourites" className="btn-secondary">
          Edit categories
        </Link>
      </PageHeader>

      {feed.data && feed.data.favourites.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
          Following:
          {feed.data.favourites.map((c) => (
            <CategoryBadge key={c} category={c} />
          ))}
        </div>
      )}

      {feed.error ? (
        <ErrorState message={feed.error} onRetry={feed.reload} />
      ) : feed.loading || !feed.data ? (
        <EventGridSkeleton />
      ) : feed.data.favourites.length === 0 ? (
        <EmptyState
          emoji="✨"
          title="Your feed is waiting"
          message="Pick a few favourite categories and we'll show upcoming events for them here."
          action={<Link href="/favourites" className="btn-primary">Choose categories</Link>}
        />
      ) : feed.data.items.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="Nothing coming up just yet"
          message="There are no upcoming events in your categories right now. Try adding more categories or browse everything."
          action={<Link href="/events" className="btn-primary">Browse all events</Link>}
        />
      ) : (
        <>
          <EventGrid events={feed.data.items} />
          <Pagination page={feed.data.page} totalPages={feed.data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
