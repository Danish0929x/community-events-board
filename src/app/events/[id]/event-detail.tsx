"use client";

import { ArrowLeft, CalendarDays, IndianRupee, MapPin } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useAuth } from "@/components/auth-provider";
import { CardDesigner } from "@/components/card-designer";
import { EventImage } from "@/components/event-image";
import { RemindButton } from "@/components/remind-button";
import { CategoryBadge, EmptyState, ErrorState } from "@/components/ui";
import type { EventDto } from "@/lib/client";
import { formatEventDate, formatPrice } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status } = useAuth();
  const { data, error, loading, reload } = useApi<{ event: EventDto }>(
    status === "loading" ? null : `/api/events/${id}`,
    status,
  );

  if (error === "Event not found") {
    return (
      <EmptyState
        emoji="🎟️"
        title="This event isn't available"
        message="It may have been removed by the organiser, or the link is wrong."
        action={<Link href="/events" className="btn-primary">Browse events</Link>}
      />
    );
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;
  // useApi keeps the previous response while refetching; never show another event's data.
  if (loading || !data || data.event.id !== id) return <EventDetailSkeleton />;

  const { event } = data;
  const isPast = new Date(event.startsAt) < new Date();

  return (
    <div className="space-y-10">
      <div>
        <Link href="/events" className="btn-ghost -ml-2 mb-4 px-2 py-1">
          <ArrowLeft className="size-4" /> All events
        </Link>
        <div className="card overflow-hidden">
          <EventImage src={event.imageUrl} alt={event.title} className="aspect-[16/10] w-full sm:aspect-[21/8]" />
          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_320px]">
            <div>
              <CategoryBadge category={event.category} />
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">{event.title}</h1>
              <p className="mt-4 leading-relaxed whitespace-pre-line text-muted">{event.description}</p>
            </div>
            <aside className="space-y-4 rounded-2xl bg-canvas p-5 lg:self-start">
              <InfoRow icon={CalendarDays} label="When" value={formatEventDate(event.startsAt)} />
              <InfoRow icon={MapPin} label="Where" value={event.city} />
              <InfoRow icon={IndianRupee} label="Price" value={formatPrice(event.price)} />
              {isPast ? (
                <p className="rounded-xl bg-line/60 px-4 py-3 text-center text-sm font-semibold text-muted">This event has ended</p>
              ) : (
                <div className="[&>button]:w-full">
                  <RemindButton key={`${event.id}-${event.reminded}`} eventId={event.id} initialReminded={event.reminded} size="lg" />
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Keyed so moving to another event starts a fresh designer instead of reusing state. */}
      <CardDesigner key={event.id} event={event} />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-brand-600 shadow-xs">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <div className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="card overflow-hidden" role="status" aria-label="Loading event">
      <div className="aspect-[16/10] animate-pulse bg-line/70 sm:aspect-[21/8]" />
      <div className="space-y-4 p-8">
        <div className="h-4 w-20 animate-pulse rounded bg-line" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-line" />
        <div className="h-4 w-full animate-pulse rounded bg-line" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-line" />
      </div>
    </div>
  );
}
