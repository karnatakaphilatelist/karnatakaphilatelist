"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CloseIcon } from "@/components/ui/icons";

const TOAST_DURATION_MS = 6000;

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toastRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => setToast(null), []);

  // Modal dialogs sit in the browser's "top layer", which no z-index can climb above,
  // so a plain toast would be hidden behind them. Showing it as a popover puts it in
  // the same layer, and it is lifted again whenever a dialog opens or closes after it.
  useEffect(() => {
    const element = toastRef.current;
    if (!toast || !element || typeof element.showPopover !== "function") return;

    const lift = () => {
      try {
        if (element.matches(":popover-open")) element.hidePopover();
        element.showPopover();
      } catch {
        // Not supported or already detached: the toast still shows in the normal page.
      }
    };
    lift();

    const observer = new MutationObserver(lift);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    return () => observer.disconnect();
  }, [toast]);

  const showToast = useCallback((options: ToastOptions) => {
    clearTimeout(timerRef.current);
    setToast(options);
    timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          ref={toastRef}
          // "manual" keeps it open until we close it and never dismisses other popovers.
          popover="manual"
          role="status"
          className="fixed inset-x-4 bottom-20 top-auto z-[3000] m-0 flex h-auto w-auto animate-[rise_.2s_ease-out] items-center gap-2 overflow-visible rounded-sm border-0 bg-ink py-1.5 pl-4 pr-1.5 text-white shadow-xl md:inset-x-auto md:bottom-6 md:right-6 md:w-96"
        >
          <span className="flex-1 text-sm font-semibold">{toast.message}</span>
          {toast.actionLabel && toast.onAction ? (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                dismiss();
              }}
              className="min-h-11 rounded-sm bg-planned px-3.5 text-sm font-bold text-ink"
            >
              {toast.actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="grid size-11 place-items-center"
          >
            <CloseIcon className="size-[18px]" />
          </button>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
