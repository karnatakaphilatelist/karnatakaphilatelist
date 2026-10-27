import { cacheLife, cacheTag } from "next/cache";
import snapshot from "@/data/post-offices.snapshot.json";
import { formatPlaceName } from "@/lib/format";
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

/**
 * A copy of the list that ships with the app. It is used only when the database
 * cannot be reached (for example a free Supabase project that has paused), so a
 * deploy or a page view never fails just because the database is asleep.
 * Refresh it by exporting `post_offices` (see docs/SETUP.md).
 */
const SNAPSHOT_ROWS: PostOfficeRow[] = snapshot;

export function toPostOffice(row: PostOfficeRow): PostOffice {
  return {
    id: row.id,
    name: formatPlaceName(row.name),
    pincode: row.pincode == null ? "" : String(row.pincode),
    district: row.district ? formatPlaceName(row.district) : "Unknown district",
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

async function loadFromDatabase(): Promise<PostOfficeRow[]> {
  let result = await selectPostOffices(`${BASE_COLUMNS}, stamp_image_path`);
  // Keep the app working before the stamp-images migration has been run.
  if (result.error?.code === UNDEFINED_COLUMN) {
    result = await selectPostOffices(BASE_COLUMNS);
  }

  if (result.error) {
    throw new Error(`Could not load post offices: ${result.error.message}`);
  }
  if (result.data.length === 0) {
    throw new Error("Could not load post offices: the table returned no rows");
  }
  return result.data;
}

/**
 * The master list of passport post offices. It changes rarely, so the result
 * is cached; call `revalidateTag("post-offices")` after editing the table.
 *
 * If the database cannot be reached, the bundled copy is returned instead and
 * cached only briefly, so fresh data is picked up again as soon as the
 * database is back.
 */
export async function getPostOffices(): Promise<PostOffice[]> {
  "use cache";
  cacheTag("post-offices");

  let rows: PostOfficeRow[];
  try {
    rows = await loadFromDatabase();
    cacheLife("hours");
  } catch (error) {
    console.error(
      "[offices] Database unavailable, showing the bundled list of post offices.",
      error,
    );
    cacheLife("minutes");
    rows = SNAPSHOT_ROWS;
  }

  return rows.map(toPostOffice).sort((a, b) => a.name.localeCompare(b.name, "en"));
}
