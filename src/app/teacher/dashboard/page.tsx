import { requireLinkedTeacher } from "@/lib/auth/dal";
import { getTeacherTodaySchedule } from "@/lib/attendance/session";
import { AttendXMark } from "@/components/brand/logo";
import { TeacherScheduleClient } from "./teacher-schedule-client";

export default async function TeacherDashboardPage() {
  const user = await requireLinkedTeacher();
  const teacher = user.teacher!;
  const todaySchedule = await getTeacherTodaySchedule(teacher.id);

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
                <span className="text-xs font-semibold text-slate-700">Faculty Portal</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                JSPM University Pune • School of E&amp;CS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">{teacher.fullName}</div>
              <div className="text-[11px] text-slate-500">{teacher.department.name}</div>
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-2">
                ✓ Verified Faculty Profile
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                {teacher.fullName}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Department of {teacher.department.name} ({teacher.department.code}) • Employee Code:{" "}
                <span className="text-slate-700 font-medium">{teacher.employeeCode || "N/A"}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-center">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Today&apos;s Lectures</div>
                <div className="text-lg font-bold text-slate-900">{todaySchedule.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule & Attendance Trigger Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Today&apos;s Timetable &amp; Attendance
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Official Academic Timetable
            </span>
          </div>

          <TeacherScheduleClient schedule={todaySchedule} />
        </div>
      </main>
    </div>
  );
}
