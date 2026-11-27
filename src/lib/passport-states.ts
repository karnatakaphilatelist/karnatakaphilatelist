/**
 * The states whose Philately Passport Philatrail covers, with the facts the public pages share.
 * Add a state here only once its circle has a Philately Passport and its offices are loaded.
 */
export interface PassportState {
  code: string;
  /** Used in page addresses. */
  slug: string;
  name: string;
  /** The postal circle that issues the booklet. */
  circle: string;
  /** The overview page. */
  path: string;
  /** The page listing every office in the booklet. */
  officesPath: string;
}

export const PASSPORT_STATES: PassportState[] = [
  {
    code: "KA",
    slug: "karnataka",
    name: "Karnataka",
    circle: "Karnataka Postal Circle",
    path: "/karnataka-philately-passport",
    officesPath: "/karnataka-philately-passport/post-offices",
  },
  {
    code: "TN",
    slug: "tamil-nadu",
    name: "Tamil Nadu",
    circle: "Tamil Nadu Postal Circle",
    path: "/tamil-nadu-philately-passport",
    officesPath: "/tamil-nadu-philately-passport/post-offices",
  },
];

export function passportStateFor(code: string): PassportState | undefined {
  return PASSPORT_STATES.find((state) => state.code === code);
}
