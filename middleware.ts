import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/catalog", "/product", "/cart", "/profile", "/admin"];
const ADMIN_PATHS = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("__session")?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("authRequired", "1");
    return NextResponse.redirect(url);
  }

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath) {
    const role = request.cookies.get("__role")?.value;
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/catalog/:path*", "/product/:path*", "/cart/:path*", "/profile/:path*", "/admin/:path*"],
};
