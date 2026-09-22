import React from 'react'
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react'
import { useToasts, removeToast } from '../../stores/useToastStore'

export const ToastContainer: React.FC = () => {
  const toasts = useToasts()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none select-none">
      {toasts.map((toast) => {
        let Icon = Info
        let iconColor = 'text-blue-400'
        let borderColor = 'border-blue-500/30'

        if (toast.type === 'success') {
          Icon = CheckCircle2
          iconColor = 'text-emerald-400'
          borderColor = 'border-emerald-500/30'
        } else if (toast.type === 'warning') {
          Icon = AlertCircle
          iconColor = 'text-amber-400'
          borderColor = 'border-amber-500/30'
        } else if (toast.type === 'error') {
          Icon = XCircle
          iconColor = 'text-rose-400'
          borderColor = 'border-rose-500/30'
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-sid-900/95 border ${borderColor} text-xs text-white shadow-2xl backdrop-blur-md animate-scale-in max-w-sm`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-sid-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
