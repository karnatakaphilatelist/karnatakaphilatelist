import type { Metadata } from "next";
import { StateOfficesPage } from "@/components/seo/StateOfficesPage";
import { OG_IMAGE } from "@/lib/constants";
import { getPostOffices } from "@/lib/offices";
import { passportStateFor } from "@/lib/passport-states";

const state = passportStateFor("TN")!;

export async function generateMetadata(): Promise<Metadata> {
  const offices = await getPostOffices();
  const count = offices.filter((office) => office.state === state.code).length;
  const title = `${state.name} Philately Passport: all ${count} post offices`;
  const description = `All ${count} post offices in the ${state.name} Philately Passport from ${state.circle}, by district, with pincodes. Pick one, visit it and collect its postmark.`;
  return {
    title,
    description,
    alternates: { canonical: state.officesPath },
    openGraph: {
      type: "website",
      title,
      description,
      url: state.officesPath,
      siteName: "Philatrail",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}

export default async function Page() {
  return <StateOfficesPage state={state} offices={await getPostOffices()} />;
}
