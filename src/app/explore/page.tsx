import { Suspense } from "react";
import { ExploreView } from "@/components/explore/ExploreView";
import { getPostOffices } from "@/lib/offices";

export default function ExplorePage(props: PageProps<"/explore">) {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ExploreContent({
  searchParams,
}: {
  searchParams: PageProps<"/explore">["searchParams"];
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
    <div role="status" className="h-full space-y-3 p-4 text-muted">
      <div className="h-13 animate-pulse rounded-full bg-sand" />
      <div className="h-[55%] animate-pulse rounded-2xl bg-sand" />
      <p className="text-center text-sm">Loading post offices…</p>
    </div>
  );
}
