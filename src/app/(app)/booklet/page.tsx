import type { Metadata } from "next";
import { BookletGuide } from "@/components/booklet/BookletGuide";

export const metadata: Metadata = {
  title: "Get the Philately Passport booklet",
  description:
    "What the Philately Passport is, where to buy it in Karnataka, and who to ask.",
};

export default function BookletPage() {
  return <BookletGuide />;
}
