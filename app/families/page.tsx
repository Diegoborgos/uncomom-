import { redirect } from "next/navigation"

export default function FamiliesRedirect() {
  redirect("/community?tab=people")
}
