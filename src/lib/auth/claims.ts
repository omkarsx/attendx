import "server-only";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";

export type PendingClaim = {
  logId: string;
  type: "STUDENT" | "TEACHER";
  createdAt: Date;
  requesterUser: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
  entityDetails: {
    id: string;
    fullName: string;
    identifier: string; // PRN or EmployeeCode
    secondaryInfo: string; // Division/Batch or Department
    alreadyClaimed: boolean;
  };
};

export async function submitStudentClaim(
  userId: string,
  prnInput: string,
  rollNumberInput: string,
): Promise<{ success: boolean; message: string }> {
  const prn = prnInput.trim();
  const rollNumber = rollNumberInput.trim();

  if (!prn || !rollNumber) {
    return { success: false, message: "PRN and Roll Number are required." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true, teacher: true },
  });

  if (!user) {
    return { success: false, message: "User account not found." };
  }

  if (user.student || user.teacher || user.role === UserRole.ADMIN) {
    return {
      success: false,
      message: "This account already has a bound profile or administrator role.",
    };
  }

  // Find official student record
  const student = await prisma.student.findUnique({
    where: { prn },
    include: { division: true, batch: true },
  });

  if (!student || student.rollNumber !== rollNumber) {
    // Avoid exposing detailed enumeration
    return {
      success: false,
      message: "No matching unlinked student record found for the provided details.",
    };
  }

  if (student.userId !== null) {
    return {
      success: false,
      message: "This student profile is already linked to an account. Contact an administrator.",
    };
  }

  // Check if this user already submitted a pending claim
  const existingUserClaim = await prisma.auditLog.findFirst({
    where: {
      actorUserId: user.id,
      action: "STUDENT_CLAIM_SUBMITTED",
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingUserClaim) {
    const isResolved = await prisma.auditLog.findFirst({
      where: {
        action: { in: ["STUDENT_ACCOUNT_LINKED", "CLAIM_REJECTED"] },
        entityId: existingUserClaim.entityId,
        createdAt: { gte: existingUserClaim.createdAt },
      },
    });

    if (!isResolved) {
      return {
        success: false,
        message: "You already have a pending verification claim. Please wait for administrator review.",
      };
    }
  }

  // Log pending claim
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "STUDENT_CLAIM_SUBMITTED",
      entityType: "Student",
      entityId: student.id,
      oldValue: {
        prn: student.prn,
        rollNumber: student.rollNumber,
        fullName: student.fullName,
        applicantEmail: user.email,
      },
      newValue: {
        status: "PENDING_ADMIN_VERIFICATION",
      },
      reason: `Student identity claim submitted by ${user.email}`,
    },
  });

  return {
    success: true,
    message: "Identity claim submitted successfully. An administrator will verify and approve your profile.",
  };
}

export async function submitTeacherClaim(
  userId: string,
  employeeCodeInput: string,
): Promise<{ success: boolean; message: string }> {
  const employeeCode = employeeCodeInput.trim();

  if (!employeeCode) {
    return { success: false, message: "Employee Code is required." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true, teacher: true },
  });

  if (!user) {
    return { success: false, message: "User account not found." };
  }

  if (user.student || user.teacher || user.role === UserRole.ADMIN) {
    return {
      success: false,
      message: "This account already has a bound profile or administrator role.",
    };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { employeeCode },
    include: { department: true },
  });

  if (!teacher) {
    return {
      success: false,
      message: "No matching unlinked faculty record found for the provided Employee Code.",
    };
  }

  if (teacher.userId !== null) {
    return {
      success: false,
      message: "This faculty profile is already linked to an account. Contact an administrator.",
    };
  }

  // Log pending claim
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "TEACHER_CLAIM_SUBMITTED",
      entityType: "Teacher",
      entityId: teacher.id,
      oldValue: {
        employeeCode: teacher.employeeCode,
        fullName: teacher.fullName,
        applicantEmail: user.email,
      },
      newValue: {
        status: "PENDING_ADMIN_VERIFICATION",
      },
      reason: `Faculty identity claim submitted by ${user.email}`,
    },
  });

  return {
    success: true,
    message: "Faculty claim submitted successfully. An administrator will verify and approve your profile.",
  };
}

