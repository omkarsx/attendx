import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@/generated/prisma/enums";

export const SESSION_COOKIE_NAME = "attendx_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getAuthSecretKey(): Uint8Array {
  const secret = process.env["AUTH_SECRET"];
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is missing.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  isLinked: boolean;
  studentId?: string;
  teacherId?: string;
  fullName?: string;
};

export async function encryptSession(payload: SessionPayload): Promise<string> {
  const key = getAuthSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const key = getAuthSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return {
      userId: payload["userId"] as string,
      email: payload["email"] as string,
      role: payload["role"] as UserRole,
      isLinked: Boolean(payload["isLinked"]),
      studentId: payload["studentId"] as string | undefined,
      teacherId: payload["teacherId"] as string | undefined,
      fullName: payload["fullName"] as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encryptSession(payload);
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decryptSession(token);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
