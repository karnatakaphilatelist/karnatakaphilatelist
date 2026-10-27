import type { User } from "@supabase/supabase-js";

type DisplayableUser = Pick<User, "email" | "user_metadata">;

const MAX_NAME_LENGTH = 200;
const MAX_AVATAR_URL_LENGTH = 2048;

function metadataString(user: DisplayableUser, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = (user.user_metadata as Record<string, unknown> | undefined)?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** The person's name from Google, else their email address. */
export function getDisplayName(user: DisplayableUser): string | null {
  const name = metadataString(user, "full_name", "name");
  return name ? name.slice(0, MAX_NAME_LENGTH) : (user.email ?? null);
}

/** The profile photo, only if it is a plain https URL (sign-up data is not trusted). */
export function getAvatarUrl(user: DisplayableUser): string | null {
  const url = metadataString(user, "avatar_url", "picture");
  if (!url || url.length > MAX_AVATAR_URL_LENGTH) return null;
  return /^https:\/\//i.test(url) ? url : null;
}

/** One capital letter to show when there is no photo. */
export function getInitial(user: DisplayableUser): string {
  const label = getDisplayName(user);
  return label ? label.charAt(0).toUpperCase() : "?";
}

/** The first word of the person's name, for a friendly greeting. Null when there is only an email. */
export function getFirstName(user: DisplayableUser): string | null {
  const name = metadataString(user, "full_name", "name");
  const first = name?.split(/\s+/)[0];
  return first ? first.slice(0, 40) : null;
}
