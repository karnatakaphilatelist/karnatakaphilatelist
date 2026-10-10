"use client";

import Link from "next/link";
import { useState } from "react";
import { VisitDialog } from "@/components/office/VisitDialog";
import { DistrictProgress } from "@/components/passport/DistrictProgress";
import { ProgressRing } from "@/components/passport/ProgressRing";
import { VisitedCard } from "@/components/passport/VisitedCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import type { PostOffice } from "@/types";

const UP_NEXT_COUNT = 3;

export function PassportView({ offices }: { offices: PostOffice[] }) {
  const { user, isLoading: isAuthLoading, openSignIn } = useAuth();
  const { visits, isReady } = useVisits();
  const [editingId, setEditingId] = useState<number | null>(null);

  const total = offices.length;
  const visitedOffices = offices.filter((office) => visits[office.id]);
  const upNext = offices.filter((office) => !visits[office.id]).slice(0, UP_NEXT_COUNT);
  const editingOffice = offices.find((office) => office.id === editingId) ?? null;

  if (!isReady) {
    return (
      <div role="status" className="grid h-full place-items-center text-muted">
        Loading your passport…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 pb-10 pt-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">My Passport</h1>
        <p className="mt-1 text-sm text-muted">Every stamp you collect, in one place.</p>

        {!user && !isAuthLoading ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-planned-soft p-3.5">
            <p className="flex-1 text-sm leading-[18px] text-[#4a3600]">
              You&apos;re browsing as a guest. Sign in to keep your passport on every device.
            </p>
            <button
              type="button"
              onClick={() => openSignIn("manual")}
              className="min-h-11 shrink-0 rounded-full bg-ink px-4 text-sm font-semibold text-white"
            >
              Sign in
            </button>
          </div>
        ) : null}

        <section
          aria-label="Overall progress"
          className="mt-4 flex items-center gap-5 rounded-3xl bg-white p-5 shadow-sm"
        >
          <ProgressRing visited={visitedOffices.length} total={total} />
          <div>
            <p className="flex items-baseline gap-1.5 whitespace-nowrap font-display font-bold leading-none">
              <span className="text-4xl">{visitedOffices.length}</span>
              <span className="text-lg font-semibold text-muted">of {total}</span>
            </p>
            <p className="mt-1 text-sm text-muted">post offices stamped</p>
            <p className="mt-2 text-sm font-semibold text-visited-ink">
              {total - visitedOffices.length} to go
            </p>
          </div>
        </section>

        {upNext.length > 0 ? (
          <section aria-labelledby="up-next-heading" className="mt-7">
            <h2 id="up-next-heading" className="font-display text-xl font-bold">
              Up next
            </h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {upNext.map((office) => (
                <Link
                  key={office.id}
                  href={`/?office=${office.id}`}
                  className="flex min-h-11 items-center rounded-full border-[1.5px] border-postal bg-white px-4 text-sm font-semibold text-postal-dark"
                >
                  {office.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="visited-heading" className="mt-7">
          <h2 id="visited-heading" className="font-display text-xl font-bold">
            Visited
          </h2>
          {visitedOffices.length === 0 ? (
            <div className="mt-2.5 rounded-2xl bg-white p-6 text-center text-muted">
              <p>No stamps yet. Find a post office and tap Mark as visited.</p>
              <Link
                href="/"
                className="mt-3.5 inline-flex min-h-12 items-center rounded-full bg-postal px-6 text-base font-semibold text-white"
              >
                Open the map
              </Link>
            </div>
          ) : (
            <ul className="mt-2.5 space-y-3">
              {visitedOffices.map((office) => (
                <VisitedCard
                  key={office.id}
                  office={office}
                  visit={visits[office.id]}
                  onEdit={setEditingId}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="districts-heading" className="mt-7">
          <h2 id="districts-heading" className="font-display text-xl font-bold">
            By district
          </h2>
          <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
            <DistrictProgress offices={offices} visits={visits} />
          </div>
        </section>
      </div>

      <VisitDialog office={editingOffice} onClose={() => setEditingId(null)} />
    </div>
  );
}
