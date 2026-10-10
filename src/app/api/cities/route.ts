import { NextResponse } from "next/server";
import { handler } from "@/lib/api";
import { prisma } from "@/lib/db";

// Cities that currently have something to show, for the city filter dropdown.
export const GET = handler(async () => {
  const rows = await prisma.event.findMany({
    where: { isActive: true, startsAt: { gte: new Date() } },
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });
  return NextResponse.json({ cities: rows.map((r) => r.city) });
});
