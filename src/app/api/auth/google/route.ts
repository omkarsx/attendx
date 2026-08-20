import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  generateOAuthState,
  setOAuthStateCookie,
} from "@/lib/auth/google";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const state = generateOAuthState();
  await setOAuthStateCookie(state);

  const authUrl = buildGoogleAuthUrl(redirectUri, state);
  return NextResponse.redirect(authUrl);
}
