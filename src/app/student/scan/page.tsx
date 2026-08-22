import { requireLinkedStudent } from "@/lib/auth/dal";
import { ScannerClient } from "./scanner-client";

export default async function StudentScanPage() {
  const user = await requireLinkedStudent();
  const student = user.student!;

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
                Scan Attendance
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {student.fullName} • Div {student.division.name} ({student.batch.name})
              </p>
            </div>
          </div>

          <a
            href="/student/dashboard"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </header>

      {/* Main Scanner Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ScannerClient />
      </main>
    </div>
  );
}
