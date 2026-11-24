"use client";

import { useRef, useState } from "react";
import { CameraIcon, CheckIcon, CloseIcon, AlertIcon } from "@/components/ui/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  submitContribution,
  type ContributionType,
} from "@/lib/contributions";
import type { PostOffice } from "@/types";

interface ContributeFormProps {
  office: PostOffice;
  onClose: () => void;
  onSuccess: () => void;
}

const CONTRIBUTION_OPTIONS: {
  type: ContributionType;
  label: string;
  hint: string;
}[] = [
  {
    type: "better_stamp_image",
    label: "Better stamp photo",
    hint: "Share a clearer photo of this office's PPC stamp",
  },
  {
    type: "coordinates_correction",
    label: "Fix location pin",
    hint: "The map pin is in the wrong place",
  },
  {
    type: "office_info_update",
    label: "Update office info",
    hint: "Name, pincode or district is wrong",
  },
  {
    type: "new_office_suggestion",
    label: "Suggest a new office",
    hint: "This post office should be on Philatrail",
  },
];

type SubmitState = "idle" | "loading" | "success" | "error";

export function ContributeForm({ office, onSuccess }: ContributeFormProps) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ContributionType | null>(null);
  const [note, setNote] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  function removePhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType || !user) return;
    setSubmitState("loading");
    setErrorMsg("");
    try {
      await submitContribution({
        userId: user.id,
        officeId: office.id,
        type: selectedType,
        note,
        photoFile,
      });
      setSubmitState("success");
      setTimeout(onSuccess, 1800);
    } catch (err) {
      setSubmitState("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    }
  }

  if (submitState === "success") {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <span className="mb-4 grid size-14 place-items-center rounded-full bg-visited-soft">
          <CheckIcon className="size-7 text-visited-ink" strokeWidth={2.5} />
        </span>
        <p className="text-[17px] font-semibold">Thanks for your help!</p>
        <p className="mt-1.5 max-w-[260px] text-sm leading-[20px] text-muted">
          We&apos;ll review your contribution and update the app.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      {/* Type picker */}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
          What would you like to contribute?
        </p>
        {CONTRIBUTION_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => setSelectedType(opt.type)}
            className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
              selectedType === opt.type
                ? "border-[#2f4aa8]/40 bg-[#2f4aa8]/[0.06]"
                : "border-ink/[0.08] bg-ink/[0.015] active:bg-ink/[0.04]"
            }`}
          >
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selectedType === opt.type
                  ? "border-[#2f4aa8] bg-[#2f4aa8]"
                  : "border-ink/30"
              }`}
            >
              {selectedType === opt.type && (
                <CheckIcon className="size-3 text-white" strokeWidth={3} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold leading-5">{opt.label}</p>
              <p className="mt-0.5 text-[12px] leading-4 text-muted">{opt.hint}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Photo attach (only relevant for stamp or new office) */}
      {(selectedType === "better_stamp_image" ||
        selectedType === "new_office_suggestion") && (
        <div>
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
            Photo (optional)
          </p>
          {photoPreview ? (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Selected"
                className="max-h-[180px] rounded-2xl border border-ink/10 object-contain"
              />
              <button
                type="button"
                onClick={removePhoto}
                aria-label="Remove photo"
                className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-white shadow-md"
              >
                <CloseIcon className="size-[10px]" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[72px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/20 text-[13px] font-semibold text-muted transition-colors active:bg-ink/[0.03]"
            >
              <CameraIcon className="size-5" strokeWidth={1.5} />
              Attach a photo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePhotoChange}
          />
        </div>
      )}

      {/* Note */}
      <div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
          Note (optional)
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any extra detail that helps us review your contribution…"
          rows={3}
          className="w-full resize-none rounded-2xl border border-ink/[0.08] bg-ink/[0.015] p-3.5 text-sm leading-[21px] outline-none placeholder:text-muted/60 focus:border-[#2f4aa8]/40 focus:ring-1 focus:ring-[#2f4aa8]/20"
        />
      </div>

      {/* Error */}
      {submitState === "error" && (
        <p className="animate-fade-in flex items-start gap-2 rounded-xl bg-warn-soft p-3 text-sm text-warn">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {errorMsg}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!selectedType || submitState === "loading"}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-[28px] bg-gradient-to-b from-[#2f4aa8] to-[#243a8a] text-base font-bold uppercase tracking-[0.12em] text-white shadow-[inset_0_1.5px_0_rgb(255_255_255/0.2),0_6px_14px_-6px_rgba(47,74,168,0.5)] disabled:opacity-40"
      >
        {submitState === "loading" ? (
          <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          "Send contribution"
        )}
      </button>
    </form>
  );
}
