import { NextResponse } from "next/server";
import { handler, parseBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { toEventDto } from "@/lib/events";
import { createEventSchema } from "@/lib/schemas";

// Admin sees every event, including inactive and past ones.
export const GET = handler(async (req) => {
  await requireAdmin(req);
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" } });
  return NextResponse.json({ items: events.map((e) => toEventDto(e)) });
});

export const POST = handler(async (req) => {
  await requireAdmin(req);
  const data = await parseBody(req, createEventSchema);
  const event = await prisma.event.create({ data });
  return NextResponse.json({ event: toEventDto(event) }, { status: 201 });
});
