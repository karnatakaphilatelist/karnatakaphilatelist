"use client";

import { CloseIcon } from "@/components/ui/icons";
import { ContributeForm } from "@/components/contribute/ContributeForm";
import { useAuth } from "@/components/providers/AuthProvider";
import type { PostOffice } from "@/types";

interface ContributeSheetProps {
  office: PostOffice;
  onClose: () => void;
}

export function ContributeSheet({ office, onClose }: ContributeSheetProps) {
  const { user, openSignIn } = useAuth();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Contribute to Philatrail"
      className="kp-glass-panel absolute inset-x-0 bottom-0 z-[1200] flex max-h-[90%] animate-rise flex-col rounded-t-[24px]"
    >
      {/* Grab handle */}
      <div
        aria-hidden="true"
        className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[#c7c7cc] md:hidden"
      />

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h2 className="text-[17px] font-bold">Contribute</h2>
          <p className="text-[13px] text-muted">{office.name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="kp-glass grid size-8 place-items-center rounded-full text-ink"
        >
          <CloseIcon className="size-[11px]" strokeWidth={2.8} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-2">
        {user ? (
          <ContributeForm
            office={office}
            onClose={onClose}
            onSuccess={onClose}
          />
        ) : (
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <p className="text-[15px] font-semibold">Sign in to contribute</p>
            <p className="mt-1.5 max-w-[260px] text-sm leading-[20px] text-muted">
              You need an account so we can credit your contribution and reach
              you if we have questions.
            </p>
            <button
              type="button"
              onClick={() => openSignIn("manual")}
              className="mt-5 flex h-12 w-full max-w-[260px] items-center justify-center rounded-[24px] bg-gradient-to-b from-[#2f4aa8] to-[#243a8a] text-sm font-bold uppercase tracking-[0.12em] text-white"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
