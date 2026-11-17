import type { Metadata } from "next";
import { LearnGuide } from "@/components/learn/LearnGuide";

const TITLE = "Philately in Karnataka: a beginner's guide";
const DESCRIPTION =
  "What philately is, how Karnataka's Philately Passport works, where to get the booklet and who to ask.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/learn" },
  openGraph: {
    type: "article",
    title: TITLE,
    description: DESCRIPTION,
    url: "/learn",
    siteName: "Philatrail",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function LearnPage() {
  return <LearnGuide />;
}
