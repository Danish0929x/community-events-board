import { NextResponse } from "next/server";
import { ApiError, handler, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = handler(async (req) => {
  const auth = await requireUser(req);
  const user = await prisma.user.findUnique({ where: { id: auth.id }, include: { favourites: true } });
  if (!user) throw new ApiError(401, "Please log in to continue");
  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
    favourites: user.favourites.map((f) => f.category),
  });
});
