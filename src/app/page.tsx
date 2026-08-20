import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { UserRole } from "@/generated/prisma/enums";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === UserRole.ADMIN) {
    redirect("/admin/verification");
  }

  if (user.teacher) {
    redirect("/teacher/dashboard");
  }

  if (user.student) {
    redirect("/student/dashboard");
  }

  redirect("/onboarding");
}
