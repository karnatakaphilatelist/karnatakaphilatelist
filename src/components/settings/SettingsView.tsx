"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { COACH_EVENT } from "@/lib/constants";
import { readLiteMode, saveLiteMode } from "@/components/settings/lite-mode";

/** App settings. For now: Lite mode. */
export function SettingsView() {
  const router = useRouter();
  const [lite, setLite] = useState(() => readLiteMode());

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-md px-5 pb-8 pt-6">
        <Link href="/account" className="flex min-h-11 items-center text-sm font-semibold text-muted">
          ← Account
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <div className="mt-4 flex items-center gap-4 rounded-[18px] border border-line bg-white p-4">
          <div className="flex-1">
            <p id="lite-label" className="font-semibold">Lite mode</p>
            <p className="mt-1 text-sm text-muted">
              Turns off textures and animations. Helps older phones and saves battery.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={lite}
            aria-labelledby="lite-label"
            onClick={() => {
              setLite(!lite);
              saveLiteMode(!lite);
            }}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
              lite ? "bg-visited" : "bg-line-strong"
            }`}
          >
            <span
              className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${
                lite ? "left-7" : "left-1"
              }`}
            />
            <span className="sr-only">{lite ? "On" : "Off"}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            router.push("/explore");
            window.dispatchEvent(new Event(COACH_EVENT));
          }}
          className="mt-3 flex min-h-14 w-full items-center justify-between rounded-[18px] border border-line bg-white p-4 text-left"
        >
          <span>
            <span className="block font-semibold">Replay the walkthrough</span>
            <span className="mt-1 block text-sm text-muted">A quick look at what each button does.</span>
          </span>
          <span aria-hidden="true" className="text-muted">›</span>
        </button>
      </div>
    </div>
  );
}
