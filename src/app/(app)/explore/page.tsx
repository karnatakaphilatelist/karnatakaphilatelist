import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Map of Karnataka's Philately Passport post offices",
  description:
    "Every post office in Karnataka's Philately Passport on one map. Search by name, district or pincode, plan visits and mark the postmarks you collect.",
  alternates: { canonical: "/explore" },
};

/**
 * The map itself lives in the app frame (see AppShell) so it stays alive between tabs;
 * this route only exists so `/explore` is a real address.
 */
export default function ExplorePage() {
  return null;
}
