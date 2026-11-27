import type { Metadata } from "next";
import { ContactView } from "@/components/contact/ContactView";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Contact Philatrail: report a wrong post office detail, ask a question or share feedback.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactView />;
}
