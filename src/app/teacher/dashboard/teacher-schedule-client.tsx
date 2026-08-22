"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startAttendanceSessionAction,
  closeAttendanceSessionAction,
} from "@/app/actions/attendance";
import { TeacherScheduledClass } from "@/lib/attendance/session";

interface TeacherScheduleClientProps {
  schedule: TeacherScheduledClass[];
}

export function TeacherScheduleClient({ schedule }: TeacherScheduleClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDuration, setSelectedDuration] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartAttendance = (timetableEntryId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await startAttendanceSessionAction(
        timetableEntryId,
        selectedDuration,
      );

      if (result.success && result.sessionId) {
        router.push(`/teacher/session/${result.sessionId}`);
      } else {
        setErrorMessage(result.message || "Failed to start attendance session.");
      }
    });
  };

  const handleCloseSession = (sessionId: string) => {
    if (!confirm("Are you sure you want to close this attendance session?")) {
      return;
    }
    setErrorMessage(null);
    startTransition(async () => {
      const result = await closeAttendanceSessionAction(sessionId);
      if (result.success) {
        router.refresh();
      } else {
        setErrorMessage(result.message);
      }
    });
  };

  const formatTime = (d: Date) => {
    const date = new Date(d);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${formattedHours.toString().padStart(2, "0")}:${formattedMinutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <span className="font-semibold">Error:</span> {errorMessage}
        </div>
      )}

      {/* Duration Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="text-xs text-slate-500 font-medium">
          Select QR Code Active Validity for new sessions:
        </div>
        <div className="flex items-center gap-2">
          {[5, 10, 15, 30].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setSelectedDuration(mins)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDuration === mins
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mins} mins
            </button>
          ))}
        </div>
      </div>

      {schedule.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl font-bold">
            📅
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            No Scheduled Classes Today
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any official timetable entries scheduled for today.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {schedule.map((item) => {
            const hasActiveSession =
              item.activeSession && item.activeSession.status === "ACTIVE";
            const isClosed =
              item.activeSession && item.activeSession.status === "CLOSED";

            return (
              <div
                key={item.timetableEntryId}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {item.courseCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {item.entryType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {item.batchName || "Division B (All Batches)"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {item.courseName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">⏰</span>
                      <span>
                        {formatTime(item.startTime)} – {formatTime(item.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">📍</span>
                      <span>
                        {item.building} ({item.roomNumber})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Status & Action */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {hasActiveSession ? (
                    <>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
                        <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                          Active Session
                        </div>
                        <div className="text-sm font-bold text-emerald-900">
                          {item.activeSession?.presentCount} /{" "}
                          {item.activeSession?.totalEligibleCount} Present
                        </div>
                      </div>

                      <Link
                        href={`/teacher/session/${item.activeSession?.id}`}
                        className="px-4 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <span>View QR Code</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleCloseSession(item.activeSession!.id)}
                        disabled={isPending}
                        className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-xl transition-all"
                      >
                        Close
                      </button>
                    </>
                  ) : isClosed ? (
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500">
                        Session Closed ({item.activeSession?.presentCount} Present)
                      </span>
                      <Link
                        href={`/teacher/session/${item.activeSession?.id}`}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                      >
                        View Roster
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartAttendance(item.timetableEntryId)}
                      disabled={isPending}
                      className="px-5 py-3 bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      {isPending ? "Starting..." : "Start Attendance"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
