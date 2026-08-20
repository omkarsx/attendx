import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  await deleteSession();

  const host = request.headers.get("host") || "localhost:3000";
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  return NextResponse.redirect(`${protocol}://${host}/login`);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
