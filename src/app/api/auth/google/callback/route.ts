import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleCodeForProfile,
  getAndClearOAuthStateCookie,
} from "@/lib/auth/google";
import { createSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const host = request.headers.get("host") || "localhost:3000";
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (error) {
    console.error("Google OAuth returned an error:", error);
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_oauth_params`);
  }

  // Verify anti-CSRF state
  const savedState = await getAndClearOAuthStateCookie();
  if (!savedState || savedState !== state) {
    console.error("OAuth state mismatch or missing state cookie.");
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`);
  }

  try {
    const profile = await exchangeGoogleCodeForProfile(code, redirectUri);
    const isConfiguredAdmin = isAdminEmail(profile.email);

    // Upsert User in database
    const user = await prisma.$transaction(async (tx) => {
      let existingUser = await tx.user.findUnique({
        where: { email: profile.email },
        include: { student: true, teacher: true },
      });

      if (!existingUser) {
        existingUser = await tx.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            image: profile.picture,
            role: isConfiguredAdmin ? UserRole.ADMIN : UserRole.STUDENT,
          },
          include: { student: true, teacher: true },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: existingUser.id,
            action: "USER_REGISTERED_OAUTH",
            entityType: "User",
            entityId: existingUser.id,
            newValue: {
              email: profile.email,
              role: existingUser.role,
              isAdminAllowlisted: isConfiguredAdmin,
            },
            reason: "First-time Google OAuth sign-in.",
          },
        });
      } else {
        // Update user profile info and role if newly allowlisted as admin
        const updateData: {
          name?: string;
          image?: string | null;
          role?: UserRole;
        } = {
          name: profile.name,
          image: profile.picture,
        };

        if (isConfiguredAdmin && existingUser.role !== UserRole.ADMIN) {
          updateData.role = UserRole.ADMIN;
          await tx.auditLog.create({
            data: {
              actorUserId: existingUser.id,
              action: "ADMIN_ROLE_PROVISIONED",
              entityType: "User",
              entityId: existingUser.id,
              oldValue: { role: existingUser.role },
              newValue: { role: UserRole.ADMIN },
              reason: "Admin email allowlist match.",
            },
          });
        }

        existingUser = await tx.user.update({
          where: { id: existingUser.id },
          data: updateData,
          include: { student: true, teacher: true },
        });
      }

      return existingUser;
    });

    const isLinked = Boolean(user.student || user.teacher || user.role === UserRole.ADMIN);

    // Set secure encrypted session
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      isLinked,
      studentId: user.student?.id,
      teacherId: user.teacher?.id,
      fullName: user.student?.fullName || user.teacher?.fullName || user.name || undefined,
    });

    // Destination routing
    if (user.role === UserRole.ADMIN) {
      return NextResponse.redirect(`${baseUrl}/admin/verification`);
    } else if (user.teacher) {
      return NextResponse.redirect(`${baseUrl}/teacher/dashboard`);
    } else if (user.student) {
      return NextResponse.redirect(`${baseUrl}/student/dashboard`);
    } else {
      return NextResponse.redirect(`${baseUrl}/onboarding`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("OAuth callback processing error:", message);
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
  }
}
