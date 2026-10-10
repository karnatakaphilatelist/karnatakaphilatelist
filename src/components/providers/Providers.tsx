"use client";

import { Suspense, type ReactNode } from "react";
import { AuthStatusNotice } from "@/components/auth/AuthStatusNotice";
import { GuestSignInPrompt } from "@/components/auth/GuestSignInPrompt";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { VisitsProvider } from "@/components/providers/VisitsProvider";

/** App-wide client providers. Order matters: visits depend on auth and toasts. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <VisitsProvider>
          {children}
          <GuestSignInPrompt />
          <Suspense>
            <AuthStatusNotice />
          </Suspense>
        </VisitsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
