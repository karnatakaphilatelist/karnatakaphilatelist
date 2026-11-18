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
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "Philatrail",
              url: SITE_URL,
              description:
                "Philatrail is an independent app that helps collectors use the Philately Passport booklets. It is not affiliated with India Post.",
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/icon-512.png`,
                width: 512,
                height: 512,
              },
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: SITE_URL,
              name: "Philatrail",
              inLanguage: "en-IN",
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
            {
              "@type": "WebApplication",
              "@id": `${SITE_URL}/#app`,
              name: "Philatrail",
              url: SITE_URL,
              description:
                "A free map and tracker for the Philately Passport booklets sold by postal circles. Live in Karnataka (100 post offices) and Tamil Nadu (58 post offices). You collect each postmark in person at the post office. Philatrail is an independent project, not affiliated with India Post.",
              applicationCategory: "TravelApplication",
              operatingSystem: "Web, Android",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }}
      />
      <Landing offices={offices} />
    </>
  );
}
