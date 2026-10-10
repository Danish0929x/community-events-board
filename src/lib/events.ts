import type { Event, Prisma } from "@prisma/client";
import type { Category } from "./constants";
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
};

export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };

export function toEventDto(event: Event, remindedIds: Set<string> = new Set()): EventDto {
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
    reminded: remindedIds.has(event.id),
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
    // SQLite LIKE is case-insensitive for ASCII, so "night" matches "Jazz Night".
    ...(opts.q && { OR: [{ title: { contains: opts.q } }, { description: { contains: opts.q } }] }),
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

  const remindedIds = await remindedEventIds(
    opts.userId,
    rows.map((r) => r.id),
  );

  return {
    items: rows.map((r) => toEventDto(r, remindedIds)),
    page: opts.page,
    pageSize: opts.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.pageSize)),
  };
}

export async function remindedEventIds(userId: string | undefined, eventIds: string[]): Promise<Set<string>> {
  if (!userId || eventIds.length === 0) return new Set();
  const reminders = await prisma.reminder.findMany({
    where: { userId, eventId: { in: eventIds } },
    select: { eventId: true },
  });
  return new Set(reminders.map((r) => r.eventId));
}
