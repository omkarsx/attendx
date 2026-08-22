import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/dal";
import { getUserClaimStatus } from "@/lib/auth/claims";
import { UserRole } from "@/generated/prisma/enums";
import { ClaimForms } from "./claim-forms";

export default async function OnboardingPage() {
  const user = await requireAuth();

  // If already linked, redirect immediately
  if (user.role === UserRole.ADMIN) {
    redirect("/admin/verification");
  } else if (user.teacher) {
    redirect("/teacher/dashboard");
  } else if (user.student) {
    redirect("/student/dashboard");
  }

  const claimStatus = await getUserClaimStatus(user.id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
            AX
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Account Profile Verification
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Signed in as <span className="font-semibold text-slate-700">{user.email}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-6">
          {claimStatus.hasPendingClaim ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <h3 className="text-sm font-semibold text-amber-900">
                    Verification Claim Pending
                  </h3>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Your <strong className="font-semibold">{claimStatus.type}</strong> claim was submitted on{" "}
                  {claimStatus.submittedAt ? new Date(claimStatus.submittedAt).toLocaleDateString() : "recently"}.
                  A departmental administrator will verify your identity before access is activated.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800">What happens next?</div>
                <p>1. An administrator checks your submitted identifier against the department roster.</p>
                <p>2. Once approved, your Google account will be bound to your academic record.</p>
                <p>3. You will gain immediate access to attendance and timetable features on your next visit.</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Claim Your Academic Identity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your role and provide your official identifier from the departmental records.
                </p>
              </div>

              <ClaimForms />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Need assistance? Contact HOD / Admin</span>
            <a
              href="/api/auth/logout"
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
