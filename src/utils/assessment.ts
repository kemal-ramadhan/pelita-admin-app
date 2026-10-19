import type { BadgeColor, SubscriptionStatus } from '@/types/assessment'

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('id-ID')

export const formatRupiah = (n: number | null | undefined) => rupiah.format(Number(n) || 0)
export const formatNumber = (n: number | null | undefined) => number.format(Number(n) || 0)

/** "1500000" → "1.500.000" (for IDR inputs). */
export const formatThousands = (digits: string) => (digits ? number.format(Number(digits)) : '')
/** "Rp 1.500.000" → "1500000". */
export const onlyDigits = (v: string | number | null | undefined) => String(v ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

/** Date → value for `<input type="datetime-local">` in local time. */
export const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Static class strings (Tailwind needs literal class names). */
export const BADGE_COLOR_CLASS: Record<BadgeColor, { dot: string; chip: string }> = {
  indigo: { dot: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/30' },
  blue: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30' },
  sky: { dot: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30' },
  emerald: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
  },
  amber: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30' },
  rose: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30' },
  violet: {
    dot: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30',
  },
  zinc: { dot: 'bg-zinc-500', chip: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700' },
}

export const badgeColorClass = (c?: string | null) => BADGE_COLOR_CLASS[(c as BadgeColor) in BADGE_COLOR_CLASS ? (c as BadgeColor) : 'indigo']

export const SUBSCRIPTION_STATUS_META: Record<SubscriptionStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'danger' | 'warning' }> = {
  pending: { label: 'Menunggu persetujuan', tone: 'warning' },
  active: { label: 'Aktif', tone: 'success' },
  rejected: { label: 'Ditolak', tone: 'danger' },
  expired: { label: 'Kedaluwarsa', tone: 'neutral' },
  depleted: { label: 'Kuota habis', tone: 'neutral' },
}

export const subscriptionStatusMeta = (s: string) =>
  SUBSCRIPTION_STATUS_META[s as SubscriptionStatus] ?? { label: s, tone: 'neutral' as const }
