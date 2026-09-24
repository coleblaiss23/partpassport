import { NextResponse } from "next/server";

// Baseline security headers on every response.
export function middleware() {
 const res = NextResponse.next();
 res.headers.set("X-Content-Type-Options", "nosniff");
 res.headers.set("X-Frame-Options", "DENY");
 res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
 res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
 res.headers.set("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
 return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
