import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  VisitsProvider,
  useVisits,
} from "@/components/providers/VisitsProvider";
import { GUEST_VISITS_KEY } from "@/lib/constants";
import type { Visit } from "@/types";

const authState = vi.hoisted(() => ({
  current: { user: null as { id: string } | null, isLoading: false },
}));
const remote = vi.hoisted(() => ({
  fetchVisits: vi.fn(),
  insertVisitIfMissing: vi.fn(),
  updateVisitDetails: vi.fn(),
  mergeGuestVisits: vi.fn(),
  deleteVisit: vi.fn(),
  uploadStampPhoto: vi.fn(),
  removeStampPhoto: vi.fn(),
}));

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => authState.current,
}));
// Like the real ToastProvider, hand out one stable object so effects that depend on it don't re-run.
const toast = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => toast,
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}));
vi.mock("@/lib/visits/remote-store", () => remote);
vi.mock("@/lib/image", () => ({ compressImage: async (file: File) => file }));

const storedVisit = (
  officeId: number,
  overrides: Partial<Visit> = {}
): Visit => ({
  officeId,
  visitedAt: "2026-10-01",
  note: "",
  photoPath: null,
  isPublic: false,
  ...overrides,
});

// Holds the latest context value so tests can call provider actions directly.
const latest: { current: ReturnType<typeof useVisits> | null } = {
  current: null,
};

function api(): ReturnType<typeof useVisits> {
  if (!latest.current) throw new Error("Probe has not rendered yet");
  return latest.current;
}

function Probe() {
  const value = useVisits();
  useEffect(() => {
    latest.current = value;
  });
  return <p data-testid="count">{Object.keys(value.visits).length}</p>;
}

function renderProvider() {
  // A fresh element each time: re-rendering the identical element would let React
  // skip the provider, and it would never notice the mocked sign-in state changed.
  const element = () => (
    <VisitsProvider>
      <Probe />
    </VisitsProvider>
  );
  const view = render(element());
  return { ...view, rerenderProvider: () => view.rerender(element()) };
}

const details = (overrides = {}) => ({
  note: "  Lovely staff ",
  isPublic: true,
  newPhoto: null,
  removePhoto: false,
  ...overrides,
});

beforeEach(() => {
  latest.current = null;
  window.localStorage.clear();
  authState.current = { user: null, isLoading: false };
  Object.values(remote).forEach((fn) => fn.mockReset());
  toast.showToast.mockReset();
});

afterEach(cleanup);

