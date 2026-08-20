"use client";

import { useState, useActionState } from "react";
import {
  submitStudentClaimAction,
  submitTeacherClaimAction,
} from "@/app/actions/claim";

export function ClaimForms() {
  const [claimType, setClaimType] = useState<"STUDENT" | "TEACHER">("STUDENT");

  const [studentState, studentAction, isStudentPending] = useActionState(
    submitStudentClaimAction,
    null,
  );

  const [teacherState, teacherAction, isTeacherPending] = useActionState(
    submitTeacherClaimAction,
    null,
  );

  return (
    <div className="space-y-6">
      {/* Type Toggle Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setClaimType("STUDENT")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            claimType === "STUDENT"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Student Identity
        </button>
        <button
          type="button"
          onClick={() => setClaimType("TEACHER")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            claimType === "TEACHER"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Faculty Identity
        </button>
      </div>

      {claimType === "STUDENT" ? (
        <form action={studentAction} className="space-y-4">
          <div>
            <label
              htmlFor="prn"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Permanent Registration Number (PRN)
            </label>
            <input
              id="prn"
              name="prn"
              type="text"
              required
              placeholder="e.g. 22459020084"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="rollNumber"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Class Roll Number
            </label>
            <input
              id="rollNumber"
              name="rollNumber"
              type="text"
              required
              placeholder="e.g. 1"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {studentState && (
            <div
              className={`p-3.5 rounded-xl text-sm ${
                studentState.success
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {studentState.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isStudentPending}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isStudentPending ? "Submitting Claim..." : "Submit Student Claim"}
          </button>
        </form>
      ) : (
        <form action={teacherAction} className="space-y-4">
          <div>
            <label
              htmlFor="employeeCode"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Faculty Employee Code
            </label>
            <input
              id="employeeCode"
              name="employeeCode"
              type="text"
              required
              placeholder="e.g. 265900563"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {teacherState && (
            <div
              className={`p-3.5 rounded-xl text-sm ${
                teacherState.success
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {teacherState.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isTeacherPending}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isTeacherPending ? "Submitting Claim..." : "Submit Faculty Claim"}
          </button>
        </form>
      )}
    </div>
  );
}
