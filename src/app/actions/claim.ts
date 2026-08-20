"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin } from "@/lib/auth/dal";
import {
  submitStudentClaim,
  submitTeacherClaim,
  approveStudentClaim,
  approveTeacherClaim,
  rejectClaim,
} from "@/lib/auth/claims";

export async function submitStudentClaimAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth();
  const prn = formData.get("prn") as string;
  const rollNumber = formData.get("rollNumber") as string;

  const result = await submitStudentClaim(user.id, prn, rollNumber);
  revalidatePath("/onboarding");
  return result;
}

export async function submitTeacherClaimAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth();
  const employeeCode = formData.get("employeeCode") as string;

  const result = await submitTeacherClaim(user.id, employeeCode);
  revalidatePath("/onboarding");
  return result;
}

export async function approveStudentClaimAction(
  logId: string,
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdmin();
  const result = await approveStudentClaim(admin.id, logId);
  revalidatePath("/admin/verification");
  return result;
}

export async function approveTeacherClaimAction(
  logId: string,
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdmin();
  const result = await approveTeacherClaim(admin.id, logId);
  revalidatePath("/admin/verification");
  return result;
}

export async function rejectClaimAction(
  logId: string,
  reason?: string,
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdmin();
  const result = await rejectClaim(admin.id, logId, reason);
  revalidatePath("/admin/verification");
  return result;
}
