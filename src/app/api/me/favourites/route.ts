import { NextResponse } from "next/server";
import { handler, parseBody, requireUser } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { favouritesSchema } from "@/lib/schemas";

export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const rows = await prisma.favouriteCategory.findMany({ where: { userId: user.id } });
  return NextResponse.json({ categories: rows.map((r) => r.category) });
});

// Replaces the whole set, which keeps the client simple: send what is ticked.
export const PUT = handler(async (req) => {
  const user = await requireUser(req);
  const { categories } = await parseBody(req, favouritesSchema);
  const unique = CATEGORIES.filter((c) => categories.includes(c));

  await prisma.$transaction([
    prisma.favouriteCategory.deleteMany({ where: { userId: user.id } }),
    prisma.favouriteCategory.createMany({ data: unique.map((category) => ({ userId: user.id, category })) }),
  ]);
  return NextResponse.json({ categories: unique });
});
