import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { AttendXMark } from "@/components/brand/logo";

export default async function AdminAttendancePage() {
  await requireAdmin();

  const [sessions, attempts, totalRecordsCount] = await Promise.all([
    prisma.attendanceSession.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
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
          select: { id: true },
        },
      },
    }),
    prisma.attendanceAttempt.findMany({
      take: 20,
      orderBy: { attemptedAt: "desc" },
      include: {
        student: {
          select: {
            rollNumber: true,
            prn: true,
            division: { select: { name: true } },
            batch: { select: { name: true } },
          },
        },
        session: {
          include: {
            timetableEntry: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    }),
    prisma.attendanceRecord.count(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AttendXMark className="w-8 h-8 shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-[0.14em] text-[#0F172A] leading-none">
                  ATTEND<span className="text-[#10B981]">X</span>
                </span>
                <span className="text-xs font-semibold text-slate-400">|</span>
                <span className="text-xs font-semibold text-slate-700">Admin Console</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Attendance Engine &amp; Live Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/verification"
              className="text-xs font-semibold text-slate-600 hover:text-[#0F172A] px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Identity Verification
            </Link>
            <Link
              href="/admin/attendance"
              className="text-xs font-bold text-[#0F172A] bg-slate-100 px-3 py-2 rounded-lg border border-slate-200"
            >
              Attendance Engine
            </Link>
            <a
              href="/api/auth/logout"
              className="text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Sessions Conducted
            </span>
            <div className="text-3xl font-extrabold text-slate-900">
              {sessions.length}
            </div>
            <p className="text-[11px] text-slate-400">
              Department academic attendance sessions
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Verified Attendances
            </span>
            <div className="text-3xl font-extrabold text-emerald-600">
              {totalRecordsCount}
            </div>
            <p className="text-[11px] text-slate-400">
              Cumulative student attendance records
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Scan Attempts Logged
            </span>
            <div className="text-3xl font-extrabold text-slate-900">
              {attempts.length}
            </div>
            <p className="text-[11px] text-slate-400">
              Audit attempts recorded by security pipeline
            </p>
          </div>
        </div>

        {/* Sessions Monitor Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Department Attendance Sessions
              </h3>
              <p className="text-xs text-slate-500">
                Live and historical attendance sessions across all courses
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {sessions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No attendance sessions have been conducted yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Course</th>
                    <th className="px-6 py-3.5">Instructor</th>
                    <th className="px-6 py-3.5">Division / Batch</th>
                    <th className="px-6 py-3.5">Room</th>
                    <th className="px-6 py-3.5">Turnout</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {sess.timetableEntry.course.code}
                        <div className="font-normal text-slate-500 text-[11px]">
                          {sess.timetableEntry.course.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {sess.teacher.fullName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Div {sess.timetableEntry.division.name}{" "}
                          {sess.timetableEntry.batch?.name ? `• ${sess.timetableEntry.batch.name}` : "• Theory"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {sess.timetableEntry.room.building} ({sess.timetableEntry.room.roomNumber})
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                        {sess.records.length} present
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sess.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : sess.status === "CLOSED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {sess.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                        {new Date(sess.startsAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Attendance Attempts Audit Log */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">
              Recent Attendance Scan Attempts &amp; Security Audits
            </h3>
            <p className="text-xs text-slate-500">
              Audit trail of successful, duplicate, and blocked scan attempts
            </p>
          </div>

          <div className="overflow-x-auto">
            {attempts.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No attendance scan attempts recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Course</th>
                    <th className="px-6 py-3.5">Result</th>
                    <th className="px-6 py-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        Roll {att.student.rollNumber} (Div {att.student.division.name}-{att.student.batch.name})
                        <div className="font-mono text-[10px] text-slate-400 font-normal">
                          PRN: {att.student.prn}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {att.session.timetableEntry.course.code}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            att.result === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : att.result === "DUPLICATE"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {att.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                        {new Date(att.attemptedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
