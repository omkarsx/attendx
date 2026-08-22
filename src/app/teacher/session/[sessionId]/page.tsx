import { redirect } from "next/navigation";
import { requireLinkedTeacher } from "@/lib/auth/dal";
import { getLiveSessionDetails } from "@/lib/attendance/session";
import { prisma } from "@/lib/prisma";
import { generateSignedQrPayload, generateQrDataUrl } from "@/lib/attendance/token";
import { SessionLiveClient } from "./session-live-client";
import { AttendXMark } from "@/components/brand/logo";

interface TeacherSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function TeacherSessionPage({
  params,
}: TeacherSessionPageProps) {
  const user = await requireLinkedTeacher();
  const { sessionId } = await params;

  const session = await getLiveSessionDetails(sessionId, user.teacher!.id);

  if (!session) {
    redirect("/teacher/dashboard");
  }

  let qrDataUrl: string | null = null;
  if (session.status === "ACTIVE") {
    const rawSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (rawSession) {
      const qrPayload = await generateSignedQrPayload(
        session.id,
        rawSession.qrTokenHash,
        session.expiresAt,
      );
      qrDataUrl = await generateQrDataUrl(qrPayload);
    }
  }

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
                <span className="text-xs font-semibold text-slate-700">Live Monitor</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {session.courseCode} • {session.courseName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">{user.teacher!.fullName}</div>
              <div className="text-[11px] text-slate-500">{user.teacher!.department.name}</div>
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

      {/* Main Live Monitor Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SessionLiveClient
          sessionId={session.id}
          courseCode={session.courseCode}
          courseName={session.courseName}
          entryType={session.entryType}
          divisionName={session.divisionName}
          batchName={session.batchName}
          roomName={session.roomName}
          teacherName={session.teacherName}
          initialStatus={session.status}
          expiresAt={session.expiresAt.toISOString()}
          qrDataUrl={qrDataUrl}
          initialPresentCount={session.presentCount}
          totalEligibleCount={session.totalEligibleCount}
          initialRecords={session.records.map((r) => ({
            id: r.id,
            rollNumber: r.rollNumber,
            prn: r.prn,
            fullName: r.fullName,
            batchName: r.batchName,
            markedAt: r.markedAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