describe("VisitsProvider as a guest", () => {
  it("marks an office visited and persists it on this device", async () => {
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    await act(async () => {
      await api().markVisited(7);
    });

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(api().visits[7].note).toBe("");
    expect(api().visits[7].visitedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const stored = JSON.parse(
      window.localStorage.getItem(GUEST_VISITS_KEY) ?? "[]"
    );
    expect(stored).toHaveLength(1);
    expect(remote.insertVisitIfMissing).not.toHaveBeenCalled();
  });

  it("restores guest visits after a reload", async () => {
    window.localStorage.setItem(
      GUEST_VISITS_KEY,
      JSON.stringify([storedVisit(3)])
    );
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));
    expect(api().visits[3]).toBeDefined();
  });

  it("starts empty instead of crashing when the stored data is corrupt", async () => {
    window.localStorage.setItem(
      GUEST_VISITS_KEY,
      JSON.stringify({ not: "a list" })
    );
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("removes a visit", async () => {
    window.localStorage.setItem(
      GUEST_VISITS_KEY,
      JSON.stringify([storedVisit(3)])
    );
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    await act(async () => {
      await api().removeVisit(3);
    });

    expect(api().visits[3]).toBeUndefined();
    expect(
      JSON.parse(window.localStorage.getItem(GUEST_VISITS_KEY) ?? "[]")
    ).toEqual([]);
  });

  it("toggles planned offices and remembers them", async () => {
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    act(() => api().togglePlanned(5));
    expect(api().plannedIds.has(5)).toBe(true);

    act(() => api().togglePlanned(5));
    expect(api().plannedIds.has(5)).toBe(false);
  });

  it("does not replace an existing note when the same office is marked again", async () => {
    window.localStorage.setItem(
      GUEST_VISITS_KEY,
      JSON.stringify([storedVisit(3, { note: "keep me" })])
    );
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    let result = false;
    await act(async () => {
      result = await api().markVisited(3);
    });

    expect(result).toBe(true);
    expect(api().visits[3].note).toBe("keep me");
  });

  it("trims the note and saves privacy on the device", async () => {
    window.localStorage.setItem(
      GUEST_VISITS_KEY,
      JSON.stringify([storedVisit(3)])
    );
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    await act(async () => {
      await api().saveDetails(3, details());
    });

    expect(api().visits[3]).toMatchObject({
      note: "Lovely staff",
      isPublic: true,
    });
    expect(remote.updateVisitDetails).not.toHaveBeenCalled();
  });
});

describe("VisitsProvider when signed in", () => {
  const signIn = () => {
    authState.current = { user: { id: "user-1" }, isLoading: false };
  };

  it("merges guest visits into the account, then loads the account's visits", async () => {
    window.localStorage.setItem(
      GUEST_VISITS_KEY,
      JSON.stringify([storedVisit(1)])
    );
    signIn();
    remote.mergeGuestVisits.mockResolvedValue(undefined);
    remote.fetchVisits.mockResolvedValue([storedVisit(1), storedVisit(2)]);

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    expect(remote.mergeGuestVisits).toHaveBeenCalledWith({}, "user-1", [
      storedVisit(1),
    ]);
    expect(window.localStorage.getItem(GUEST_VISITS_KEY)).toBeNull();
    expect(Object.keys(api().visits).sort()).toEqual(["1", "2"]);
  });

  it("still shows the account's passport when the guest merge fails, and keeps the guest stamps", async () => {
    window.localStorage.setItem(
      GUEST_VISITS_KEY,
      JSON.stringify([storedVisit(1)])
    );
    signIn();
    remote.mergeGuestVisits.mockRejectedValue(new Error("network down"));
    remote.fetchVisits.mockResolvedValue([storedVisit(2)]);

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    expect(Object.keys(api().visits)).toEqual(["2"]);
    expect(window.localStorage.getItem(GUEST_VISITS_KEY)).not.toBeNull();
    expect(toast.showToast).toHaveBeenCalledWith({
      message: expect.stringContaining("move your guest stamps"),
    });
  });

  it("becomes ready with an empty passport and a message when loading fails", async () => {
    signIn();
    remote.fetchVisits.mockRejectedValue(new Error("offline"));

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(toast.showToast).toHaveBeenCalledWith({
      message: expect.stringContaining("load your passport"),
    });
  });

  it("rolls back the visit when saving fails", async () => {
    signIn();
    remote.fetchVisits.mockResolvedValue([]);
    remote.insertVisitIfMissing.mockRejectedValue(new Error("network down"));

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    let saved = true;
    await act(async () => {
      saved = await api().markVisited(9);
    });

    expect(saved).toBe(false);
    expect(api().visits[9]).toBeUndefined();
  });

  it("never sends a request for an office that is already stamped", async () => {
    signIn();
    remote.fetchVisits.mockResolvedValue([storedVisit(4, { note: "my note" })]);

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    await act(async () => {
      await api().markVisited(4);
    });

    expect(remote.insertVisitIfMissing).not.toHaveBeenCalled();
    expect(api().visits[4].note).toBe("my note");
  });

  it("uploads a new photo, saves details and removes the replaced photo", async () => {
    signIn();
    remote.fetchVisits.mockResolvedValue([
      storedVisit(4, { photoPath: "user-1/old.jpg" }),
    ]);
    remote.uploadStampPhoto.mockResolvedValue("user-1/new.jpg");
    remote.updateVisitDetails.mockResolvedValue(undefined);
    remote.removeStampPhoto.mockResolvedValue(undefined);

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    let saved = false;
    await act(async () => {
      saved = await api().saveDetails(
        4,
        details({ newPhoto: new File(["x"], "p.jpg") })
      );
    });

    expect(saved).toBe(true);
    expect(api().visits[4].photoPath).toBe("user-1/new.jpg");
    expect(remote.removeStampPhoto).toHaveBeenCalledWith({}, "user-1/old.jpg");
  });

  it("deletes the uploaded photo when the save fails, so nothing is orphaned", async () => {
    signIn();
    remote.fetchVisits.mockResolvedValue([storedVisit(4)]);
    remote.uploadStampPhoto.mockResolvedValue("user-1/new.jpg");
    remote.updateVisitDetails.mockRejectedValue(new Error("save failed"));
    remote.removeStampPhoto.mockResolvedValue(undefined);

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    let saved = true;
    await act(async () => {
      saved = await api().saveDetails(
        4,
        details({ newPhoto: new File(["x"], "p.jpg") })
      );
    });

    expect(saved).toBe(false);
    expect(remote.removeStampPhoto).toHaveBeenCalledWith({}, "user-1/new.jpg");
    expect(api().visits[4].photoPath).toBeNull();
  });

  it("does not bring a visit back when it was removed while details were saving", async () => {
    signIn();
    remote.fetchVisits.mockResolvedValue([storedVisit(4)]);
    remote.deleteVisit.mockResolvedValue(undefined);
    let finishUpdate: () => void = () => undefined;
    remote.updateVisitDetails.mockImplementation(
      () => new Promise<void>((resolve) => (finishUpdate = resolve))
    );

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    let saving: Promise<boolean> = Promise.resolve(true);
    act(() => {
      saving = api().saveDetails(4, details());
    });
    await act(async () => {
      await api().removeVisit(4);
    });
    await act(async () => {
      finishUpdate();
      await saving;
    });

    expect(api().visits[4]).toBeUndefined();
  });

  it("restores the visit when removing it fails", async () => {
    signIn();
    remote.fetchVisits.mockResolvedValue([storedVisit(4)]);
    remote.deleteVisit.mockRejectedValue(new Error("offline"));

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    await act(async () => {
      await api().removeVisit(4);
    });

    expect(api().visits[4]).toBeDefined();
  });
});

describe("VisitsProvider when the person changes", () => {
  it("hides the previous person's stamps and refuses actions until the new passport has loaded", async () => {
    window.localStorage.setItem(
      GUEST_VISITS_KEY,
      JSON.stringify([storedVisit(3)])
    );
    const view = renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));
    expect(screen.getByTestId("count").textContent).toBe("1");

    // Signing in: the account's visits are still on their way.
    let finishFetch: (visits: Visit[]) => void = () => undefined;
    remote.mergeGuestVisits.mockResolvedValue(undefined);
    remote.fetchVisits.mockImplementation(
      () => new Promise<Visit[]>((resolve) => (finishFetch = resolve))
    );
    authState.current = { user: { id: "user-1" }, isLoading: false };
    view.rerenderProvider();

    await waitFor(() => expect(api().isReady).toBe(false));
    expect(screen.getByTestId("count").textContent).toBe("0");

    let result = true;
    await act(async () => {
      result = await api().markVisited(8);
    });
    expect(result).toBe(false);
    expect(remote.insertVisitIfMissing).not.toHaveBeenCalled();

    await act(async () => {
      finishFetch([storedVisit(5)]);
    });
    await waitFor(() => expect(api().isReady).toBe(true));
    expect(Object.keys(api().visits)).toEqual(["5"]);
  });

  it("shows an empty guest passport after signing out", async () => {
    authState.current = { user: { id: "user-1" }, isLoading: false };
    remote.fetchVisits.mockResolvedValue([storedVisit(5), storedVisit(6)]);
    const view = renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));
    expect(screen.getByTestId("count").textContent).toBe("2");

    authState.current = { user: null, isLoading: false };
    view.rerenderProvider();

    await waitFor(() => expect(api().isReady).toBe(true));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});
