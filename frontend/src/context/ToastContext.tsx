import React, { createContext, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
    info: (msg: string) => addToast("info", msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border border-zinc-700/80 bg-zinc-950/90 text-white text-xs font-medium shadow-sm  transition-colors duration-200 transform translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center gap-2.5">
              {t.type === "success" && (
                <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
              {t.type === "error" && (
                <div className="w-5 h-5 rounded-full bg-zinc-800 text-white border border-zinc-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              )}
              {t.type === "info" && (
                <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
                  <Info className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="leading-tight">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
