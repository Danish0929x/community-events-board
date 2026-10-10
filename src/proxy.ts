import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/constants";
import { verifyToken } from "@/lib/jwt";

// Server-side gate for pages. The APIs do their own checks (requireUser / requireAdmin),
// so even a request that skips this page guard cannot read or change protected data.
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (user?.role !== "ADMIN") return redirectTo(req, "/admin/login", pathname + search);
    return NextResponse.next();
  }

  // Visitor pages that only make sense when logged in.
  if (!user) return redirectTo(req, "/login", pathname + search);
  return NextResponse.next();
}

function redirectTo(req: NextRequest, path: string, next: string) {
  const url = new URL(path, req.url);
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/feed", "/favourites"],
};
