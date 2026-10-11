import { NextResponse, type NextRequest } from "next/server";
import { ApiError, assertObjectId, handler, parseBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { toEventDto } from "@/lib/events";
import { updateEventSchema } from "@/lib/schemas";

type Ctx = RouteContext<"/api/admin/events/[id]">;

// One event, including inactive and past ones (used by the edit form).
export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  assertObjectId(id);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new ApiError(404, "Event not found");
  return NextResponse.json({ event: toEventDto(event) });
});

// Edit any fields, or just switch Active/Inactive. Events are never deleted.
export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  assertObjectId(id);
  const data = await parseBody(req, updateEventSchema);

  const exists = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, "Event not found");

  const event = await prisma.event.update({ where: { id }, data });
  return NextResponse.json({ event: toEventDto(event) });
});
