import { isAxiosError } from 'axios'
import type { ApiErrorBody } from '@/types/api'

export function getErrorStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined
}

export function getErrorCode(err: unknown): string | undefined {
  if (!isAxiosError<ApiErrorBody>(err)) return undefined
  return err.response?.data?.code
}

/** Flattens the optional `details` field of validation errors into readable lines. */
export function getErrorDetails(err: unknown): string[] {
  if (!isAxiosError<ApiErrorBody>(err)) return []
  const d = err.response?.data?.details
  if (!d) return []
  if (typeof d === 'string') return [d]
  if (Array.isArray(d)) return d.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))
  if (typeof d === 'object') {
    return Object.entries(d as Record<string, unknown>).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
  }
  return []
}

/** Human-readable (Indonesian) message from an API error, with a sensible fallback. */
export function getErrorMessage(err: unknown, fallback = 'Terjadi kesalahan. Silakan coba lagi.'): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    const body = err.response?.data
    if (body && typeof body === 'object') {
      if (body.error) {
        const details = getErrorDetails(err)
        return details.length ? `${body.error} (${details.join('; ')})` : body.error
      }
      if (body.message) return body.message
    }
    if (!err.response) return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'
    if (err.response.status === 403) return 'Anda tidak memiliki akses untuk tindakan ini.'
    if (err.response.status >= 500) return 'Server sedang bermasalah. Silakan coba beberapa saat lagi.'
    return fallback
  }
  return fallback
}
