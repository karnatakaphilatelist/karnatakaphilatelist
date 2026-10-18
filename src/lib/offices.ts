import { cacheLife, cacheTag } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { PostOffice } from "@/types";

/** Shape of a row in the `post_offices` table. */
interface PostOfficeRow {
  id: number;
  name: string;
  pincode: string | number | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  /** Absent until the stamp-images migration has been run. */
  stamp_image_path?: string | null;
}

const BASE_COLUMNS = "id, name, pincode, district, lat, lng";
/** Postgres error code for "column does not exist". */
const UNDEFINED_COLUMN = "42703";

function toPostOffice(row: PostOfficeRow): PostOffice {
  return {
    id: row.id,
    name: row.name,
    pincode: row.pincode == null ? "" : String(row.pincode),
    district: row.district ?? "Unknown district",
    lat: row.lat,
    lng: row.lng,
    stampImagePath: row.stamp_image_path ?? null,
  };
}

async function selectPostOffices(columns: string) {
  return createSupabasePublicClient()
    .from("post_offices")
    .select(columns)
    .order("name")
    .overrideTypes<PostOfficeRow[], { merge: false }>();
}

/**
 * The master list of passport post offices. It changes rarely, so the result
 * is cached; call `revalidateTag("post-offices")` after editing the table.
 */
export async function getPostOffices(): Promise<PostOffice[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("post-offices");

  let result = await selectPostOffices(`${BASE_COLUMNS}, stamp_image_path`);
  // Keep the app working before the stamp-images migration has been run.
  if (result.error?.code === UNDEFINED_COLUMN) {
    result = await selectPostOffices(BASE_COLUMNS);
  }

  if (result.error) {
    throw new Error(`Could not load post offices: ${result.error.message}`);
  }
  return result.data.map(toPostOffice);
}
