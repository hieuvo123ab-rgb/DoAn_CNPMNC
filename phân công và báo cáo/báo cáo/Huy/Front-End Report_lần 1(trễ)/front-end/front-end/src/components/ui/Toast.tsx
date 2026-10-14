import { useState, createContext, useContext, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = `${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        removeToast(id)
      }, 3500)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success'
          const isError = toast.type === 'error'

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-center gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200',
                isSuccess && 'border-emerald-200 bg-white text-emerald-950',
                isError && 'border-rose-200 bg-white text-rose-950',
                !isSuccess && !isError && 'border-blue-200 bg-white text-blue-950'
              )}
            >
              {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
              {isError && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
              {!isSuccess && !isError && <Info className="h-5 w-5 text-blue-600 shrink-0" />}

              <p className="flex-1 text-sm font-medium text-gray-800">{toast.message}</p>

              <button
                onClick={() => removeToast(toast.id)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
