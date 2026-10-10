import { cacheLife, cacheTag } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { PostOffice } from "@/types";

/** Shape of a row in the `post_office` table. */
interface PostOfficeRow {
  id: number;
  name: string;
  pincode: string | number | null;
  district: string | null;
  lat: number | null;
  long: number | null;
}

function toPostOffice(row: PostOfficeRow): PostOffice {
  return {
    id: row.id,
    name: row.name,
    pincode: row.pincode == null ? "" : String(row.pincode),
    district: row.district ?? "Unknown district",
    lat: row.lat,
    lng: row.long,
  };
}

/**
 * The master list of passport post offices. It changes rarely, so the result
 * is cached; call `revalidateTag("post-offices")` after editing the table.
 */
export async function getPostOffices(): Promise<PostOffice[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("post-offices");

  const { data, error } = await createSupabasePublicClient()
    .from("post_office")
    .select("id, name, pincode, district, lat, long")
    .order("name")
    .overrideTypes<PostOfficeRow[], { merge: false }>();

  if (error) {
    throw new Error(`Could not load post offices: ${error.message}`);
  }
  return data.map(toPostOffice);
}
