import "server-only";
import { prisma } from "@/lib/prisma";
import {
  AttendanceSessionStatus,
  AttendanceRecordStatus,
  VerificationStatus,
  AttendanceAttemptResult,
  UserRole,
} from "@/generated/prisma/enums";
import { verifyQrPayload, verifySessionTokenHash } from "./token";

export type MarkAttendanceResult =
  | {
      success: true;
      message: string;
      details: {
        courseCode: string;
        courseName: string;
        teacherName: string;
        entryType: string;
        divisionName: string;
        batchName: string | null;
        markedAt: Date;
      };
    }
  | {
      success: false;
      code: AttendanceAttemptResult | "UNAUTHORIZED" | "UNLINKED";
      message: string;
    };

/**
 * Executes the complete 7-Layer server-side attendance verification pipeline.
 */
export async function markStudentAttendance(
  studentUserId: string,
  qrPayloadString: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<MarkAttendanceResult> {
  // Layer 1: Authenticated Student Identity Check
  const user = await prisma.user.findUnique({
    where: { id: studentUserId },
    include: {
      student: {
        include: {
          division: true,
          batch: true,
        },
      },
    },
  });

  if (!user || user.role !== UserRole.STUDENT) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized: You must be signed in as a student to mark attendance.",
    };
  }

  if (!user.student) {
    return {
      success: false,
      code: "UNLINKED",
      message: "Unlinked Account: You must claim and verify your student profile before marking attendance.",
    };
  }

  const student = user.student;

  // Layer 2: QR Token Signature & Integrity Verification
  const parsedQr = await verifyQrPayload(qrPayloadString);
  if (!parsedQr) {
    return {
      success: false,
      code: AttendanceAttemptResult.INVALID_TOKEN,
      message: "Invalid or tampered QR Code signature.",
    };
  }

  const { sessionId, token } = parsedQr;

  // Layer 3: Query Attendance Session
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      timetableEntry: {
        include: {
          course: true,
          division: true,
          batch: true,
        },
      },
      teacher: true,
    },
  });

  if (!session) {
    return {
      success: false,
      code: AttendanceAttemptResult.INVALID_TOKEN,
      message: "Attendance session not found or does not exist.",
    };
  }

  const now = new Date();

  // Session State Check
  if (session.status === AttendanceSessionStatus.CLOSED) {
    await prisma.attendanceAttempt.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        result: AttendanceAttemptResult.EXPIRED,
        userAgent: metadata?.userAgent,
      },
    });

    return {
      success: false,
      code: AttendanceAttemptResult.EXPIRED,
      message: "This attendance session has already been closed by the instructor.",
    };
  }

  if (now > session.expiresAt || session.status === AttendanceSessionStatus.EXPIRED) {
    await prisma.attendanceAttempt.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        result: AttendanceAttemptResult.EXPIRED,
        userAgent: metadata?.userAgent,
      },
    });

    return {
      success: false,
      code: AttendanceAttemptResult.EXPIRED,
      message: "This attendance QR code has expired.",
    };
  }

  if (session.status !== AttendanceSessionStatus.ACTIVE) {
    return {
      success: false,
      code: AttendanceAttemptResult.EXPIRED,
      message: "This attendance session is not active.",
    };
  }

  // Layer 4: Cryptographic Token Hash Match (Constant-Time)
  const isHashValid = verifySessionTokenHash(token, session.qrTokenHash);
  if (!isHashValid) {
    await prisma.attendanceAttempt.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        result: AttendanceAttemptResult.INVALID_TOKEN,
        userAgent: metadata?.userAgent,
      },
    });

    return {
      success: false,
      code: AttendanceAttemptResult.INVALID_TOKEN,
      message: "Security error: Token cryptographic signature mismatch.",
    };
  }

  // Layer 5: Division Match Check
  if (student.divisionId !== session.timetableEntry.divisionId) {
    await prisma.attendanceAttempt.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        result: AttendanceAttemptResult.WRONG_CLASS,
        userAgent: metadata?.userAgent,
      },
    });

    return {
      success: false,
      code: AttendanceAttemptResult.WRONG_CLASS,
      message: `Class mismatch: You are enrolled in Division ${student.division.name}, but this session is for Division ${session.timetableEntry.division.name}.`,
    };
  }

  // Layer 6: Batch-Specificity Match Check
  if (session.timetableEntry.batchId !== null) {
    if (student.batchId !== session.timetableEntry.batchId) {
      const targetBatchName = session.timetableEntry.batch?.name || "assigned batch";
      await prisma.attendanceAttempt.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          result: AttendanceAttemptResult.WRONG_BATCH,
          userAgent: metadata?.userAgent,
        },
      });

      return {
        success: false,
        code: AttendanceAttemptResult.WRONG_BATCH,
        message: `Batch mismatch: This session is for Batch ${targetBatchName}. You belong to Batch ${student.batch.name}.`,
      };
    }
  }

  // Layer 7: Atomic Transaction (Duplicate Prevention & Record Insertion)
  try {
    const markResult = await prisma.$transaction(async (tx) => {
      // Check for existing record
      const existingRecord = await tx.attendanceRecord.findUnique({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: student.id,
          },
        },
      });

      if (existingRecord) {
        await tx.attendanceAttempt.create({
          data: {
            sessionId: session.id,
            studentId: student.id,
            result: AttendanceAttemptResult.DUPLICATE,
            userAgent: metadata?.userAgent,
          },
        });

        return {
          duplicate: true,
          markedAt: existingRecord.markedAt,
        };
      }

      // Create verified Attendance Record
      const newRecord = await tx.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          status: AttendanceRecordStatus.PRESENT,
          verificationStatus: VerificationStatus.VERIFIED,
          markedAt: now,
          verifiedAt: now,
        },
      });

      // Log successful attempt
      await tx.attendanceAttempt.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          result: AttendanceAttemptResult.SUCCESS,
          userAgent: metadata?.userAgent,
        },
      });

      return {
        duplicate: false,
        markedAt: newRecord.markedAt,
      };
    });

    if (markResult.duplicate) {
      return {
        success: false,
        code: AttendanceAttemptResult.DUPLICATE,
        message: `Attendance has already been marked for ${session.timetableEntry.course.name} on this date.`,
      };
    }

    return {
      success: true,
      message: `Successfully marked PRESENT for ${session.timetableEntry.course.name}!`,
      details: {
        courseCode: session.timetableEntry.course.code,
        courseName: session.timetableEntry.course.name,
        teacherName: session.teacher.fullName,
        entryType: session.timetableEntry.entryType,
        divisionName: student.division.name,
        batchName: session.timetableEntry.batch?.name || null,
        markedAt: markResult.markedAt,
      },
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "Database error";
    // Check if error was due to constraint race condition
    if (errMessage.includes("Unique constraint failed")) {
      return {
        success: false,
        code: AttendanceAttemptResult.DUPLICATE,
        message: "Attendance was already recorded for this session.",
      };
    }
    throw err;
  }
}
