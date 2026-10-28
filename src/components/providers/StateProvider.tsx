"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { liveStates, resolveState, type StateOption } from "@/lib/states";
import { readJson, writeJson } from "@/lib/local-storage";
import type { PostOffice } from "@/types";

const STATE_KEY = "kp:state:v1";

interface StateContextValue {
  /** The person's last choice, or null if they have not picked one on this device. */
  stored: string | null;
  choose: (code: string) => void;
}

const StateContext = createContext<StateContextValue>({
  stored: null,
  choose: () => {},
});

export function StateProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<string | null>(null);

  useEffect(() => {
    const value = readJson<unknown>(STATE_KEY, null);
    // Reading localStorage is only possible after hydration, so this one-time sync is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof value === "string") setStored(value);
  }, []);

  const choose = useCallback((code: string) => {
    setStored(code);
    writeJson(STATE_KEY, code);
  }, []);

  const value = useMemo(() => ({ stored, choose }), [stored, choose]);
  return (
    <StateContext.Provider value={value}>{children}</StateContext.Provider>
  );
}

/** The states that have post offices, the one being shown, and just that state's offices. */
export function useStateOffices(offices: PostOffice[]): {
  states: StateOption[];
  stateCode: string;
  stateOffices: PostOffice[];
  choose: (code: string) => void;
} {
  const context = useContext(StateContext);
  if (!context)
    throw new Error("useStateOffices must be used inside <StateProvider>");

  const states = useMemo(() => liveStates(offices), [offices]);
  const stateCode = resolveState(context.stored, states);
  const stateOffices = useMemo(
    () => offices.filter((office) => office.state === stateCode),
    [offices, stateCode]
  );
  return { states, stateCode, stateOffices, choose: context.choose };
}
