import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Landing } from "@/components/landing/Landing";
import { INTRO_PLAYED_FLAG, SKIP_INTRO_COOKIE } from "@/lib/landing";
import type { PostOffice } from "@/types";

const auth = vi.hoisted(() => ({
  user: null as {
    email: string;
    user_metadata: Record<string, unknown>;
  } | null,
  openSignIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({ ...auth, isLoading: false }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
const visitsState = vi.hoisted(() => ({
  visits: {} as Record<number, unknown>,
}));
vi.mock("@/components/providers/VisitsProvider", () => ({
  useVisits: () => ({ visits: visitsState.visits }),
}));

const offices: PostOffice[] = [
  {
    id: 1,
    name: "Mysuru GPO",
    pincode: "570001",
    district: "Mysuru",
    state: "KA",
    lat: 12.3,
    lng: 76.6,
    stampImagePath: null,
  },
  {
    id: 2,
    name: "Hampi",
    pincode: "583239",
    district: "Vijayanagara",
    state: "KA",
    lat: 15.3,
    lng: 76.4,
    stampImagePath: null,
  },
];

function mockMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  window.sessionStorage.clear();
  delete (window as unknown as Record<string, unknown>)[INTRO_PLAYED_FLAG];
  document.cookie = `${SKIP_INTRO_COOKIE}=; Max-Age=0; path=/`;
  auth.user = null;
  visitsState.visits = {};
  mockMotion(false);
});
afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-intro-playing");
});

describe("Landing", () => {
  it("states the promise and links to the map", () => {
    render(<Landing offices={offices} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Karnataka's Philately Passport"
    );
    const links = screen.getAllByRole("link", {
      name: /open the map|explore/i,
    });
    expect(links.every((l) => l.getAttribute("href") === "/explore")).toBe(
      true
    );
  });

  it("shows the disclaimer and legal links", () => {
    render(<Landing offices={offices} />);
    expect(
      screen.getByText(/not run, endorsed or sponsored by India Post/)
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Privacy" }).getAttribute("href")
    ).toBe("/privacy");
    expect(
      screen.getByRole("link", { name: "Terms" }).getAttribute("href")
    ).toBe("/terms");
  });

  it("plays the intro for a first visit and ends it on Skip", () => {
    const { container } = render(<Landing offices={offices} />);
    const intro = container.querySelector(".kpl-intro");
    expect(intro?.getAttribute("data-state")).toBe("playing");
    expect(document.documentElement.hasAttribute("data-intro-playing")).toBe(
      true
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    });
    expect(intro?.getAttribute("data-state")).toBe("done");
    expect(document.documentElement.hasAttribute("data-intro-playing")).toBe(
      false
    );
    expect(
      (window as unknown as Record<string, unknown>)[INTRO_PLAYED_FLAG]
    ).toBe(true);
  });

  it("does not replay the intro twice in one page load", () => {
    (window as unknown as Record<string, unknown>)[INTRO_PLAYED_FLAG] = true;
    const { container } = render(<Landing offices={offices} />);
    expect(
      container.querySelector(".kpl-intro")?.getAttribute("data-state")
    ).toBe("done");
  });

  it("skips the intro right after signing in", () => {
    document.cookie = `${SKIP_INTRO_COOKIE}=1; path=/`;
    const { container } = render(<Landing offices={offices} />);
    expect(
      container.querySelector(".kpl-intro")?.getAttribute("data-state")
    ).toBe("done");
  });

  it("skips the intro when the person prefers reduced motion", () => {
    mockMotion(true);
    const { container } = render(<Landing offices={offices} />);
    expect(
      container.querySelector(".kpl-intro")?.getAttribute("data-state")
    ).toBe("done");
  });

  it("opens sign-in for a guest", () => {
    render(<Landing offices={offices} />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(auth.openSignIn).toHaveBeenCalled();
  });

  it("shows nothing in place of progress until there is real progress", () => {
    auth.user = { email: "a@b.c", user_metadata: { full_name: "Asha Rao" } };
    render(<Landing offices={offices} />);
    // No sample count, no example bar, no greeting: a visitor with no stamps is told nothing.
    expect(document.body.textContent).not.toContain("Namaskara, Asha");
    expect(screen.queryByRole("link", { name: /open my passport/i })).toBeNull();
  });

  it("greets a signed-in person and shows their real count once they have one", () => {
    auth.user = { email: "a@b.c", user_metadata: { full_name: "Asha Rao" } };
    visitsState.visits = { 1: { officeId: 1 } };
    render(<Landing offices={offices} />);
    expect(document.body.textContent).toContain("Namaskara, Asha");
    expect(screen.getByText("1 of 2")).toBeDefined();
    expect(
      screen.getByRole("link", { name: /open my passport/i }).getAttribute("href")
    ).toBe("/passport");
  });

  it("offers one Open the map button, and a secondary link to Learn", () => {
    render(<Landing offices={offices} />);
    expect(
      screen.getAllByRole("link", { name: /open the map/i })
    ).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "How it works" }).getAttribute("href")
    ).toBe("/learn");
  });

  it("links the how-it-works teaser to Learn and lists four steps", () => {
    render(<Landing offices={offices} />);
    expect(
      screen.getByRole("link", { name: /full guide on learn/i })
        .getAttribute("href")
    ).toBe("/learn");
    expect(screen.getByText("Get stamped")).toBeDefined();
  });

  it("names every live state with its office count, and marks the current one", () => {
    const multi: PostOffice[] = [
      ...offices,
      {
        id: 3,
        name: "Chennai GPO",
        pincode: "600001",
        district: "Chennai",
        state: "TN",
        lat: 13.08,
        lng: 80.27,
        stampImagePath: null,
      },
    ];
    render(<Landing offices={multi} />);
    const ka = screen.getByRole("button", { name: /karnataka/i });
    const tn = screen.getByRole("button", { name: /tamil nadu/i });
    // Both states are readable without opening anything, so "2 states live" can never
    // appear next to a page that shows one.
    expect(ka.textContent).toContain("2 offices");
    expect(tn.textContent).toContain("1 offices");
    expect(ka.getAttribute("aria-pressed")).toBe("true");
    expect(tn.getAttribute("aria-pressed")).toBe("false");
  });

  it("hides the state pills when only one state is live", () => {
    render(<Landing offices={offices} />);
    expect(screen.queryByRole("button", { name: /karnataka/i })).toBeNull();
  });

  it("answers the collector's questions before the trip", () => {
    render(<Landing offices={offices} />);
    expect(screen.getByText("Before you set out")).toBeDefined();
    // The real booklet price, named circle, and no invented counter hours.
    expect(document.body.textContent).toContain("₹600");
    expect(document.body.textContent).toContain("Karnataka Postal Circle");
    expect(document.body.textContent).toContain("Counter hours vary by office");
  });
});
