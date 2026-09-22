import { useState, useEffect } from 'react'

export interface Toast {
  id: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

let listeners: Array<(toasts: Toast[]) => void> = []
let toastsList: Toast[] = []

function notify() {
  listeners.forEach((l) => l([...toastsList]))
}

export function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000): void {
  const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  const newToast: Toast = { id, message, type, duration }
  toastsList = [...toastsList, newToast]
  notify()

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
}

export function removeToast(id: string): void {
  toastsList = toastsList.filter((t) => t.id !== id)
  notify()
}

export function useToasts(): Toast[] {
  const [toasts, setToasts] = useState<Toast[]>(toastsList)

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      listeners = listeners.filter((l) => l !== setToasts)
    }
  }, [])

  return toasts
}
