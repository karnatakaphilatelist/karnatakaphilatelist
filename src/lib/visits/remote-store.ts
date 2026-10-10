import type { SupabaseClient } from "@supabase/supabase-js";
import type { Visit } from "@/types";

export const PHOTO_BUCKET = "stamp-photos";

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

/** Inserts or updates the user's visit for one office. */
export async function saveVisit(
  client: SupabaseClient,
  userId: string,
  visit: Visit,
): Promise<void> {
  const { error } = await client
    .from("visits")
    .upsert(toRow(userId, visit), { onConflict: "user_id,post_office_id" });
  if (error) throw new Error(error.message);
}

export async function saveVisits(
  client: SupabaseClient,
  userId: string,
  visits: Visit[],
): Promise<void> {
  if (visits.length === 0) return;
  const { error } = await client
    .from("visits")
    .upsert(
      visits.map((visit) => toRow(userId, visit)),
      { onConflict: "user_id,post_office_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
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
