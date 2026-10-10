import { NextResponse } from "next/server";
import { ApiError, handler, parseBody, setTokenCookie } from "@/lib/api";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { hashPassword } from "@/lib/password";
import { credentialsSchema } from "@/lib/schemas";

export const POST = handler(async (req) => {
  const { email, password } = await parseBody(req, credentialsSchema);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  // Sign-up always creates a normal user; the only admin comes from the seed.
  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password), role: "USER" },
  });

  const token = await signToken({ sub: user.id, email: user.email, role: "USER" });
  const res = NextResponse.json(
    { token, user: { id: user.id, email: user.email, role: user.role }, favourites: [] },
    { status: 201 },
  );
  setTokenCookie(res, token);
  return res;
});
