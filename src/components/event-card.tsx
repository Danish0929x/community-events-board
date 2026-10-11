import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { formatDateBadge, formatEventDate, formatPrice } from "@/lib/format";
import type { EventDto } from "@/lib/client";
import { CARD_THEMES, STICKERS } from "@/lib/constants";
import { EventImage } from "./event-image";
import { RemindButton } from "./remind-button";
import { CategoryBadge } from "./ui";

export function EventCard({ event }: { event: EventDto }) {
  const badge = formatDateBadge(event.startsAt);
  // If the user designed a card for this event, the card wears that theme and stickers.
  const theme =
    event.cardDesign?.theme !== "none" ? CARD_THEMES.find((t) => t.id === event.cardDesign?.theme) : undefined;
  const stickers = (event.cardDesign?.stickers ?? []).map((id) => STICKERS.find((s) => s.id === id)!).filter(Boolean);
  const secondary = theme ? "opacity-85" : "text-muted";
  return (
    <article className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden">
        <EventImage src={event.imageUrl} alt="" className="size-full transition duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3 rounded-xl bg-white/95 px-2.5 py-1 text-center shadow-sm backdrop-blur">
          <div className="text-lg leading-none font-extrabold">{badge.day}</div>
          <div className="text-[11px] font-semibold tracking-wide text-brand-600 uppercase">{badge.month}</div>
        </div>
        <CategoryBadge category={event.category} className="absolute top-3 right-3 shadow-sm" />
        {stickers.length > 0 && (
          <div
            className="absolute right-3 bottom-3 flex gap-1 rounded-full bg-white/90 px-2.5 py-1 text-2xl shadow-md backdrop-blur"
            aria-label="Your stickers"
          >
            {stickers.map((s, i) => (
              <span key={s.id} style={{ transform: `rotate(${[10, -8, 6][i]}deg)` }} aria-hidden>
                {s.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col p-4 ${theme ? `${theme.background} ${theme.text}` : ""}`}>
        <h3 className="line-clamp-2 text-lg leading-snug font-bold">
          {/* The ::after covers the whole card so it is clickable, while the button stays on top. */}
          <Link href={`/events/${event.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {event.title}
          </Link>
        </h3>
        <div className={`mt-2 space-y-1 text-sm ${secondary}`}>
          <p className="flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0" aria-hidden /> {formatEventDate(event.startsAt)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden /> {event.city}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-lg font-extrabold">{formatPrice(event.price)}</span>
          {/* Keyed on the server value so a refetch (e.g. after logout) resets the button. */}
          <RemindButton key={`${event.id}-${event.reminded}`} eventId={event.id} initialReminded={event.reminded} />
        </div>
      </div>
    </article>
  );
}

export function EventGrid({ events }: { events: EventDto[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}