export async function getPendingClaims(): Promise<PendingClaim[]> {
  // Fetch all claim submissions
  const claimLogs = await prisma.auditLog.findMany({
    where: {
      action: { in: ["STUDENT_CLAIM_SUBMITTED", "TEACHER_CLAIM_SUBMITTED"] },
    },
    include: {
      actorUser: {
        select: { id: true, email: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending: PendingClaim[] = [];

  for (const log of claimLogs) {
    // Check if this claim has been resolved
    const resolution = await prisma.auditLog.findFirst({
      where: {
        action: {
          in: ["STUDENT_ACCOUNT_LINKED", "TEACHER_ACCOUNT_LINKED", "CLAIM_REJECTED"],
        },
        entityId: log.entityId,
        createdAt: { gte: log.createdAt },
      },
    });

    if (resolution) {
      continue;
    }

    if (log.action === "STUDENT_CLAIM_SUBMITTED") {
      const student = await prisma.student.findUnique({
        where: { id: log.entityId },
        include: { division: true, batch: true },
      });

      if (student) {
        pending.push({
          logId: log.id,
          type: "STUDENT",
          createdAt: log.createdAt,
          requesterUser: log.actorUser,
          entityDetails: {
            id: student.id,
            fullName: student.fullName,
            identifier: `PRN: ${student.prn} (Roll No: ${student.rollNumber})`,
            secondaryInfo: `Div ${student.division.name} / Batch ${student.batch.name}`,
            alreadyClaimed: student.userId !== null,
          },
        });
      }
    } else if (log.action === "TEACHER_CLAIM_SUBMITTED") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: log.entityId },
        include: { department: true },
      });

      if (teacher) {
        pending.push({
          logId: log.id,
          type: "TEACHER",
          createdAt: log.createdAt,
          requesterUser: log.actorUser,
          entityDetails: {
            id: teacher.id,
            fullName: teacher.fullName,
            identifier: `Employee Code: ${teacher.employeeCode || "N/A"}`,
            secondaryInfo: `Department: ${teacher.department.name}`,
            alreadyClaimed: teacher.userId !== null,
          },
        });
      }
    }
  }

  return pending;
}

export async function approveStudentClaim(
  adminUserId: string,
  logId: string,
): Promise<{ success: boolean; message: string }> {
  return prisma.$transaction(async (tx) => {
    const claimLog = await tx.auditLog.findUniqueOrThrow({
      where: { id: logId },
      include: { actorUser: true },
    });

    if (claimLog.action !== "STUDENT_CLAIM_SUBMITTED") {
      throw new Error("Invalid claim log action.");
    }

    const student = await tx.student.findUniqueOrThrow({
      where: { id: claimLog.entityId },
    });

    if (student.userId !== null) {
      throw new Error("Student record is already linked to another account.");
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: claimLog.actorUserId },
      include: { student: true, teacher: true },
    });

    if (user.student || user.teacher) {
      throw new Error("User account is already linked to an academic identity.");
    }

    // Atomically link student
    await tx.student.update({
      where: { id: student.id },
      data: { userId: user.id },
    });

    // Create immutable audit record
    await tx.auditLog.create({
      data: {
        actorUserId: adminUserId,
        action: "STUDENT_ACCOUNT_LINKED",
        entityType: "Student",
        entityId: student.id,
        oldValue: { userId: null, claimLogId: logId },
        newValue: {
          userId: user.id,
          prn: student.prn,
          userEmail: user.email,
        },
        reason: "Student identity claim approved by administrator.",
      },
    });

    return {
      success: true,
      message: `Successfully linked Student ${student.fullName} (PRN: ${student.prn}) to ${user.email}.`,
    };
  });
}

export async function approveTeacherClaim(
  adminUserId: string,
  logId: string,
): Promise<{ success: boolean; message: string }> {
  return prisma.$transaction(async (tx) => {
    const claimLog = await tx.auditLog.findUniqueOrThrow({
      where: { id: logId },
      include: { actorUser: true },
    });

    if (claimLog.action !== "TEACHER_CLAIM_SUBMITTED") {
      throw new Error("Invalid claim log action.");
    }

    const teacher = await tx.teacher.findUniqueOrThrow({
      where: { id: claimLog.entityId },
    });

    if (teacher.userId !== null) {
      throw new Error("Teacher record is already linked to another account.");
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: claimLog.actorUserId },
      include: { student: true, teacher: true },
    });

    if (user.student || user.teacher) {
      throw new Error("User account is already linked to an academic identity.");
    }

    // Atomically link teacher and promote role
    await tx.teacher.update({
      where: { id: teacher.id },
      data: { userId: user.id },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { role: UserRole.TEACHER },
    });

    // Create immutable audit record
    await tx.auditLog.create({
      data: {
        actorUserId: adminUserId,
        action: "TEACHER_ACCOUNT_LINKED",
        entityType: "Teacher",
        entityId: teacher.id,
        oldValue: { userId: null, role: user.role, claimLogId: logId },
        newValue: {
          userId: user.id,
          role: UserRole.TEACHER,
          employeeCode: teacher.employeeCode,
          userEmail: user.email,
        },
        reason: "Faculty identity claim approved by administrator.",
      },
    });

    return {
      success: true,
      message: `Successfully linked Faculty ${teacher.fullName} to ${user.email}.`,
    };
  });
}

export async function rejectClaim(
  adminUserId: string,
  logId: string,
  reasonInput?: string,
): Promise<{ success: boolean; message: string }> {
  const claimLog = await prisma.auditLog.findUniqueOrThrow({
    where: { id: logId },
  });

  const reason = reasonInput?.trim() || "Claim rejected by administrator after verification check.";

  await prisma.auditLog.create({
    data: {
      actorUserId: adminUserId,
      action: "CLAIM_REJECTED",
      entityType: claimLog.entityType,
      entityId: claimLog.entityId,
      oldValue: { claimLogId: logId },
      newValue: { status: "REJECTED" },
      reason,
    },
  });

  return {
    success: true,
    message: "Claim has been rejected.",
  };
}

export async function getUserClaimStatus(userId: string): Promise<{
  hasPendingClaim: boolean;
  type?: "STUDENT" | "TEACHER";
  submittedAt?: Date;
}> {
  const latestClaim = await prisma.auditLog.findFirst({
    where: {
      actorUserId: userId,
      action: { in: ["STUDENT_CLAIM_SUBMITTED", "TEACHER_CLAIM_SUBMITTED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestClaim) {
    return { hasPendingClaim: false };
  }

  const resolution = await prisma.auditLog.findFirst({
    where: {
      action: {
        in: ["STUDENT_ACCOUNT_LINKED", "TEACHER_ACCOUNT_LINKED", "CLAIM_REJECTED"],
      },
      entityId: latestClaim.entityId,
      createdAt: { gte: latestClaim.createdAt },
    },
  });

  if (resolution) {
    return { hasPendingClaim: false };
  }

  return {
    hasPendingClaim: true,
    type: latestClaim.action === "STUDENT_CLAIM_SUBMITTED" ? "STUDENT" : "TEACHER",
    submittedAt: latestClaim.createdAt,
  };
}
