"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireLinkedTeacher, requireLinkedStudent } from "@/lib/auth/dal";
import {
  startAttendanceSession,
  closeAttendanceSession,
} from "@/lib/attendance/session";
import {
  markStudentAttendance,
  MarkAttendanceResult,
} from "@/lib/attendance/verification";

export async function startAttendanceSessionAction(
  timetableEntryId: string,
  durationMinutes: number = 10,
): Promise<{
  success: boolean;
  message?: string;
  sessionId?: string;
  qrPayload?: string;
  qrDataUrl?: string;
  expiresAt?: Date;
}> {
  try {
    const user = await requireLinkedTeacher();
    const result = await startAttendanceSession(
      user.id,
      user.teacher!.id,
      timetableEntryId,
      durationMinutes,
    );

    revalidatePath("/teacher/dashboard");
    revalidatePath(`/teacher/session/${result.sessionId}`);

    return {
      success: true,
      sessionId: result.sessionId,
      qrPayload: result.qrPayload,
      qrDataUrl: result.qrDataUrl,
      expiresAt: result.expiresAt,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to start session.";
    return { success: false, message: msg };
  }
}

export async function closeAttendanceSessionAction(
  sessionId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireLinkedTeacher();
    const result = await closeAttendanceSession(
      user.id,
      user.teacher!.id,
      sessionId,
    );

    revalidatePath("/teacher/dashboard");
    revalidatePath(`/teacher/session/${sessionId}`);

    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to close session.";
    return { success: false, message: msg };
  }
}

export async function markAttendanceAction(
  qrPayload: string,
): Promise<MarkAttendanceResult> {
  try {
    const user = await requireLinkedStudent();
    const headerList = await headers();
    const userAgent = headerList.get("user-agent") || undefined;
    const ipAddress =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

    const result = await markStudentAttendance(user.id, qrPayload, {
      userAgent,
      ipAddress,
    });

    revalidatePath("/student/dashboard");
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Attendance processing failed.";
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: msg,
    };
  }
}
