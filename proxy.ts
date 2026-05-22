import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "dockethq_session";

function privateResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Robots-Tag", "noindex, noarchive, noimageindex");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
  );

  return response;
}

export function proxy(request: NextRequest) {
  const hasSessionMarker = request.cookies.get(AUTH_COOKIE)?.value === "active";

  if (hasSessionMarker) {
    return privateResponse(NextResponse.next());
  }

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set(
    "redirectTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  return privateResponse(NextResponse.redirect(redirectUrl));
}

export const config = {
  matcher: [
    "/billing/:path*",
    "/cases/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
  ],
};
