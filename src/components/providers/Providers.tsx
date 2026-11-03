"use client";

import { Suspense, type ReactNode } from "react";
import { AuthStatusNotice } from "@/components/auth/AuthStatusNotice";
import { GuestSignInPrompt } from "@/components/auth/GuestSignInPrompt";
import { LiteModeApplier } from "@/components/settings/LiteModeApplier";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { StateProvider } from "@/components/providers/StateProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { VisitsProvider } from "@/components/providers/VisitsProvider";

/** App-wide client providers. Order matters: visits depend on auth and toasts. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <VisitsProvider>
          <StateProvider>{children}</StateProvider>
          <GuestSignInPrompt />
          <LiteModeApplier />
          <Suspense>
            <AuthStatusNotice />
          </Suspense>
        </VisitsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
