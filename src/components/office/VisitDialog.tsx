"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useVisits } from "@/components/providers/VisitsProvider";
import { CameraIcon, GlobeIcon, LockIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { MAX_NOTE_LENGTH } from "@/lib/visits/guest-visits";
import type { PostOffice, Visit } from "@/types";

interface VisitDialogProps {
  /** The office being edited, or null when the dialog is closed. */
  office: PostOffice | null;
  onClose: () => void;
}

/** Lets the user add a note, a stamp photo and a privacy choice to a visit. */
export function VisitDialog({ office, onClose }: VisitDialogProps) {
  const { visits } = useVisits();
  const visit = office ? visits[office.id] : undefined;

  return (
    <Sheet
      open={Boolean(office && visit)}
      onClose={onClose}
      title="Your visit"
      description={office && visit ? `${office.name} · ${visit.visitedAt}` : undefined}
    >
      {/* Keyed so the form state resets for every office it is opened on. */}
      {office && visit ? (
        <VisitForm key={office.id} visit={visit} onDone={onClose} />
      ) : null}
    </Sheet>
  );
}

function VisitForm({ visit, onDone }: { visit: Visit; onDone: () => void }) {
  const { user, openSignIn } = useAuth();
  const { saveDetails } = useVisits();

  const [note, setNote] = useState(visit.note);
  const [isPublic, setIsPublic] = useState(visit.isPublic);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const savedPhotoUrl = usePhotoUrl(visit.photoPath);
  const shownPhotoUrl = previewUrl ?? (removePhoto ? null : savedPhotoUrl);
  const hasPhoto = Boolean(newPhoto) || (Boolean(visit.photoPath) && !removePhoto);

  // Free the temporary preview URL when it is replaced or the form closes.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setNewPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemovePhoto(false);
  }

  function handleRemovePhoto() {
    setNewPhoto(null);
    setPreviewUrl(null);
    setRemovePhoto(true);
  }

  async function handleSave() {
    setIsSaving(true);
    const saved = await saveDetails(visit.officeId, {
      note,
      isPublic,
      newPhoto,
      removePhoto,
    });
    setIsSaving(false);
    if (saved) onDone();
  }

  return (
    <div>
      <label htmlFor="visit-note" className="block text-sm font-bold">
        Note
      </label>
      <textarea
        id="visit-note"
        value={note}
        maxLength={MAX_NOTE_LENGTH}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Special cancellation? Counter timing? Anything to remember."
        className="mt-1.5 h-24 w-full resize-none rounded-sm border border-line-strong p-3 text-base"
      />

      <p className="mt-4 text-sm font-bold">Photo of your stamp</p>
      {!user ? (
        <button
          type="button"
          onClick={() => openSignIn("manual")}
          className="mt-1.5 flex min-h-16 w-full items-center justify-center gap-2 rounded-sm border-[1.5px] border-dashed border-line-strong bg-paper px-4 text-base font-semibold"
        >
          <CameraIcon className="size-5" />
          Sign in to add photos
        </button>
      ) : hasPhoto ? (
        <div className="mt-1.5 flex items-center gap-3 rounded-sm border border-line-strong p-2">
          {shownPhotoUrl ? (
            // A signed or blob URL: next/image cannot optimise either, so a plain img is correct here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownPhotoUrl}
              alt="Your stamp"
              className="size-14 rounded-sm object-cover"
            />
          ) : (
            <span className="grid size-14 place-items-center rounded-sm bg-sand text-muted">
              <CameraIcon className="size-5" />
            </span>
          )}
          <span className="flex-1 text-sm font-semibold">Stamp photo added</span>
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="min-h-11 px-3 text-sm font-semibold text-postal-dark"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="mt-1.5 flex min-h-16 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border-[1.5px] border-dashed border-line-strong bg-paper px-4 text-base font-semibold">
          <CameraIcon className="size-5" />
          Take or upload a photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="sr-only"
          />
        </label>
      )}

      <fieldset className="mt-4">
        <legend className="text-sm font-bold">Who can see this</legend>
        <div className="mt-1.5 flex gap-1 rounded-sm bg-sand p-1">
          <VisibilityOption
            checked={!isPublic}
            onSelect={() => setIsPublic(false)}
            label="Private"
            icon={<LockIcon className="size-4" />}
          />
          <VisibilityOption
            checked={isPublic}
            onSelect={() => setIsPublic(true)}
            label="Public"
            icon={<GlobeIcon className="size-4" />}
          />
        </div>
        <p className="mt-2 text-sm text-muted">
          {isPublic
            ? "Your note and photo can appear in the community gallery and on your public profile."
            : "Only you can see this note and photo."}
        </p>
      </fieldset>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-5 min-h-13 w-full rounded-sm bg-postal kp-label text-white disabled:opacity-60"
      >
        {isSaving ? "Saving…" : "Save to my passport"}
      </button>
    </div>
  );
}

interface VisibilityOptionProps {
  checked: boolean;
  onSelect: () => void;
  label: string;
  icon: ReactNode;
}

function VisibilityOption({ checked, onSelect, label, icon }: VisibilityOptionProps) {
  return (
    <label
      className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
        checked ? "bg-white border border-ink" : ""
      }`}
    >
      <input
        type="radio"
        name="visibility"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {icon}
      {label}
    </label>
  );
}
