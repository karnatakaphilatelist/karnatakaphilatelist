/**
 * Where the Philately Passport booklet is sold, as reported in news coverage in October 2026
 * (see the project's philately glossary). Re-check with the bureau before changing anything here.
 */
export interface BookletOutlet {
  name: string;
  note: string;
  /** What to type into a maps search to land on the right counter. */
  mapQuery: string;
}

export const BOOKLET_OUTLETS: BookletOutlet[] = [
  {
    name: "Bengaluru GPO",
    note: "Philatelic Bureau, Ambedkar Veedhi, 560001",
    mapQuery: "Bengaluru GPO Philatelic Bureau Ambedkar Veedhi",
  },
  {
    name: "Mysuru Head Post Office",
    note: "Mysuru, 570001",
    mapQuery: "Mysuru Head Post Office 570001",
  },
  {
    name: "Mangaluru Head Post Office",
    note: "Mangaluru",
    mapQuery: "Mangaluru Head Post Office",
  },
  {
    name: "Belagavi Head Post Office",
    note: "Belagavi, 590001",
    mapQuery: "Belagavi Head Post Office 590001",
  },
];

/** The Bengaluru GPO Philatelic Bureau's email, as printed in Deccan Herald. Confirm before launch. */
export const BUREAU_EMAIL = "philatelybggpo.ka@indiapost.gov.in";

export const BOOKLET_PRICE_NOTE = "about ₹600";

export function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}
