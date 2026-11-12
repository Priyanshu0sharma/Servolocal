import { redirect } from "next/navigation";

export default function AccountProfilePage() {
  redirect("/account?tab=profile");
}
