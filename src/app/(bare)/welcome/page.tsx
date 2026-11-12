import type { Metadata } from "next";
import { WelcomeTour } from "@/components/welcome/WelcomeTour";

export const metadata: Metadata = { title: "Welcome" };

export default function WelcomePage() {
  return <WelcomeTour />;
}
