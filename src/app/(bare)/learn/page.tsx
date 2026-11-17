import type { Metadata } from "next";
import { Learn } from "@/components/learn/Learn";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return <Learn />;
}
