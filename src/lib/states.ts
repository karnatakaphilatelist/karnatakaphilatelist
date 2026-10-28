/** States and union territories the passport can cover, keyed by the code stored in `post_offices.state_code`. */
export const STATE_NAMES: Record<string, string> = {
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CG: "Chhattisgarh",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TS: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  WB: "West Bengal",
  DL: "Delhi",
  JK: "Jammu and Kashmir",
  LA: "Ladakh",
  PY: "Puducherry",
  CH: "Chandigarh",
  AN: "Andaman and Nicobar Islands",
  DN: "Dadra and Nagar Haveli and Daman and Diu",
  LD: "Lakshadweep",
};

export const DEFAULT_STATE = "KA";

/** States announced in the app before their post offices have been added. */
export const COMING_SOON_STATES = ["TN"] as const;

export function stateName(code: string): string {
  return STATE_NAMES[code] ?? code;
}

export interface StateOption {
  code: string;
  name: string;
  /** Number of post offices listed for this state. */
  count: number;
}

/** The states that have post offices, with how many each, ordered by name. */
export function liveStates(
  offices: readonly { state: string }[]
): StateOption[] {
  const counts = new Map<string, number>();
  for (const office of offices)
    counts.set(office.state, (counts.get(office.state) ?? 0) + 1);
  return [...counts]
    .map(([code, count]) => ({ code, name: stateName(code), count }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** Picks the state to show: the stored choice if it still exists, else Karnataka, else the first. */
export function resolveState(
  stored: string | null,
  live: readonly StateOption[]
): string {
  if (stored && live.some((state) => state.code === stored)) return stored;
  if (live.some((state) => state.code === DEFAULT_STATE)) return DEFAULT_STATE;
  return live[0]?.code ?? DEFAULT_STATE;
}
