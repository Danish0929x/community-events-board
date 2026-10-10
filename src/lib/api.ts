import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { TOKEN_COOKIE, TOKEN_TTL_SECONDS, type Role } from "./constants";
import { verifyToken } from "./jwt";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type AuthUser = { id: string; email: string; role: Role };

// Wraps a route handler so thrown ApiErrors / zod errors become JSON error responses
// with the right status, and anything unexpected becomes a 500 without leaking details.
export function handler<Ctx>(fn: (req: NextRequest, ctx: Ctx) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof z.ZodError) {
        const first = err.issues[0];
        const field = first?.path.join(".");
        return NextResponse.json(
          { error: field ? `${field}: ${first.message}` : (first?.message ?? "Invalid input"), issues: err.issues },
          { status: 400 },
        );
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

export async function parseBody<T extends z.ZodType>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
  return schema.parse(body);
}

// Accepts the JWT from an "Authorization: Bearer" header (mobile clients) or from the
// httpOnly cookie that the web app gets on login. Both carry the same token.
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? { id: payload.sub, email: payload.email, role: payload.role } : null;
}

export async function requireUser(req: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(req);
  if (!user) throw new ApiError(401, "Please log in to continue");
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireUser(req);
  if (user.role !== "ADMIN") throw new ApiError(403, "Admins only");
  return user;
}

export function setTokenCookie(res: NextResponse, token: string) {
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true, // not readable from JS, so an XSS bug cannot steal it
    sameSite: "lax", // not sent on cross-site POST/PUT/DELETE, which blocks CSRF on our APIs
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export function clearTokenCookie(res: NextResponse) {
  res.cookies.set(TOKEN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}
