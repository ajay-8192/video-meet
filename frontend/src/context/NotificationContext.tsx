import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

// Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Provider
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const queueRef = useRef<Toast[]>([]);
  const maxVisible = 3;

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    if (toasts.length < maxVisible && queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      if (next) setToasts((prev) => [...prev, next]);
    }
  }, [toasts]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, message };
    if (toasts.length < maxVisible) {
      setToasts((prev) => [...prev, toast]);
    } else {
      queueRef.current.push(toast);
    }
    setTimeout(() => removeToast(id), 5000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-50 space-y-2">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
                className={`px-4 py-2 rounded shadow-lg text-white cursor-pointer toast-${toast.type}`}
                onClick={() => removeToast(toast.id)}
              >
                {toast.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// Basic styling (can be moved to CSS file or Tailwind)
const styles = document.createElement('style');
styles.innerHTML = `
.toast-success { background-color: #16a34a; }
.toast-error { background-color: #dc2626; }
.toast-info { background-color: #2563eb; }
.toast-warning { background-color: #facc15; color: #000; }
`;
document.head.appendChild(styles);
