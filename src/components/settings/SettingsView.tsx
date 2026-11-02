"use client";

import Link from "next/link";
import { useState } from "react";
import { readLiteMode, saveLiteMode } from "@/components/settings/lite-mode";

/** App settings. For now: Lite mode. */
export function SettingsView() {
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
      </div>
    </div>
  );
}
