import { redirect } from "next/navigation"

export default function MeetupsRedirect() {
  redirect("/community?tab=meetups")
}
