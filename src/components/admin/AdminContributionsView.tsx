"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  checkIsAdmin,
  listContributions,
  reviewContribution,
  type ContributionRow,
  type ContributionStatus,
} from "@/lib/admin-contributions";
import { CheckIcon, CloseIcon, AlertIcon } from "@/components/ui/icons";

const TYPE_LABELS: Record<ContributionRow["type"], string> = {
  better_stamp_image: "Better stamp photo",
  coordinates_correction: "Fix location pin",
  office_info_update: "Update office info",
  new_office_suggestion: "Suggest a new office",
};

const TABS: { status: ContributionStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
];

export function AdminContributionsView() {
  const { user, isLoading: authLoading } = useAuth();
  const [access, setAccess] = useState<"checking" | "denied" | "granted">("checking");
  const [rows, setRows] = useState<ContributionRow[] | null>(null);
  const [tab, setTab] = useState<ContributionStatus>("pending");
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<number | null>(null);

  const load = useCallback(() => {
    listContributions()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load contributions."));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccess("denied");
      return;
    }
    checkIsAdmin(user.id).then((ok) => {
      setAccess(ok ? "granted" : "denied");
      if (ok) load();
    });
  }, [authLoading, user, load]);

  async function handleReview(id: number, status: "approved" | "rejected") {
    if (!user) return;
    setWorkingId(id);
    setError("");
    try {
      await reviewContribution(id, status, user.id);
      setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, status } : r)) : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that contribution.");
    } finally {
      setWorkingId(null);
    }
  }

  if (access === "checking" || authLoading) {
    return <p className="p-6 text-sm text-muted">Checking access…</p>;
  }

  if (access === "denied") {
    return (
      <div className="p-6">
        <p className="text-[15px] font-semibold">Not available</p>
        <p className="mt-1 text-sm text-muted">
          This page is for reviewing contributions and is restricted to admin accounts.
        </p>
      </div>
    );
  }

  const visible = (rows ?? []).filter((r) => r.status === tab);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">Contributions</p>
        <h1 className="text-xl font-bold">Review submissions</h1>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            onClick={() => setTab(t.status)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.status ? "bg-postal text-white" : "bg-ink/[0.05] text-ink"
            }`}
          >
            {t.label}
            {rows && t.status === "pending" && rows.filter((r) => r.status === "pending").length > 0
              ? ` (${rows.filter((r) => r.status === "pending").length})`
              : ""}
          </button>
        ))}
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl bg-warn-soft p-3 text-sm text-warn">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {rows === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted">Nothing here.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((row) => (
            <div key={row.id} className="rounded-2xl border border-ink/[0.08] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold">{TYPE_LABELS[row.type]}</p>
                  <p className="text-[12px] text-muted">
                    {row.office ? `${row.office.name}${row.office.district ? ` · ${row.office.district}` : ""}` : "No office linked"}
                    {" · "}
                    {new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                {tab === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={workingId === row.id}
                      onClick={() => handleReview(row.id, "approved")}
                      aria-label="Approve"
                      className="grid size-9 place-items-center rounded-full bg-visited-soft text-visited-ink disabled:opacity-40"
                    >
                      <CheckIcon className="size-4" strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      disabled={workingId === row.id}
                      onClick={() => handleReview(row.id, "rejected")}
                      aria-label="Reject"
                      className="grid size-9 place-items-center rounded-full bg-warn-soft text-warn disabled:opacity-40"
                    >
                      <CloseIcon className="size-4" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
              {row.note && <p className="mt-2 text-sm leading-[20px]">{row.note}</p>}
              {row.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.photo_url}
                  alt="Contribution"
                  className="mt-3 max-h-[220px] rounded-xl border border-ink/10 object-contain"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
