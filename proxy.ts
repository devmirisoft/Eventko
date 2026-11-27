import { NextResponse, type NextRequest } from "next/server";

// Next 16 renamed middleware -> proxy. Real checks happen in lib/auth.ts; this is just the bounce.
export function proxy(req: NextRequest) {
  const open = ["/", "/members/new"].includes(req.nextUrl.pathname);
  if (!open && !req.cookies.has("mid")) return NextResponse.redirect(new URL("/?login", req.url));
}

// skip _next and any path with a dot (public files like /hero.jpg, favicon.ico): logged-out pages need them
export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
