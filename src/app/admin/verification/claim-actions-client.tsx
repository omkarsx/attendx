"use client";

import { useTransition, useState } from "react";
import {
  approveStudentClaimAction,
  approveTeacherClaimAction,
  rejectClaimAction,
} from "@/app/actions/claim";

interface ClaimActionButtonsProps {
  logId: string;
  type: "STUDENT" | "TEACHER";
  requesterEmail: string;
  entityName: string;
}

export function ClaimActionButtons({
  logId,
  type,
  requesterEmail,
  entityName,
}: ClaimActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleApprove = () => {
    if (
      !confirm(
        `Are you sure you want to approve linking ${requesterEmail} to ${entityName}?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const result =
          type === "STUDENT"
            ? await approveStudentClaimAction(logId)
            : await approveTeacherClaimAction(logId);

        if (result.success) {
          setStatusMessage({ type: "success", text: result.message });
        } else {
          setStatusMessage({ type: "error", text: result.message });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Approval failed";
        setStatusMessage({ type: "error", text: msg });
      }
    });
  };

  const handleReject = () => {
    const reason = prompt("Enter a reason for rejecting this claim (optional):");
    if (reason === null) return;

    startTransition(async () => {
      try {
        const result = await rejectClaimAction(logId, reason || undefined);
        if (result.success) {
          setStatusMessage({ type: "success", text: "Claim rejected." });
        } else {
          setStatusMessage({ type: "error", text: result.message });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Rejection failed";
        setStatusMessage({ type: "error", text: msg });
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {isPending ? "Processing..." : "Approve Link"}
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 disabled:opacity-50 text-xs font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Reject
        </button>
      </div>

      {statusMessage && (
        <div
          className={`text-xs p-2 rounded-md ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}
