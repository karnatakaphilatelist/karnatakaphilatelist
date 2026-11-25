"use client";

import { Suspense, type ReactNode } from "react";
import { AuthStatusNotice } from "@/components/auth/AuthStatusNotice";
import { GuestSignInPrompt } from "@/components/auth/GuestSignInPrompt";
import { AppDownloadNudge } from "@/components/app/AppDownloadNudge";
import { LiteModeApplier } from "@/components/settings/LiteModeApplier";
import { AnalyticsPlatform } from "@/components/providers/AnalyticsPlatform";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { OverlayProvider } from "@/components/providers/OverlayProvider";
import { StateProvider } from "@/components/providers/StateProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { VisitsProvider } from "@/components/providers/VisitsProvider";

/** App-wide client providers. Order matters: visits depend on auth and toasts. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <VisitsProvider>
          <OverlayProvider>
            <StateProvider>{children}</StateProvider>
            <GuestSignInPrompt />
            <AppDownloadNudge />
            <LiteModeApplier />
            <AnalyticsPlatform />
            <Suspense>
              <AuthStatusNotice />
            </Suspense>
          </OverlayProvider>
        </VisitsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
