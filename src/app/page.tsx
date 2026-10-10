import { Suspense } from "react";
import { ExploreView } from "@/components/explore/ExploreView";
import { getPostOffices } from "@/lib/offices";

export default function ExplorePage(props: PageProps<"/">) {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ExploreContent({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const [offices, { office }] = await Promise.all([getPostOffices(), searchParams]);
  const requestedId = Number(Array.isArray(office) ? office[0] : office);

  return (
    <ExploreView
      offices={offices}
      initialSelectedId={Number.isInteger(requestedId) ? requestedId : null}
    />
  );
}

function ExploreSkeleton() {
  return (
    <div role="status" className="grid h-full place-items-center text-muted">
      Loading post offices…
    </div>
  );
}
