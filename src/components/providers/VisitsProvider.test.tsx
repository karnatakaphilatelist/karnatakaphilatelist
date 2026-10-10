import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VisitsProvider, useVisits } from "@/components/providers/VisitsProvider";
import { GUEST_VISITS_KEY } from "@/lib/constants";
import type { Visit } from "@/types";

const authState = vi.hoisted(() => ({
  current: { user: null as { id: string } | null, isLoading: false },
}));
const remote = vi.hoisted(() => ({
  fetchVisits: vi.fn(),
  saveVisit: vi.fn(),
  saveVisits: vi.fn(),
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
vi.mock("@/lib/supabase/client", () => ({ getSupabaseBrowserClient: () => ({}) }));
vi.mock("@/lib/visits/remote-store", () => remote);

const storedVisit = (officeId: number): Visit => ({
  officeId,
  visitedAt: "2026-10-01",
  note: "",
  photoPath: null,
  isPublic: false,
});

// Holds the latest context value so tests can call provider actions directly.
const latest: { current: ReturnType<typeof useVisits> | null } = { current: null };

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
  return render(
    <VisitsProvider>
      <Probe />
    </VisitsProvider>,
  );
}

beforeEach(() => {
  latest.current = null;
  window.localStorage.clear();
  authState.current = { user: null, isLoading: false };
  Object.values(remote).forEach((fn) => fn.mockReset());
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
    const stored = JSON.parse(window.localStorage.getItem(GUEST_VISITS_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(remote.saveVisit).not.toHaveBeenCalled();
  });

  it("restores guest visits after a reload", async () => {
    window.localStorage.setItem(GUEST_VISITS_KEY, JSON.stringify([storedVisit(3)]));
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));
    expect(api().visits[3]).toBeDefined();
  });

  it("removes a visit", async () => {
    window.localStorage.setItem(GUEST_VISITS_KEY, JSON.stringify([storedVisit(3)]));
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    await act(async () => {
      await api().removeVisit(3);
    });

    expect(api().visits[3]).toBeUndefined();
    expect(JSON.parse(window.localStorage.getItem(GUEST_VISITS_KEY) ?? "[]")).toEqual([]);
  });

  it("toggles planned offices and remembers them", async () => {
    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    act(() => api().togglePlanned(5));
    expect(api().plannedIds.has(5)).toBe(true);

    act(() => api().togglePlanned(5));
    expect(api().plannedIds.has(5)).toBe(false);
  });
});

describe("VisitsProvider when signed in", () => {
  it("merges guest visits into the account, then loads the account's visits", async () => {
    window.localStorage.setItem(GUEST_VISITS_KEY, JSON.stringify([storedVisit(1)]));
    authState.current = { user: { id: "user-1" }, isLoading: false };
    remote.saveVisits.mockResolvedValue(undefined);
    remote.fetchVisits.mockResolvedValue([storedVisit(1), storedVisit(2)]);

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    expect(remote.saveVisits).toHaveBeenCalledWith({}, "user-1", [storedVisit(1)]);
    expect(window.localStorage.getItem(GUEST_VISITS_KEY)).toBeNull();
    expect(Object.keys(api().visits).sort()).toEqual(["1", "2"]);
  });

  it("rolls back the visit when saving fails", async () => {
    authState.current = { user: { id: "user-1" }, isLoading: false };
    remote.fetchVisits.mockResolvedValue([]);
    remote.saveVisit.mockRejectedValue(new Error("network down"));

    renderProvider();
    await waitFor(() => expect(api().isReady).toBe(true));

    let saved = true;
    await act(async () => {
      saved = await api().markVisited(9);
    });

    expect(saved).toBe(false);
    expect(api().visits[9]).toBeUndefined();
  });
});
