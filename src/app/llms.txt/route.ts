import { SITE_URL } from "@/lib/constants";
import { ARTICLES } from "@/lib/learn-articles";

export const dynamic = "force-static";

/** A plain-text guide to the site for AI assistants (llmstxt.org convention). */
export function GET() {
  const learn = ARTICLES.map(
    (a) => `- [${a.title}](${SITE_URL}/learn/${a.slug}): ${a.summary}`
  ).join("\n");
  const body = `# Philatrail

> Philatrail is a free map and tracker for India Post's Philately Passport, a booklet of post offices at historical and tourist places. Collectors find the offices, visit them and track the pictorial postmarks they have collected. Built by Bhavishya, an independent collector. Not affiliated with India Post.

## Passport guides
- [Karnataka Philately Passport](${SITE_URL}/karnataka-philately-passport): the 100 Karnataka post offices, how the booklet works and a map.
- [Tamil Nadu Philately Passport](${SITE_URL}/tamil-nadu-philately-passport): the 58 Tamil Nadu post offices and a map.
- [All post offices](${SITE_URL}/offices): every office by state and district, with pincode.

## Learn
${learn}

## Notes
- Opening hours and stock change; check with the post office before travelling.
- Contact: ${SITE_URL}/contact
`;
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
