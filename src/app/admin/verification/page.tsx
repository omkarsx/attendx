import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { getPendingClaims } from "@/lib/auth/claims";
import { AttendXMark } from "@/components/brand/logo";
import { ClaimActionButtons } from "./claim-actions-client";

export default async function AdminVerificationPage() {
  const admin = await requireAdmin();
  const pendingClaims = await getPendingClaims();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Navigation Bar */}
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
                Identity Verification &amp; Account Binding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/verification"
              className="text-xs font-bold text-[#0F172A] bg-slate-100 px-3 py-2 rounded-lg border border-slate-200"
            >
              Identity Verification
            </Link>
            <Link
              href="/admin/attendance"
              className="text-xs font-semibold text-slate-600 hover:text-[#0F172A] px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Attendance Engine
            </Link>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">{admin.name || "Administrator"}</div>
              <div className="text-[11px] text-slate-500">{admin.email}</div>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Pending Profile Claims ({pendingClaims.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review and approve incoming Google account bindings against official roster and faculty master records.
            </p>
          </div>
        </div>

        {pendingClaims.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No Pending Claims
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All submitted student and faculty identity claims have been reviewed and resolved.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-4">
                      Applicant Google Identity
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Target Academic Record
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Submitted At
                    </th>
                    <th scope="col" className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingClaims.map((claim) => (
                    <tr key={claim.logId} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {claim.requesterUser.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={claim.requesterUser.image}
                              alt=""
                              className="w-9 h-9 rounded-full border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {claim.requesterUser.email[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">
                              {claim.requesterUser.name || "Unknown Name"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {claim.requesterUser.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            claim.type === "STUDENT"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {claim.type}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {claim.entityDetails.fullName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {claim.entityDetails.identifier}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {claim.entityDetails.secondaryInfo}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(claim.createdAt).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <ClaimActionButtons
                          logId={claim.logId}
                          type={claim.type}
                          requesterEmail={claim.requesterUser.email}
                          entityName={claim.entityDetails.fullName}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
