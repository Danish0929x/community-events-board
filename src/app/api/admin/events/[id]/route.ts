import { NextResponse, type NextRequest } from "next/server";
import { ApiError, assertObjectId, handler, parseBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { toEventDto } from "@/lib/events";
import { updateEventStatusSchema } from "@/lib/schemas";

// Events are never deleted: admins only switch them between Active and Inactive.
export const PATCH = handler(async (req: NextRequest, ctx: RouteContext<"/api/admin/events/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  assertObjectId(id);
  const { isActive } = await parseBody(req, updateEventStatusSchema);

  const exists = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, "Event not found");

  const event = await prisma.event.update({ where: { id }, data: { isActive } });
  return NextResponse.json({ event: toEventDto(event) });
});
