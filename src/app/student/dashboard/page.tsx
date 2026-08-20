import Link from "next/link";
import { requireLinkedStudent } from "@/lib/auth/dal";
import {
  getStudentAttendanceStats,
  getStudentTodaySchedule,
} from "@/lib/attendance/stats";

export default async function StudentDashboardPage() {
  const user = await requireLinkedStudent();
  const student = user.student!;

  const [stats, todaySchedule] = await Promise.all([
    getStudentAttendanceStats(student.id),
    getStudentTodaySchedule(student.id),
  ]);

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
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
              AX
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                AttendX Student Portal
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                JSPM University Pune • E&amp;TC Engineering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">{student.fullName}</div>
              <div className="text-[11px] text-slate-500">PRN: {student.prn}</div>
            </div>
            <a
              href="/api/auth/logout"
              className="text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile & Quick Scan Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ Verified Student Profile
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Div {student.division.name} • Batch {student.batch.name}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {student.fullName}
            </h2>
            <p className="text-xs text-slate-500">
              Roll No: <span className="font-bold text-slate-800">{student.rollNumber}</span> • PRN:{" "}
              <span className="font-mono text-slate-800">{student.prn}</span> • Google:{" "}
              <span className="font-medium text-slate-800">{user.email}</span>
            </p>
          </div>

          {/* Quick Scan Action Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/student/scan"
              className="w-full sm:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <span className="text-xl">📷</span>
              <span>Scan Attendance QR</span>
            </Link>
          </div>
        </div>

        {/* Analytics Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Overall Attendance
            </span>
            <div className="flex items-baseline gap-2">
              <div
                className={`text-3xl font-extrabold ${
                  stats.overallPercentage >= 75
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {stats.overallPercentage}%
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {stats.overallPercentage >= 75 ? "Eligible" : "Warning (< 75%)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Across all enrolled department courses
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Lectures Attended
            </span>
            <div className="text-3xl font-extrabold text-slate-900">
              {stats.totalAttended}
            </div>
            <p className="text-[11px] text-slate-400">
              Verified sessions marked PRESENT
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Conducted
            </span>
            <div className="text-3xl font-extrabold text-slate-900">
              {stats.totalConducted}
            </div>
            <p className="text-[11px] text-slate-400">
              Official timetable sessions held
            </p>
          </div>
        </div>

        {/* Today's Timetable Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Today&apos;s Class Schedule
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Official Timetable for Batch {student.batch.name}
            </span>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs shadow-sm">
              No classes scheduled for your division/batch today.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todaySchedule.map((item) => {
                const isActive = item.activeSession?.status === "ACTIVE";
                const isMarked = item.activeSession?.alreadyMarked;

                return (
                  <div
                    key={item.timetableEntryId}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.courseCode}
                        </span>
                        <span className="text-xs font-mono text-slate-500 font-medium">
                          {formatTime(item.startTime)} – {formatTime(item.endTime)}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900">
                        {item.courseName}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span>👤 {item.teacherName}</span>
                        <span>📍 {item.building} ({item.roomNumber})</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                          {item.batchName}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {isActive ? (
                        isMarked ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                            ✓ Attendance Marked
                          </span>
                        ) : (
                          <Link
                            href="/student/scan"
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                          >
                            📷 Scan Active Session
                          </Link>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Session not active
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subject-Wise Attendance Breakdown Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">
              Subject-Wise Attendance Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Official semester attendance records calculated per course
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Course Code</th>
                  <th className="px-6 py-3.5">Course Name</th>
                  <th className="px-6 py-3.5 text-center">Conducted</th>
                  <th className="px-6 py-3.5 text-center">Attended</th>
                  <th className="px-6 py-3.5 text-center">Percentage</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.subjectStats.map((sub) => (
                  <tr key={sub.courseId} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {sub.courseCode}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {sub.courseName}
                    </td>
                    <td className="px-6 py-4 text-center font-mono">
                      {sub.totalConducted}
                    </td>
                    <td className="px-6 py-4 text-center font-mono">
                      {sub.totalAttended}
                    </td>
                    <td className="px-6 py-4 text-center font-bold font-mono">
                      {sub.percentage}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.isEligible
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {sub.isEligible ? "Eligible (≥ 75%)" : "Low Attendance"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Attendance Records History */}
        {stats.recentRecords.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Recent Attendance Log
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {stats.recentRecords.map((r) => (
                <div
                  key={r.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-bold text-slate-900">
                      {r.courseCode}
                    </span>{" "}
                    — <span className="text-slate-700">{r.courseName}</span>
                    <div className="text-[11px] text-slate-400">
                      Instructor: {r.teacherName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {r.status}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {new Date(r.markedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
