'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { useToasts, type Toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className={cn(
        'bg-white border rounded-lg shadow-lg p-4 mb-2 min-w-[300px] max-w-[400px] flex items-start gap-3 animate-in slide-in-from-right-full',
        toast.variant === 'destructive' && 'border-red-200'
      )}
    >
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold',
            toast.variant === 'destructive' ? 'text-red-700' : 'text-gray-900'
          )}
        >
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-sm text-gray-500 mt-1">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToasts()
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set())

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  const visible = toasts.filter(t => !dismissed.has(t.id))

  if (visible.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end">
      {visible.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}
