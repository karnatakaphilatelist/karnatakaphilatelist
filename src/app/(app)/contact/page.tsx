import type { Metadata } from "next";
import { ContactView } from "@/components/contact/ContactView";

export const metadata: Metadata = {
  title: "Contact us",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactView />;
}
