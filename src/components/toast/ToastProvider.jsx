import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

const TOAST_DURATION = {
  success: 3200,
  info: 3200,
  error: 4200,
};

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    cardClass: 'border-emerald-400/20 bg-emerald-500/12 text-emerald-50',
    iconClass: 'text-emerald-300',
    progressClass: 'bg-emerald-300/70',
  },
  error: {
    icon: TriangleAlert,
    cardClass: 'border-rose-400/20 bg-rose-500/12 text-rose-50',
    iconClass: 'text-rose-300',
    progressClass: 'bg-rose-300/70',
  },
  info: {
    icon: Info,
    cardClass: 'border-sky-400/20 bg-sky-500/12 text-sky-50',
    iconClass: 'text-sky-300',
    progressClass: 'bg-sky-300/70',
  },
};

const ToastContext = createContext(null);

const ToastItem = ({ toast, onClose }) => {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const Icon = style.icon;

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl ${style.cardClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${style.iconClass}`}>
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-6">{toast.message}</p>
        </div>

        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="shrink-0 rounded-full p-1 text-white/55 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full origin-left rounded-full ${style.progressClass}`}
          style={{ animation: `toast-progress ${toast.duration}ms linear forwards` }}
        />
      </div>
    </div>
  );
};

const ToastViewport = ({ toasts, onClose }) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex justify-center px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:justify-end">
    <div className="flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  </div>
);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const activeKeysRef = useRef(new Set());

  const dismiss = useCallback((id) => {
    setToasts((currentToasts) => {
      const nextToasts = currentToasts.filter((toast) => toast.id !== id);
      const removedToast = currentToasts.find((toast) => toast.id === id);

      if (removedToast) {
        activeKeysRef.current.delete(removedToast.key);
      }

      return nextToasts;
    });
  }, []);

  const pushToast = useCallback(({ type = 'info', message, duration, dedupeKey }) => {
    if (!message) {
      return null;
    }

    const key = dedupeKey || `${type}:${message}`;
    if (activeKeysRef.current.has(key)) {
      return null;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const resolvedDuration = duration ?? TOAST_DURATION[type] ?? TOAST_DURATION.info;

    activeKeysRef.current.add(key);

    const nextToast = {
      id,
      key,
      type,
      message,
      duration: resolvedDuration,
    };

    setToasts((currentToasts) => [...currentToasts, nextToast]);
    window.setTimeout(() => {
      dismiss(id);
    }, resolvedDuration);

    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    show: pushToast,
    success: (message, options = {}) => pushToast({ ...options, type: 'success', message }),
    error: (message, options = {}) => pushToast({ ...options, type: 'error', message }),
    info: (message, options = {}) => pushToast({ ...options, type: 'info', message }),
    dismiss,
  }), [dismiss, pushToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
