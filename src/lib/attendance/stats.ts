import "server-only";
import { prisma } from "@/lib/prisma";
import {
  AttendanceRecordStatus,
  AttendanceSessionStatus,
} from "@/generated/prisma/enums";
import { mapJsDayToPrismaDay, getUtcMidnightDate } from "./session";

export type SubjectAttendanceStat = {
  courseId: string;
  courseCode: string;
  courseName: string;
  totalConducted: number;
  totalAttended: number;
  percentage: number;
  isEligible: boolean; // >= 75%
};

export type StudentAttendanceSummary = {
  totalConducted: number;
  totalAttended: number;
  overallPercentage: number;
  subjectStats: SubjectAttendanceStat[];
  recentRecords: {
    id: string;
    courseCode: string;
    courseName: string;
    teacherName: string;
    markedAt: Date;
    status: AttendanceRecordStatus;
  }[];
};

export type StudentTodayScheduleItem = {
  timetableEntryId: string;
  courseCode: string;
  courseName: string;
  teacherName: string;
  entryType: string;
  batchName: string | null;
  building: string;
  roomNumber: string;
  startTime: Date;
  endTime: Date;
  activeSession: {
    id: string;
    status: AttendanceSessionStatus;
    expiresAt: Date;
    alreadyMarked: boolean;
  } | null;
};

/**
 * Computes course-by-course and overall attendance statistics for a student.
 */
export async function getStudentAttendanceStats(
  studentId: string,
): Promise<StudentAttendanceSummary> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { division: true, batch: true },
  });

  if (!student) {
    throw new Error("Student record not found.");
  }

  // Get courses assigned to the student's department/division
  const courses = await prisma.course.findMany({
    orderBy: { code: "asc" },
  });

  let grandTotalConducted = 0;
  let grandTotalAttended = 0;
  const subjectStats: SubjectAttendanceStat[] = [];

  for (const course of courses) {
    // 1. Total sessions conducted for this course applicable to this student
    const totalConducted = await prisma.attendanceSession.count({
      where: {
        status: { in: [AttendanceSessionStatus.ACTIVE, AttendanceSessionStatus.CLOSED, AttendanceSessionStatus.EXPIRED] },
        timetableEntry: {
          courseId: course.id,
          divisionId: student.divisionId,
          OR: [
            { batchId: student.batchId },
            { batchId: null }, // Division-wide theory
          ],
        },
      },
    });

    // 2. Total sessions attended by this student
    const totalAttended = await prisma.attendanceRecord.count({
      where: {
        studentId: student.id,
        status: AttendanceRecordStatus.PRESENT,
        session: {
          timetableEntry: {
            courseId: course.id,
          },
        },
      },
    });

    if (totalConducted > 0) {
      grandTotalConducted += totalConducted;
      grandTotalAttended += totalAttended;
    }

    const percentage =
      totalConducted > 0
        ? Math.round((totalAttended / totalConducted) * 1000) / 10
        : 100.0;

    subjectStats.push({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      totalConducted,
      totalAttended,
      percentage,
      isEligible: percentage >= 75.0,
    });
  }

  const overallPercentage =
    grandTotalConducted > 0
      ? Math.round((grandTotalAttended / grandTotalConducted) * 1000) / 10
      : 100.0;

  // Recent attendance records
  const recentRecordsRaw = await prisma.attendanceRecord.findMany({
    where: {
      studentId: student.id,
    },
    include: {
      session: {
        include: {
          timetableEntry: {
            include: {
              course: true,
            },
          },
          teacher: true,
        },
      },
    },
    orderBy: {
      markedAt: "desc",
    },
    take: 10,
  });

  const recentRecords = recentRecordsRaw.map((r) => ({
    id: r.id,
    courseCode: r.session.timetableEntry.course.code,
    courseName: r.session.timetableEntry.course.name,
    teacherName: r.session.teacher.fullName,
    markedAt: r.markedAt,
    status: r.status,
  }));

  return {
    totalConducted: grandTotalConducted,
    totalAttended: grandTotalAttended,
    overallPercentage,
    subjectStats,
    recentRecords,
  };
}

/**
 * Retrieves today's timetable schedule for a student with live active session flags.
 */
export async function getStudentTodaySchedule(
  studentId: string,
  targetDate: Date = new Date(),
): Promise<StudentTodayScheduleItem[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { division: true, batch: true },
  });

  if (!student) {
    throw new Error("Student not found.");
  }

  const dayOfWeek = mapJsDayToPrismaDay(targetDate.getDay());
  if (!dayOfWeek) {
    return [];
  }
  const todayDate = getUtcMidnightDate(targetDate);

  const timetableEntries = await prisma.timetableEntry.findMany({
    where: {
      divisionId: student.divisionId,
      OR: [
        { batchId: student.batchId },
        { batchId: null }, // Division-wide classes
      ],
      dayOfWeek,
      isActive: true,
    },
    include: {
      course: true,
      teacher: true,
      batch: true,
      room: true,
      attendanceSessions: {
        where: {
          date: todayDate,
        },
        include: {
          records: {
            where: {
              studentId: student.id,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return timetableEntries.map((entry) => {
    const session = entry.attendanceSessions[0];
    let activeSession = null;

    if (session) {
      activeSession = {
        id: session.id,
        status: session.status,
        expiresAt: session.expiresAt,
        alreadyMarked: session.records.length > 0,
      };
    }

    return {
      timetableEntryId: entry.id,
      courseCode: entry.course.code,
      courseName: entry.course.name,
      teacherName: entry.teacher.fullName,
      entryType: entry.entryType,
      batchName: entry.batch?.name || "All Batches (Theory)",
      building: entry.room.building,
      roomNumber: entry.room.roomNumber,
      startTime: entry.startTime,
      endTime: entry.endTime,
      activeSession,
    };
  });
}
