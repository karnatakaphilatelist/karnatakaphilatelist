import type { SupabaseClient } from "@supabase/supabase-js";
import type { Visit } from "@/types";

export const PHOTO_BUCKET = "stamp-photos";

/** Postgres error code for a foreign key violation, e.g. a post office that no longer exists. */
const FOREIGN_KEY_VIOLATION = "23503";
const VISIT_CONFLICT_TARGET = "user_id,post_office_id";

/** Shape of a row in the `visits` table (see supabase/migrations). */
interface VisitRow {
  post_office_id: number;
  visited_at: string;
  note: string;
  photo_path: string | null;
  is_public: boolean;
}

const COLUMNS = "post_office_id, visited_at, note, photo_path, is_public";

function toVisit(row: VisitRow): Visit {
  return {
    officeId: row.post_office_id,
    visitedAt: row.visited_at,
    note: row.note,
    photoPath: row.photo_path,
    isPublic: row.is_public,
  };
}

function toRow(userId: string, visit: Visit) {
  return {
    user_id: userId,
    post_office_id: visit.officeId,
    visited_at: visit.visitedAt,
    note: visit.note,
    photo_path: visit.photoPath,
    is_public: visit.isPublic,
  };
}

export async function fetchVisits(
  client: SupabaseClient,
  userId: string,
): Promise<Visit[]> {
  const { data, error } = await client
    .from("visits")
    .select(COLUMNS)
    .eq("user_id", userId)
    .overrideTypes<VisitRow[], { merge: false }>();
  if (error) throw new Error(error.message);
  return data.map(toVisit);
}

/**
 * Records a first visit. If the user already has a visit for this office (for
 * example it was stamped on another device or tab), the existing row, with its
 * note and photo, is left exactly as it is.
 */
export async function insertVisitIfMissing(
  client: SupabaseClient,
  userId: string,
  visit: Visit,
): Promise<void> {
  const { error } = await client
    .from("visits")
    .upsert(toRow(userId, visit), {
      onConflict: VISIT_CONFLICT_TARGET,
      ignoreDuplicates: true,
    });
  if (error) throw new Error(error.message);
}

/**
 * Changes the note, photo and privacy of an existing visit. It never creates a
 * row, so editing a visit that was removed elsewhere fails instead of silently
 * bringing the visit back.
 */
export async function updateVisitDetails(
  client: SupabaseClient,
  userId: string,
  visit: Visit,
): Promise<void> {
  const { data, error } = await client
    .from("visits")
    .update({
      note: visit.note,
      photo_path: visit.photoPath,
      is_public: visit.isPublic,
    })
    .eq("user_id", userId)
    .eq("post_office_id", visit.officeId)
    .select("post_office_id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("This visit was removed on another device. Reload to see your latest passport.");
  }
}

/**
 * Moves a guest's visits into their account without overwriting anything the
 * account already has. If the batch is rejected because of one bad row (such as
 * a post office that has since been removed), the rest are still saved.
 */
export async function mergeGuestVisits(
  client: SupabaseClient,
  userId: string,
  visits: Visit[],
): Promise<void> {
  if (visits.length === 0) return;

  const upsertRows = (rows: Visit[]) =>
    client.from("visits").upsert(
      rows.map((visit) => toRow(userId, visit)),
      { onConflict: VISIT_CONFLICT_TARGET, ignoreDuplicates: true },
    );

  const { error } = await upsertRows(visits);
  if (!error) return;
  if (error.code !== FOREIGN_KEY_VIOLATION) throw new Error(error.message);

  const results = await Promise.all(visits.map((visit) => upsertRows([visit])));
  const failure = results
    .map((result) => result.error)
    .find((rowError) => rowError && rowError.code !== FOREIGN_KEY_VIOLATION);
  if (failure) throw new Error(failure.message);
}

export async function deleteVisit(
  client: SupabaseClient,
  userId: string,
  officeId: number,
): Promise<void> {
  const { error } = await client
    .from("visits")
    .delete()
    .eq("user_id", userId)
    .eq("post_office_id", officeId);
  if (error) throw new Error(error.message);
}

/** Uploads an already-compressed stamp photo and returns its storage path. */
export async function uploadStampPhoto(
  client: SupabaseClient,
  userId: string,
  officeId: number,
  photo: Blob,
): Promise<string> {
  const path = `${userId}/${officeId}-${Date.now()}.jpg`;
  const { error } = await client.storage
    .from(PHOTO_BUCKET)
    .upload(path, photo, { contentType: "image/jpeg" });
  if (error) throw new Error(error.message);
  return path;
}

export async function removeStampPhoto(
  client: SupabaseClient,
  path: string,
): Promise<void> {
  const { error } = await client.storage.from(PHOTO_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
