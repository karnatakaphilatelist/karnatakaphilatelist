import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Landing } from "@/components/landing/Landing";
import { INTRO_SEEN_KEY } from "@/lib/landing";
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
vi.mock("@/components/providers/VisitsProvider", () => ({
  useVisits: () => ({ visits: {} }),
}));

const offices: PostOffice[] = [
  {
    id: 1,
    name: "Mysuru GPO",
    pincode: "570001",
    district: "Mysuru",
    lat: 12.3,
    lng: 76.6,
    stampImagePath: null,
  },
  {
    id: 2,
    name: "Hampi",
    pincode: "583239",
    district: "Vijayanagara",
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
  auth.user = null;
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
      "every post office in Karnataka",
    );
    const links = screen.getAllByRole("link", {
      name: /open the map|explore/i,
    });
    expect(links.every((l) => l.getAttribute("href") === "/explore")).toBe(
      true,
    );
  });

  it("shows the disclaimer and legal links", () => {
    render(<Landing offices={offices} />);
    expect(
      screen.getByText(/not run, endorsed or sponsored by India Post/),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Privacy" }).getAttribute("href"),
    ).toBe("/privacy");
    expect(
      screen.getByRole("link", { name: "Terms" }).getAttribute("href"),
    ).toBe("/terms");
  });

  it("plays the intro for a first visit and ends it on Skip", () => {
    const { container } = render(<Landing offices={offices} />);
    const intro = container.querySelector(".kpl-intro");
    expect(intro?.getAttribute("data-state")).toBe("playing");
    expect(document.documentElement.hasAttribute("data-intro-playing")).toBe(
      true,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    });
    expect(intro?.getAttribute("data-state")).toBe("done");
    expect(document.documentElement.hasAttribute("data-intro-playing")).toBe(
      false,
    );
    expect(window.sessionStorage.getItem(INTRO_SEEN_KEY)).toBe("1");
  });

  it("skips the intro when it was already seen this session", () => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    const { container } = render(<Landing offices={offices} />);
    expect(
      container.querySelector(".kpl-intro")?.getAttribute("data-state"),
    ).toBe("done");
  });

  it("skips the intro when the person prefers reduced motion", () => {
    mockMotion(true);
    const { container } = render(<Landing offices={offices} />);
    expect(
      container.querySelector(".kpl-intro")?.getAttribute("data-state"),
    ).toBe("done");
  });

  it("opens sign-in for a guest", () => {
    render(<Landing offices={offices} />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(auth.openSignIn).toHaveBeenCalled();
  });

  it("greets a signed-in person by first name", () => {
    auth.user = { email: "a@b.c", user_metadata: { full_name: "Asha Rao" } };
    render(<Landing offices={offices} />);
    expect(screen.getByText("Namaskara, Asha")).toBeDefined();
  });

  it("offers previous and next arrows, with previous disabled on the first card", () => {
    render(<Landing offices={offices} />);
    const prev = screen.getByRole("button", {
      name: "Previous card",
    }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Next card" })).toBeDefined();
  });

  it("has a progress tick for every card", () => {
    render(<Landing offices={offices} />);
    expect(
      screen.getAllByRole("button", { name: /Go to card \d+ of \d+/ }).length,
    ).toBeGreaterThan(0);
  });
});
