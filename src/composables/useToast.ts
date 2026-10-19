import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  type: ToastType
  title: string
  description?: string
  duration: number
}

interface ToastInput {
  title: string
  description?: string
  duration?: number
}

const toasts = ref<ToastItem[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let seq = 0

function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
}

function show(type: ToastType, input: ToastInput | string) {
  const opts = typeof input === 'string' ? { title: input } : input
  const id = ++seq
  const duration = opts.duration ?? (type === 'error' ? 6000 : 4000)
  toasts.value = [...toasts.value, { id, type, title: opts.title, description: opts.description, duration }].slice(-5)
  if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration))
  return id
}

/** Usable outside components too (stores, interceptors). */
export const toast = {
  success: (i: ToastInput | string) => show('success', i),
  error: (i: ToastInput | string) => show('error', i),
  info: (i: ToastInput | string) => show('info', i),
  warning: (i: ToastInput | string) => show('warning', i),
  dismiss,
  clear: () => [...toasts.value].forEach((t) => dismiss(t.id)),
}

export function useToast() {
  return { toasts, ...toast }
}
