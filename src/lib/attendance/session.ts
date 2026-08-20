import "server-only";
import { prisma } from "@/lib/prisma";
import {
  DayOfWeek,
  AttendanceSessionStatus,
  AttendanceRecordStatus,
} from "@/generated/prisma/enums";
import {
  generateSessionToken,
  hashSessionToken,
  generateSignedQrPayload,
  generateQrDataUrl,
} from "./token";

export function mapJsDayToPrismaDay(jsDay: number): DayOfWeek | null {
  switch (jsDay) {
    case 1:
      return DayOfWeek.MONDAY;
    case 2:
      return DayOfWeek.TUESDAY;
    case 3:
      return DayOfWeek.WEDNESDAY;
    case 4:
      return DayOfWeek.THURSDAY;
    case 5:
      return DayOfWeek.FRIDAY;
    case 6:
      return DayOfWeek.SATURDAY;
    default:
      return null;
  }
}

export function getUtcMidnightDate(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export type TeacherScheduledClass = {
  timetableEntryId: string;
  courseCode: string;
  courseName: string;
  entryType: string;
  divisionName: string;
  batchName: string | null;
  building: string;
  roomNumber: string;
  dayOfWeek: DayOfWeek;
  startTime: Date;
  endTime: Date;
  activeSession: {
    id: string;
    status: AttendanceSessionStatus;
    startsAt: Date;
    expiresAt: Date;
    presentCount: number;
    totalEligibleCount: number;
  } | null;
};

/**
 * Retrieves today's scheduled timetable entries and active session status for a teacher.
 */
export async function getTeacherTodaySchedule(
  teacherId: string,
  targetDate: Date = new Date(),
): Promise<TeacherScheduledClass[]> {
  const dayOfWeek = mapJsDayToPrismaDay(targetDate.getDay());
  if (!dayOfWeek) {
    return [];
  }
  const todayDate = getUtcMidnightDate(targetDate);

  const timetableEntries = await prisma.timetableEntry.findMany({
    where: {
      teacherId,
      dayOfWeek,
      isActive: true,
    },
    include: {
      course: true,
      division: true,
      batch: true,
      room: true,
      attendanceSessions: {
        where: {
          date: todayDate,
        },
        include: {
          records: {
            where: { status: AttendanceRecordStatus.PRESENT },
            select: { id: true },
          },
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const result: TeacherScheduledClass[] = [];

  for (const entry of timetableEntries) {
    let activeSessionInfo: TeacherScheduledClass["activeSession"] = null;
    const session = entry.attendanceSessions[0];

    // Compute total eligible students (batch size or full division)
    const totalEligibleCount = await prisma.student.count({
      where: {
        divisionId: entry.divisionId,
        ...(entry.batchId ? { batchId: entry.batchId } : {}),
      },
    });

    if (session) {
      activeSessionInfo = {
        id: session.id,
        status: session.status,
        startsAt: session.startsAt,
        expiresAt: session.expiresAt,
        presentCount: session.records.length,
        totalEligibleCount,
      };
    }

    result.push({
      timetableEntryId: entry.id,
      courseCode: entry.course.code,
      courseName: entry.course.name,
      entryType: entry.entryType,
      divisionName: entry.division.name,
      batchName: entry.batch?.name || null,
      building: entry.room.building,
      roomNumber: entry.room.roomNumber,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      activeSession: activeSessionInfo,
    });
  }

  return result;
}

/**
 * Starts a new attendance session for a scheduled timetable entry.
 */
export async function startAttendanceSession(
  actorUserId: string,
  teacherId: string,
  timetableEntryId: string,
  durationMinutes: number = 10,
  targetDate: Date = new Date(),
): Promise<{
  sessionId: string;
  qrPayload: string;
  qrDataUrl: string;
  startsAt: Date;
  expiresAt: Date;
}> {
  const timetableEntry = await prisma.timetableEntry.findUnique({
    where: { id: timetableEntryId },
    include: { teacher: true, course: true, division: true, batch: true },
  });

  if (!timetableEntry || !timetableEntry.isActive) {
    throw new Error("Timetable entry not found or inactive.");
  }

  if (timetableEntry.teacherId !== teacherId) {
    throw new Error("Unauthorized: You are not assigned to this timetable entry.");
  }

  const todayDate = getUtcMidnightDate(targetDate);
  const now = new Date();
  const clampedDuration = Math.min(Math.max(durationMinutes, 1), 60); // 1 to 60 minutes
  const expiresAt = new Date(now.getTime() + clampedDuration * 60 * 1000);

  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);

  const session = await prisma.$transaction(async (tx) => {
    // Check if session exists for today
    const existingSession = await tx.attendanceSession.findUnique({
      where: {
        timetableEntryId_date: {
          timetableEntryId: timetableEntry.id,
          date: todayDate,
        },
      },
    });

    let activeSession;
    if (existingSession) {
      if (existingSession.status === AttendanceSessionStatus.CLOSED) {
        throw new Error(
          "An attendance session for this class was already conducted and closed today.",
        );
      }

      // Re-activate / update existing session
      activeSession = await tx.attendanceSession.update({
        where: { id: existingSession.id },
        data: {
          startsAt: now,
          expiresAt,
          status: AttendanceSessionStatus.ACTIVE,
          qrTokenHash: tokenHash,
          closedAt: null,
        },
      });
    } else {
      activeSession = await tx.attendanceSession.create({
        data: {
          timetableEntryId: timetableEntry.id,
          teacherId,
          date: todayDate,
          startsAt: now,
          expiresAt,
          status: AttendanceSessionStatus.ACTIVE,
          qrTokenHash: tokenHash,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "ATTENDANCE_SESSION_STARTED",
        entityType: "AttendanceSession",
        entityId: activeSession.id,
        newValue: {
          timetableEntryId: timetableEntry.id,
          courseCode: timetableEntry.course.code,
          durationMinutes: clampedDuration,
          expiresAt,
        },
        reason: `Teacher opened attendance session for ${timetableEntry.course.code}`,
      },
    });

    return activeSession;
  });

  const qrPayload = await generateSignedQrPayload(session.id, rawToken, expiresAt);
  const qrDataUrl = await generateQrDataUrl(qrPayload);

  return {
    sessionId: session.id,
    qrPayload,
    qrDataUrl,
    startsAt: session.startsAt,
    expiresAt: session.expiresAt,
  };
}

/**
 * Closes an active attendance session manually.
 */
export async function closeAttendanceSession(
  actorUserId: string,
  teacherId: string,
  sessionId: string,
): Promise<{ success: boolean; message: string }> {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { timetableEntry: { include: { course: true } } },
  });

  if (!session) {
    throw new Error("Attendance session not found.");
  }

  if (session.teacherId !== teacherId) {
    throw new Error("Unauthorized: You do not own this attendance session.");
  }

  if (session.status === AttendanceSessionStatus.CLOSED) {
    return { success: true, message: "Session is already closed." };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: AttendanceSessionStatus.CLOSED,
        closedAt: now,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "ATTENDANCE_SESSION_CLOSED",
        entityType: "AttendanceSession",
        entityId: session.id,
        oldValue: { status: session.status },
        newValue: { status: AttendanceSessionStatus.CLOSED, closedAt: now },
        reason: `Teacher closed attendance session for ${session.timetableEntry.course.code}`,
      },
    });
  });

  return { success: true, message: "Attendance session successfully closed." };
}

