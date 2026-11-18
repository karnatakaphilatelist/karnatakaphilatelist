"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ContributionType =
  | "better_stamp_image"
  | "coordinates_correction"
  | "office_info_update"
  | "new_office_suggestion";

export interface SubmitContributionParams {
  userId: string;
  officeId: number | null;
  type: ContributionType;
  note: string;
  photoFile?: File | null;
}

/** Upload a photo to the public contributions bucket and return its URL. */
async function uploadContributionPhoto(
  userId: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("contribution-photos")
    .upload(path, file, { upsert: false });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  const { data } = supabase.storage
    .from("contribution-photos")
    .getPublicUrl(path);
  return data.publicUrl;
}

/** Insert a contribution row for the signed-in user. */
export async function submitContribution(
  params: SubmitContributionParams
): Promise<void> {
  const { userId, officeId, type, note, photoFile } = params;
  const supabase = getSupabaseBrowserClient();

  let photoUrl: string | null = null;
  if (photoFile) {
    photoUrl = await uploadContributionPhoto(userId, photoFile);
  }

  const { error } = await supabase.from("contributions").insert({
    user_id: userId,
    office_id: officeId,
    type,
    note: note.trim() || null,
    photo_url: photoUrl,
  });
  if (error) throw new Error(error.message);
}
