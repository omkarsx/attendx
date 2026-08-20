import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "attendx_session";

function getAuthSecretKey(): Uint8Array | null {
  const secret = process.env["AUTH_SECRET"];
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

type MiddlewareSession = {
  userId: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  isLinked: boolean;
};

async function verifyToken(token: string): Promise<MiddlewareSession | null> {
  const key = getAuthSecretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return {
      userId: payload["userId"] as string,
      email: payload["email"] as string,
      role: payload["role"] as "ADMIN" | "TEACHER" | "STUDENT",
      isLinked: Boolean(payload["isLinked"]),
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedAdmin = pathname.startsWith("/admin");
  const isProtectedTeacher = pathname.startsWith("/teacher");
  const isProtectedStudent = pathname.startsWith("/student");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isLoginPage = pathname === "/login";

  if (
    !isProtectedAdmin &&
    !isProtectedTeacher &&
    !isProtectedStudent &&
    !isOnboarding &&
    !isLoginPage
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  // 1. Unauthenticated users attempting to access protected pages
  if (!session) {
    if (
      isProtectedAdmin ||
      isProtectedTeacher ||
      isProtectedStudent ||
      isOnboarding
    ) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Authenticated users attempting to visit the login page
  if (isLoginPage) {
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/verification", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Admin routes: strictly role === ADMIN
  if (isProtectedAdmin) {
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/login?error=forbidden", request.url),
      );
    }
    return NextResponse.next();
  }

  // 4. Teacher routes: requires TEACHER or ADMIN role
  if (isProtectedTeacher) {
    if (session.role !== "TEACHER" && session.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/login?error=forbidden", request.url),
      );
    }
    return NextResponse.next();
  }

  // 5. Student routes: requires STUDENT or ADMIN role
  if (isProtectedStudent) {
    if (session.role !== "STUDENT" && session.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/login?error=forbidden", request.url),
      );
    }
    return NextResponse.next();
  }

  // 6. Onboarding route: pass through to Server Component (live DB check)
  if (isOnboarding) {
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/verification", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/onboarding/:path*",
    "/login",
  ],
};
