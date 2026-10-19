// Toast system adapted from EasyUI UndoToast (MIT, (c) 2026 Suraj Maurya) —
// turned into a provider/stack, moved to InvestED design tokens, logical
// properties for RTL, and reduced-motion support.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Info, AlertTriangle, AlertCircle, Undo2, X } from "lucide-react";
import { motionTransitions } from "@/lib/easyui/motion";

export type ToastVariant = "default" | "success" | "warning" | "error" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Show an undo button with this label; onUndo runs when pressed. */
  undoLabel?: string;
  onUndo?: () => void;
  /** Auto-dismiss after ms. Default 5000. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description" | "undoLabel" | "onUndo">> {
  id: number;
  description?: string;
  undoLabel?: string;
  onUndo?: () => void;
}

interface ToastContextValue {
  push: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

function VariantIcon({ variant }: { variant: ToastVariant }) {
  switch (variant) {
    case "success": return <Check className="h-4 w-4 text-success" />;
    case "warning": return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "error": return <AlertCircle className="h-4 w-4 text-danger" />;
    case "info": return <Info className="h-4 w-4 text-primary" />;
    default: return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const [undone, setUndone] = useState(false);
  const systemReduced = useReducedMotion();
  const transition = systemReduced ? { duration: 0.01 } : motionTransitions.springSnappy;

  const handleUndo = () => {
    if (undone) return;
    setUndone(true);
    toast.onUndo?.();
    window.setTimeout(() => onDismiss(toast.id), 1200);
  };

  return (
    <motion.div
      layout
      initial={systemReduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={systemReduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
      transition={transition}
      role="status"
      aria-live="polite"
      className="pointer-events-auto relative w-[min(92vw,24rem)] select-none overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-card"
    >
      <div className="relative z-10 flex items-center justify-between gap-3 p-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
          {undone ? <Check className="h-4 w-4 text-success" /> : <VariantIcon variant={toast.variant} />}
        </div>
        <div className="min-w-0 flex-1 pe-1">
          <p className="truncate text-xs font-semibold">{toast.title}</p>
          {toast.description && !undone && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{toast.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!undone && toast.undoLabel && toast.onUndo && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Undo2 className="h-3 w-3 text-muted-foreground" />
              <span>{toast.undoLabel}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {toast.duration > 0 && !undone && (
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-muted">
          <div
            className="h-full bg-primary"
            style={{ animation: `easyui-toast-progress ${toast.duration}ms linear forwards` }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    const toast: ToastItem = {
      variant: "default",
      duration: 5000,
      ...options,
      id,
    };
    setToasts((current) => [...current.slice(-2), toast]);
    if (toast.duration > 0) {
      window.setTimeout(() => dismiss(id), toast.duration + 150);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
