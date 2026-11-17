import type { Metadata } from "next";
import { LEARN_OG_IMAGE as OG_IMAGE } from "@/lib/learn-articles";
import { LearnHub } from "@/components/learn/LearnHub";

const TITLE = "Learn about philately";
const DESCRIPTION =
  "Short reads on philately, pictorial postmarks and Karnataka's Philately Passport, and how to get the booklet.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/learn" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/learn",
    siteName: "Philatrail",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function LearnPage() {
  return <LearnHub />;
}
