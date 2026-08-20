import "server-only";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";

function getAuthSecret(): string {
  const secret = process.env["AUTH_SECRET"];
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is missing.");
  }
  return secret;
}

function getAuthSecretKey(): Uint8Array {
  return new TextEncoder().encode(getAuthSecret());
}

export type QrTokenPayload = {
  sessionId: string;
  token: string;
  exp: number;
};

/**
 * Generates a 32-byte cryptographically secure random token string.
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("hex");
}

/**
 * Computes a SHA-256 HMAC hash of the session token combined with AUTH_SECRET.
 */
export function hashSessionToken(token: string): string {
  const secret = getAuthSecret();
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

/**
 * Performs a constant-time comparison between candidate and expected hash strings.
 */
export function verifySessionTokenHash(
  token: string,
  expectedHash: string,
): boolean {
  try {
    const candidateBuf = Buffer.from(token, "utf8");
    const expectedBuf = Buffer.from(expectedHash, "utf8");
    if (candidateBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(candidateBuf, expectedBuf);
  } catch {
    return false;
  }
}

/**
 * Generates a signed, tamper-proof JWE/JWT string representing the QR scan payload.
 */
export async function generateSignedQrPayload(
  sessionId: string,
  tokenIdentifier: string,
  expiresAt: Date,
): Promise<string> {
  const key = getAuthSecretKey();
  const expSeconds = Math.floor(expiresAt.getTime() / 1000);

  return new SignJWT({
    sessionId,
    token: tokenIdentifier,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expSeconds)
    .sign(key);
}

/**
 * Verifies the signature and expiration of a scanned QR payload string.
 */
export async function verifyQrPayload(
  payloadString: string,
): Promise<QrTokenPayload | null> {
  if (!payloadString || typeof payloadString !== "string") {
    return null;
  }
  try {
    const key = getAuthSecretKey();
    const { payload } = await jwtVerify(payloadString.trim(), key, {
      algorithms: ["HS256"],
    });

    if (!payload["sessionId"] || !payload["token"]) {
      return null;
    }

    return {
      sessionId: payload["sessionId"] as string,
      token: payload["token"] as string,
      exp: (payload.exp as number) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Generates a high-contrast base64 Data URL for rendering the QR code on screen.
 */
export async function generateQrDataUrl(qrPayloadString: string): Promise<string> {
  return QRCode.toDataURL(qrPayloadString, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    color: {
      dark: "#0f172a", // slate-900
      light: "#ffffff",
    },
  });
}
