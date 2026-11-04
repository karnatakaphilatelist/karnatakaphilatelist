import { ExploreHost } from "@/components/explore/ExploreHost";
import { getPostOffices } from "@/lib/offices";

/** Fetches the (cached) post office list for the always-mounted map screen. */
export async function ExploreHostLoader() {
  return <ExploreHost offices={await getPostOffices()} />;
}
