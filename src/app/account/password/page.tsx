import type { Metadata } from "next";
import { SetPasswordView } from "@/components/auth/SetPasswordView";

export const metadata: Metadata = { title: "Set a password" };

export default function SetPasswordPage() {
  return <SetPasswordView />;
}
