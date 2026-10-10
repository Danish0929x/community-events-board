import { NextResponse } from "next/server";
import { ApiError, handler, parseBody, setTokenCookie } from "@/lib/api";
import type { Role } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { verifyPassword } from "@/lib/password";
import { credentialsSchema } from "@/lib/schemas";

export const POST = handler(async (req) => {
  const { email, password } = await parseBody(req, credentialsSchema);

  const user = await prisma.user.findUnique({ where: { email }, include: { favourites: true } });
  // Same message for "no such user" and "wrong password" so emails cannot be probed.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const role = user.role as Role;
  const token = await signToken({ sub: user.id, email: user.email, role });
  const res = NextResponse.json({
    token,
    user: { id: user.id, email: user.email, role },
    favourites: user.favourites.map((f) => f.category),
  });
  setTokenCookie(res, token);
  return res;
});
