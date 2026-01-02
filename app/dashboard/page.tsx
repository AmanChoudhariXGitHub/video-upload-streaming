import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { UserDashboard } from "@/components/user-dashboard"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role === "admin") {
    redirect("/admin")
  }

  return <UserDashboard />
}
