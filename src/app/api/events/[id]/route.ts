import { NextResponse } from "next/server";
import { ApiError, assertObjectId, getAuthUser, handler } from "@/lib/api";
import { prisma } from "@/lib/db";
import { remindedEventIds, toEventDto } from "@/lib/events";

export const GET = handler(async (req, ctx: RouteContext<"/api/events/[id]">) => {
  const { id } = await ctx.params;
  assertObjectId(id);
  const event = await prisma.event.findUnique({ where: { id } });
  // Inactive events are hidden from visitors entirely.
  if (!event || !event.isActive) throw new ApiError(404, "Event not found");

  const user = await getAuthUser(req);
  return NextResponse.json({ event: toEventDto(event, await remindedEventIds(user?.id, [id])) });
});
