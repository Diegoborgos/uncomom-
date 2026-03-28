import { redirect } from "next/navigation"

// Dashboard redirects to profile for now — this will become the family hub
export default function DashboardPage() {
  redirect("/profile")
}
