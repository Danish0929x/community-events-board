"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryBadge, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { api, type EventDto } from "@/lib/client";
import { formatEventDate, formatPrice } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export function AdminEvents() {
  const list = useApi<{ items: EventDto[] }>("/api/admin/events");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function setActive(event: EventDto, isActive: boolean) {
    setBusy(event.id);
    try {
      await api(`/api/admin/events/${event.id}`, { method: "PATCH", body: { isActive } });
      setOverrides((o) => ({ ...o, [event.id]: isActive }));
      toast.success(`"${event.title}" is now ${isActive ? "active" : "inactive"}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Manage events" subtitle="Inactive events are hidden from visitors. Events are never deleted.">
        <Link href="/admin/events/new" className="btn-primary">
          <Plus className="size-4" /> Add event
        </Link>
      </PageHeader>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <div className="card grid place-items-center p-12">
          <Spinner className="size-6" />
        </div>
      ) : list.data.items.length === 0 ? (
        <EmptyState emoji="🗂️" title="No events yet" message="Add your first event to get started." />
      ) : (
        <ul className="card divide-y divide-line">
          {list.data.items.map((e) => {
            const active = overrides[e.id] ?? e.isActive;
            const past = new Date(e.startsAt) < new Date();
            return (
              <li key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{e.title}</span>
                    <CategoryBadge category={e.category} />
                    {past && <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-muted">Past</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {formatEventDate(e.startsAt)} · {e.city} · {formatPrice(e.price)}
                  </p>
                </div>
                <button
                  onClick={() => setActive(e, !active)}
                  disabled={busy === e.id}
                  role="switch"
                  aria-checked={active}
                  className={`btn w-32 ${active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-line text-muted hover:bg-line/70"}`}
                >
                  {busy === e.id ? <Spinner /> : <span className={`size-2 rounded-full ${active ? "bg-emerald-600" : "bg-muted"}`} />}
                  {active ? "Active" : "Inactive"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
