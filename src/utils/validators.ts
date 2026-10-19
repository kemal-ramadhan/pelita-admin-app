/** Lightweight form validators. Each returns an error message or '' when valid. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const required = (v: unknown, label = 'Kolom ini') =>
  v === null || v === undefined || String(v).trim() === '' ? `${label} wajib diisi.` : ''

export const email = (v: string | null | undefined) =>
  v && !EMAIL_RE.test(v.trim()) ? 'Format email tidak valid.' : ''

export const minLength = (v: string | null | undefined, min: number, label = 'Kolom ini') =>
  v && v.length < min ? `${label} minimal ${min} karakter.` : ''

export const phone = (v: string | null | undefined) =>
  v && !/^\+?[0-9\s-]{8,16}$/.test(v.trim()) ? 'Nomor telepon tidak valid.' : ''

/** Returns the first non-empty message. */
export const first = (...messages: string[]) => messages.find(Boolean) ?? ''

export const hasErrors = (errors: Record<string, string>) => Object.values(errors).some(Boolean)

/** Trimmed value, or null when empty — for optional API fields. */
export const orNull = (v: string | null | undefined) => {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}
