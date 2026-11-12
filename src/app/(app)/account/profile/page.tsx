import type { Metadata } from "next";
import { EditProfileView } from "@/components/auth/EditProfileView";

export const metadata: Metadata = { title: "Edit profile" };

export default function EditProfilePage() {
  return <EditProfileView />;
}
