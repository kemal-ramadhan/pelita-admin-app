import type { LocationQueryValue } from 'vue-router'

/** Only allow same-app relative redirects (prevents open redirects). */
export function safeRedirect(value: LocationQueryValue | LocationQueryValue[] | undefined, fallback = '/dashboard') {
  const v = Array.isArray(value) ? value[0] : value
  if (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/login')) return v
  return fallback
}