/**
 * Fetches active session details, present student roster, and live attendee count.
 */
export async function getLiveSessionDetails(
  sessionId: string,
  callerTeacherId?: string,
) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      timetableEntry: {
        include: {
          course: true,
          division: true,
          batch: true,
          room: true,
        },
      },
      teacher: true,
      records: {
        include: {
          student: {
            include: {
              batch: true,
            },
          },
        },
        orderBy: {
          markedAt: "asc",
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (callerTeacherId && session.teacherId !== callerTeacherId) {
    throw new Error("Unauthorized: You do not have permission to view this session.");
  }

  // Check if expired and auto-update
  const now = new Date();
  if (session.status === AttendanceSessionStatus.ACTIVE && now > session.expiresAt) {
    await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { status: AttendanceSessionStatus.EXPIRED },
    });
    session.status = AttendanceSessionStatus.EXPIRED;
  }

  const totalEligibleCount = await prisma.student.count({
    where: {
      divisionId: session.timetableEntry.divisionId,
      ...(session.timetableEntry.batchId
        ? { batchId: session.timetableEntry.batchId }
        : {}),
    },
  });

  return {
    id: session.id,
    status: session.status,
    startsAt: session.startsAt,
    expiresAt: session.expiresAt,
    closedAt: session.closedAt,
    courseCode: session.timetableEntry.course.code,
    courseName: session.timetableEntry.course.name,
    entryType: session.timetableEntry.entryType,
    divisionName: session.timetableEntry.division.name,
    batchName: session.timetableEntry.batch?.name || "All Batches (Theory)",
    roomName: `${session.timetableEntry.room.building} - ${session.timetableEntry.room.roomNumber}`,
    teacherName: session.teacher.fullName,
    totalEligibleCount,
    presentCount: session.records.length,
    records: session.records.map((r) => ({
      id: r.id,
      studentId: r.student.id,
      rollNumber: r.student.rollNumber,
      prn: r.student.prn,
      fullName: r.student.fullName,
      batchName: r.student.batch.name,
      status: r.status,
      markedAt: r.markedAt,
    })),
  };
}
