import type { Metadata } from "next";
import { Suspense } from "react";
import { PassportView } from "@/components/passport/PassportView";
import { getPostOffices } from "@/lib/offices";

export const metadata: Metadata = { title: "My Passport" };

export default function PassportPage() {
  return (
    <Suspense
      fallback={
        <div role="status" className="grid h-full place-items-center text-muted">
          Loading your passport…
        </div>
      }
    >
      <PassportContent />
    </Suspense>
  );
}

async function PassportContent() {
  const offices = await getPostOffices();
  return <PassportView offices={offices} />;
}
