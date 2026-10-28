import type { SupabaseClient } from "@supabase/supabase-js";

const PHOTO_BUCKET = "stamp-photos";

/**
 * Permanently deletes the signed-in person's account: their stamp photos first (through the
 * storage API, so the files really go), then the account itself, which removes their visits
 * and profile. Throws a message safe to show if anything fails.
 */
export async function deleteMyAccount(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: rows, error: listError } = await supabase
    .from("visits")
    .select("photo_path")
    .eq("user_id", userId)
    .not("photo_path", "is", null);
  if (listError)
    throw new Error("Could not delete your account. Please try again.");

  const paths = (rows ?? [])
    .map((row) => row.photo_path as string)
    .filter(Boolean);
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .remove(paths);
    if (removeError)
      throw new Error("Could not delete your photos. Please try again.");
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error)
    throw new Error("Could not delete your account. Please try again.");
}
