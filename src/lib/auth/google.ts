import "server-only";
import { cookies } from "next/headers";

export const OAUTH_STATE_COOKIE_NAME = "attendx_oauth_state";

export type GoogleUserProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
};

export function getGoogleClientId(): string {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is missing.");
  }
  return clientId.trim();
}

function getGoogleClientSecret(): string {
  const secret = process.env["GOOGLE_CLIENT_SECRET"];
  if (!secret) {
    throw new Error("GOOGLE_CLIENT_SECRET environment variable is missing.");
  }
  return secret.trim();
}

export function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("hex");
}

export async function setOAuthStateCookie(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
}

export async function getAndClearOAuthStateCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const state = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value ?? null;
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
  return state;
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const clientId = getGoogleClientId();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCodeForProfile(
  code: string,
  redirectUri: string,
): Promise<GoogleUserProfile> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(
      `Google token exchange failed: ${tokenResponse.status} ${errorBody}`,
    );
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    id_token?: string;
  };

  if (!tokenData.access_token) {
    throw new Error("Google OAuth did not return an access token.");
  }

  const userinfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    },
  );

  if (!userinfoResponse.ok) {
    throw new Error("Failed to fetch Google user profile.");
  }

  const profile = (await userinfoResponse.json()) as {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
  };

  if (!profile.email) {
    throw new Error("Google account does not have a verified email address.");
  }

  return {
    id: profile.sub,
    email: profile.email.toLowerCase().trim(),
    name: profile.name || profile.email,
    picture: profile.picture,
    email_verified: Boolean(profile.email_verified),
  };
}
