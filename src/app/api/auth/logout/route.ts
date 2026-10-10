import { NextResponse } from "next/server";
import { clearTokenCookie, handler } from "@/lib/api";

// JWTs are stateless, so logout just drops the web cookie. Mobile clients discard their token.
export const POST = handler(async () => {
  const res = NextResponse.json({ ok: true });
  clearTokenCookie(res);
  return res;
});
