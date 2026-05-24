'use client'
import { useState, useEffect } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

const listeners: Set<(toasts: Toast[]) => void> = new Set()
let toasts: Toast[] = []

export function toast(t: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { ...t, id }]
  listeners.forEach(l => l(toasts))
  setTimeout(() => {
    toasts = toasts.filter(x => x.id !== id)
    listeners.forEach(l => l(toasts))
  }, 4000)
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>(toasts)
  useEffect(() => {
    listeners.add(setState)
    return () => { listeners.delete(setState) }
  }, [])
  return state
}
