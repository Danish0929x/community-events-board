import type { Event, Prisma } from "@prisma/client";
import { CARD_THEME_IDS, STICKER_IDS, type CardThemeId, type Category, type StickerId } from "./constants";
import { prisma } from "./db";

export type EventDto = {
  id: string;
  title: string;
  category: Category;
  city: string;
  startsAt: string;
  price: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
  reminded: boolean;
  /** The logged-in user's saved card design for this event, or null if they haven't made one. */
  cardDesign: CardDesignDto | null;
};

export type CardDesignDto = { theme: CardThemeId; stickers: StickerId[] };

export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };

type UserExtras = { remindedIds?: Set<string>; designs?: Map<string, CardDesignDto> };

export function toEventDto(event: Event, extras: UserExtras = {}): EventDto {
  return {
    id: event.id,
    title: event.title,
    category: event.category as Category,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    price: event.price,
    description: event.description,
    imageUrl: event.imageUrl,
    isActive: event.isActive,
    reminded: extras.remindedIds?.has(event.id) ?? false,
    cardDesign: extras.designs?.get(event.id) ?? null,
  };
}

type ListOptions = {
  categories?: Category[]; // a single category filter, or the user's favourites for My Feed
  city?: string;
  q?: string;
  page: number;
  pageSize: number;
  userId?: string; // when present, each event gets `reminded` for this user
};

// One query builder for both the public Events page and My Feed, so "upcoming and active"
// means exactly the same thing everywhere. Every filter is optional and they AND together.
export async function listUpcomingEvents(opts: ListOptions): Promise<Paginated<EventDto>> {
  const where: Prisma.EventWhereInput = {
    isActive: true,
    startsAt: { gte: new Date() },
    ...(opts.categories && { category: { in: opts.categories } }),
    ...(opts.city && { city: opts.city }),
    // Case-insensitive "contains" (a regex in MongoDB), so "night" matches "Jazz Night".
    ...(opts.q && {
      OR: [
        { title: { contains: opts.q, mode: "insensitive" } },
        { description: { contains: opts.q, mode: "insensitive" } },
      ],
    }),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }], // id breaks ties so pages never overlap
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
  ]);

  const extras = await userExtras(
    opts.userId,
    rows.map((r) => r.id),
  );

  return {
    items: rows.map((r) => toEventDto(r, extras)),
    page: opts.page,
    pageSize: opts.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.pageSize)),
  };
}

// The per-user bits shown on event cards: which events they set reminders for, and the
// card designs they saved. Two small queries for the whole page, not one per event.
export async function userExtras(userId: string | undefined, eventIds: string[]): Promise<UserExtras> {
  if (!userId || eventIds.length === 0) return {};
  const [reminders, designs] = await Promise.all([
    prisma.reminder.findMany({ where: { userId, eventId: { in: eventIds } }, select: { eventId: true } }),
    prisma.cardDesign.findMany({ where: { userId, eventId: { in: eventIds } } }),
  ]);
  return {
    remindedIds: new Set(reminders.map((r) => r.eventId)),
    designs: new Map(
      designs
        .filter((d) => (CARD_THEME_IDS as string[]).includes(d.theme))
        .map((d) => [
          d.eventId,
          {
            theme: d.theme as CardThemeId,
            stickers: d.stickers.filter((s): s is StickerId => (STICKER_IDS as string[]).includes(s)),
          },
        ]),
    ),
  };
}
