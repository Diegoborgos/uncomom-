import { redirect } from "next/navigation"

export default function KidsFinderRedirect() {
  redirect("/community?tab=kids")
}
