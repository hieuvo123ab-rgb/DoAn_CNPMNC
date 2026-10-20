import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };
      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string) => showToast(msg, 'success', title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast(msg, 'error', title, 6000), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast(msg, 'warning', title, 5000), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast(msg, 'info', title), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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

const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="ent-toast-container" aria-live="polite">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 size={18} className="text-success" />;
            case 'error':
              return <AlertCircle size={18} className="text-danger" />;
            case 'warning':
              return <AlertTriangle size={18} className="text-warning" />;
            default:
              return <Info size={18} className="text-info" />;
          }
        };

        return (
          <div key={toast.id} className={`ent-toast ent-toast--${toast.type}`} role="alert">
            <div className="ent-toast__icon">{getIcon()}</div>
            <div className="ent-toast__content">
              {toast.title && <h5 className="ent-toast__title">{toast.title}</h5>}
              <p className="ent-toast__message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="ent-toast__close"
              onClick={() => onRemove(toast.id)}
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
