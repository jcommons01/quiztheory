import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Only guard specific routes; others pass through
  const needsAuth = pathname.startsWith("/dashboard/") || pathname === "/dashboard";
  const needsTeacher = pathname.startsWith("/teacher/") || pathname === "/teacher";
  const needsInstitution = pathname.startsWith("/institution/") || pathname === "/institution";

  if (!needsAuth && !needsTeacher && !needsInstitution) {
    return NextResponse.next();
  }

  const session = req.cookies.get("session")?.value || null; // expected to be the uid or a session mapping to uid
  const role = req.cookies.get("role")?.value || null; // optional: role cookie set at login ("teacher" | "institution" | "individual")

  // If any protected route and no session, redirect to /auth
  if (!session) {
    const redirectUrl = new URL("/auth", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Role checks for teacher/institution namespaces
  if (needsTeacher || needsInstitution) {
    if (!role) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
    if (needsTeacher && role !== "teacher") {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
    if (needsInstitution && role !== "institution") {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  }

  // For /dashboard, just ensure authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/teacher/:path*",
    "/institution/:path*",
  ],
};
