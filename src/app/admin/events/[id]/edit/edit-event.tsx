"use client";

import Link from "next/link";
import { use } from "react";
import { EmptyState, ErrorState, Spinner } from "@/components/ui";
import type { EventDto } from "@/lib/client";
import { useApi } from "@/lib/use-api";
import { EventForm } from "../../event-form";

export function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, reload } = useApi<{ event: EventDto }>(`/api/admin/events/${id}`);

  if (error === "Event not found") {
    return (
      <EmptyState
        emoji="🗂️"
        title="Event not found"
        message="It may have been a wrong link."
        action={
          <Link href="/admin" className="btn-primary">
            Back to events
          </Link>
        }
      />
    );
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;
  // useApi keeps the previous response while refetching; never show another event in the form.
  if (!data || data.event.id !== id) {
    return (
      <div className="card mx-auto grid max-w-2xl place-items-center p-16" role="status" aria-label="Loading event">
        <Spinner className="size-6" />
      </div>
    );
  }
  // Keyed so the form's default values reset if the event data changes.
  return <EventForm key={`${data.event.id}-${data.event.startsAt}-${data.event.title}`} event={data.event} />;
}
