import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/constants";
import { getPostOffices } from "@/lib/offices";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const offices = await getPostOffices();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: SITE_URL,
              name: "Philatrail",
              inLanguage: "en-IN",
            },
            {
              "@type": "WebApplication",
              "@id": `${SITE_URL}/#app`,
              name: "Philatrail",
              url: SITE_URL,
              description:
                "A map and tracker for Karnataka's Philately Passport. An independent project, not run by India Post.",
              applicationCategory: "TravelApplication",
              operatingSystem: "Web, Android",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            },
          ],
        }}
      />
      <Landing offices={offices} />
    </>
  );
}
