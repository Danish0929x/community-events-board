import { NextResponse } from "next/server";
import { handler, requireUser } from "@/lib/api";
import type { Category } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { listUpcomingEvents } from "@/lib/events";
import { paginationSchema } from "@/lib/schemas";

// GET /api/feed?page=1 — upcoming active events in the user's favourite categories.
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const { page, pageSize } = paginationSchema.parse(Object.fromEntries(req.nextUrl.searchParams));

  const favourites = (await prisma.favouriteCategory.findMany({ where: { userId: user.id } })).map(
    (f) => f.category as Category,
  );
  if (favourites.length === 0) {
    return NextResponse.json({ favourites, items: [], page: 1, pageSize, total: 0, totalPages: 1 });
  }

  const result = await listUpcomingEvents({ categories: favourites, page, pageSize, userId: user.id });
  return NextResponse.json({ favourites, ...result });
});
