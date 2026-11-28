"use client";

import { usePublicNotes } from "@/hooks/usePublicNotes";
import { PublicNoteRow } from "@/components/office/PublicNoteRow";

/** What collectors chose to share about one office, for anyone to read: no sign-in needed. */
export function PublicNotes({ officeId }: { officeId: number }) {
  const notes = usePublicNotes(officeId);
  if (!notes || notes.length === 0) return null;
  return (
    <section className="mt-8" aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="font-display text-xl font-bold">
        Notes from collectors
      </h2>
      <div className="mt-2">
        {notes.map((note) => (
          <PublicNoteRow key={note.userId} note={note} />
        ))}
      </div>
    </section>
  );
}
