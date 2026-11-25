import { AdminContributionsView } from "@/components/admin/AdminContributionsView";

export const metadata = {
  title: "Review contributions",
  robots: { index: false, follow: false },
};

export default function AdminContributionsPage() {
  return <AdminContributionsView />;
}
