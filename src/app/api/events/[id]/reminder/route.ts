import { NextResponse, type NextRequest } from "next/server";
import { ApiError, handler, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";

async function findRemindableEvent(id: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || !event.isActive) throw new ApiError(404, "Event not found");
  if (event.startsAt < new Date()) throw new ApiError(400, "This event has already started");
  return event;
}

// PUT and DELETE are idempotent, so a retried request (or a double tap) is harmless.
export const PUT = handler(async (req: NextRequest, ctx: RouteContext<"/api/events/[id]/reminder">) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  await findRemindableEvent(id);
  await prisma.reminder.upsert({
    where: { userId_eventId: { userId: user.id, eventId: id } },
    update: {},
    create: { userId: user.id, eventId: id },
  });
  return NextResponse.json({ reminded: true });
});

export const DELETE = handler(async (req: NextRequest, ctx: RouteContext<"/api/events/[id]/reminder">) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  await prisma.reminder.deleteMany({ where: { userId: user.id, eventId: id } });
  return NextResponse.json({ reminded: false });
});
