import { NextResponse } from "next/server";
import { getAuthUser, handler } from "@/lib/api";
import { listUpcomingEvents } from "@/lib/events";
import { eventFiltersSchema } from "@/lib/schemas";

// GET /api/events?category=Music&city=Coimbatore&q=night&page=1&pageSize=6
export const GET = handler(async (req) => {
  const filters = eventFiltersSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const user = await getAuthUser(req); // optional: only used to mark "reminded"

  const result = await listUpcomingEvents({
    categories: filters.category ? [filters.category] : undefined,
    city: filters.city,
    q: filters.q,
    page: filters.page,
    pageSize: filters.pageSize,
    userId: user?.id,
  });
  return NextResponse.json(result);
});
