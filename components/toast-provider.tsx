"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type Toast = ToastInput & {
  id: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  notify: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    iconClass: string;
    ring: string;
    title: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20",
    ring: "border-emerald-500/20",
    title: "text-emerald-50",
  },
  error: {
    icon: AlertCircle,
    iconClass: "bg-red-500/15 text-red-300 ring-red-500/20",
    ring: "border-red-500/20",
    title: "text-red-50",
  },
  warning: {
    icon: TriangleAlert,
    iconClass: "bg-amber-500/15 text-amber-200 ring-amber-500/20",
    ring: "border-amber-500/20",
    title: "text-amber-50",
  },
  info: {
    icon: Info,
    iconClass: "bg-sky-500/15 text-sky-200 ring-sky-500/20",
    ring: "border-sky-500/20",
    title: "text-sky-50",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, description, variant = "info" }: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      setToasts((current) => [
        ...current.slice(-3),
        { id, title, description, variant },
      ]);

      window.setTimeout(() => dismiss(id), variant === "error" ? 6500 : 4500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3"
      >
        {toasts.map((toast) => {
          const styles = toastStyles[toast.variant];
          const Icon = styles.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto animate-in slide-in-from-top-2 fade-in rounded-lg border ${styles.ring} bg-[#0d0c0a]/95 p-4 text-stone-100 shadow-2xl shadow-black/30 backdrop-blur`}
              role="status"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1 ${styles.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${styles.title}`}>
                    {toast.title}
                  </p>
                  {toast.description && (
                    <p className="mt-1 text-sm leading-6 text-stone-400">
                      {toast.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-md p-1 text-stone-500 transition hover:bg-white/10 hover:text-stone-200"
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context.notify;
}
