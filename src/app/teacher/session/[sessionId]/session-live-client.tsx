"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { closeAttendanceSessionAction } from "@/app/actions/attendance";

interface SessionLiveClientProps {
  sessionId: string;
  courseCode: string;
  courseName: string;
  entryType: string;
  divisionName: string;
  batchName: string;
  roomName: string;
  teacherName: string;
  initialStatus: string;
  expiresAt: string;
  qrDataUrl: string | null;
  initialPresentCount: number;
  totalEligibleCount: number;
  initialRecords: {
    id: string;
    rollNumber: string;
    prn: string;
    fullName: string;
    batchName: string;
    markedAt: string;
  }[];
}

export function SessionLiveClient({
  sessionId,
  courseCode,
  courseName,
  entryType,
  divisionName,
  batchName,
  roomName,
  teacherName,
  initialStatus,
  expiresAt,
  qrDataUrl,
  initialPresentCount,
  totalEligibleCount,
  initialRecords,
}: SessionLiveClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [timeLeft, setTimeLeft] = useState<string>(() => {
    if (initialStatus !== "ACTIVE") {
      return initialStatus === "CLOSED" ? "Closed" : "Expired";
    }
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "00:00 (Expired)";
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  });
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Countdown timer
  useEffect(() => {
    if (status !== "ACTIVE") return;

    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft("00:00 (Expired)");
        setStatus("EXPIRED");
        router.refresh();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(
          `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
        );
      }
    };

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, status, router]);

  // Live polling for attendee list refresh every 3 seconds while active
  useEffect(() => {
    if (status !== "ACTIVE") return;
    const pollInterval = setInterval(() => {
      router.refresh();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [status, router]);

  const handleClose = () => {
    if (!confirm("Are you sure you want to close this attendance session now?")) {
      return;
    }

    startTransition(async () => {
      const result = await closeAttendanceSessionAction(sessionId);
      if (result.success) {
        setStatus("CLOSED");
        setTimeLeft("Closed");
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  const filteredRecords = initialRecords.filter(
    (r) =>
      r.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.rollNumber.includes(searchFilter) ||
      r.prn.includes(searchFilter),
  );

  const percentage =
    totalEligibleCount > 0
      ? Math.round((initialPresentCount / totalEligibleCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Session Metadata Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {courseCode}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {entryType}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Division {divisionName} • {batchName}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              ● {status}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">{courseName}</h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
            <span>📍 {roomName}</span>
            <span>👤 Instructor: {teacherName}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/dashboard"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            ← Back to Dashboard
          </Link>

          {status === "ACTIVE" && (
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              {isPending ? "Closing..." : "Close Attendance Session"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code & Countdown Monitor */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Session QR Code
              </span>
              <div
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono ${
                  status === "ACTIVE"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                ⏱ {timeLeft}
              </div>
            </div>

            {status === "ACTIVE" && qrDataUrl ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Attendance Session QR Code"
                  className="w-64 h-64 mx-auto rounded-xl"
                />
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 space-y-2">
                <span className="text-3xl">🔒</span>
                <p className="text-sm font-semibold text-slate-700">
                  QR Code Inactive
                </p>
                <p className="text-xs text-slate-400">
                  This attendance session has ended and is no longer accepting scans.
                </p>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Students must scan this QR code using the AttendX scanner on their verified device.
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Attendance Turnout</span>
              <span className="font-bold text-slate-900">
                {initialPresentCount} / {totalEligibleCount} ({percentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Attendee Roster */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Live Attendees ({initialPresentCount})
                </h3>
                <p className="text-xs text-slate-500">
                  Verified students marked present for this session
                </p>
              </div>

              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by name / roll..."
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px]">
              {filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  {initialRecords.length === 0
                    ? "Waiting for students to scan the QR code..."
                    : "No students match your filter."}
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Roll</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3 text-right">Marked At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {rec.rollNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {rec.fullName}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {rec.prn}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {rec.batchName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                          {new Date(rec.markedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
