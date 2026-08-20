import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/generated/prisma/enums";

export function getAdminEmails(): string[] {
  const raw = process.env["ADMIN_EMAILS"] ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const admins = getAdminEmails();
  return admins.includes(email.toLowerCase().trim());
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  isLinked: boolean;
  student: {
    id: string;
    prn: string;
    rollNumber: string;
    fullName: string;
    division: { id: string; name: string };
    batch: { id: string; name: string };
  } | null;
  teacher: {
    id: string;
    fullName: string;
    employeeCode: string | null;
    department: { id: string; name: string; code: string };
  } | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      student: {
        include: {
          division: { select: { id: true, name: true } },
          batch: { select: { id: true, name: true } },
        },
      },
      teacher: {
        include: {
          department: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Mutual Exclusivity Security Check
  if (user.student && user.teacher) {
    console.error(
      `SECURITY INTEGRITY ALERT: User ${user.id} (${user.email}) is linked to both Student ${user.student.id} and Teacher ${user.teacher.id}. Denying privileged access.`,
    );
    return null;
  }

  const isConfiguredAdmin = isAdminEmail(user.email);
  const effectiveRole = isConfiguredAdmin ? UserRole.ADMIN : user.role;
  const isLinked = effectiveRole === UserRole.ADMIN || Boolean(user.student || user.teacher);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: effectiveRole,
    isLinked,
    student: user.student
      ? {
          id: user.student.id,
          prn: user.student.prn,
          rollNumber: user.student.rollNumber,
          fullName: user.student.fullName,
          division: user.student.division,
          batch: user.student.batch,
        }
      : null,
    teacher: user.teacher
      ? {
          id: user.teacher.id,
          fullName: user.teacher.fullName,
          employeeCode: user.teacher.employeeCode,
          department: user.teacher.department,
        }
      : null,
  };
});

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.role !== UserRole.ADMIN) {
    redirect("/login?error=unauthorized");
  }
  return user;
}

export async function requireLinkedStudent(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.role !== UserRole.STUDENT || !user.student) {
    redirect(user.role === UserRole.ADMIN ? "/admin/verification" : "/onboarding");
  }
  return user;
}

export async function requireLinkedTeacher(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.role !== UserRole.TEACHER || !user.teacher) {
    redirect(user.role === UserRole.ADMIN ? "/admin/verification" : "/onboarding");
  }
  return user;
}
