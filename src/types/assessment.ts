/**
 * Asesmen Psikologi admin shapes — services/docs/API_CONTRACT.md §13 (§13.3 admin routes)
 * and item structures from docs/assesment-psikologi.md §6–9, §13.
 */
import type { ListQuery } from './api'

// ---------------------------------------------------------------------------
// Instruments
// ---------------------------------------------------------------------------

export const INSTRUMENT_CODES = ['TMB', 'RIA', 'PMK', 'ADN'] as const
export type InstrumentCode = (typeof INSTRUMENT_CODES)[number]

export interface InstrumentDef {
  code: InstrumentCode
  name: string
  short: string
  description: string
}

export const INSTRUMENTS: readonly InstrumentDef[] = [
  {
    code: 'TMB',
    name: 'Tes Minat dan Bakat (Penjurusan)',
    short: 'Minat & Bakat',
    description: 'Minat bidang (24 butir) + bakat verbal, numerik, logika, spasial (24 butir, 20 menit).',
  },
  {
    code: 'RIA',
    name: 'Asesmen Preferensi Karier (RIASEC)',
    short: 'Preferensi Karier',
    description: '48 pernyataan aktivitas skala 1–5, menghasilkan kode Holland 3 huruf.',
  },
  {
    code: 'PMK',
    name: 'Tes Penelusuran Minat Karier Holland',
    short: 'Penelusuran Minat',
    description: 'Format SDS: Aktivitas, Kompetensi, Pekerjaan, dan Estimasi Diri.',
  },
  {
    code: 'ADN',
    name: 'Asesmen Diagnostik Non-Kognitif',
    short: 'Diagnostik Non-Kognitif',
    description: 'Gaya belajar, kebiasaan belajar & sosio-emosional, minat karier singkat.',
  },
]

export const instrumentName = (code: string) => INSTRUMENTS.find((i) => i.code === code)?.name ?? code

// ---------------------------------------------------------------------------
// Question bank structure (subtests, dimensions, default scales)
// ---------------------------------------------------------------------------

export const QUESTION_TYPES = ['likert', 'multiple_choice', 'boolean'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  likert: 'Skala Likert',
  multiple_choice: 'Pilihan ganda',
  boolean: 'Dua pilihan',
}

export const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'] as const
export type OptionKey = (typeof OPTION_KEYS)[number]

export interface Option {
  label: string
  value: string
}

const RIASEC: Option[] = [
  { value: 'R', label: 'R — Realistic' },
  { value: 'I', label: 'I — Investigative' },
  { value: 'A', label: 'A — Artistic' },
  { value: 'S', label: 'S — Social' },
  { value: 'E', label: 'E — Enterprising' },
  { value: 'C', label: 'C — Conventional' },
]

export interface SubtestDef {
  value: string
  label: string
  instrument: InstrumentCode
  type: QuestionType
  /** Likert defaults (PRD), or 0/1 for two-choice items. */
  scaleMin: number
  scaleMax: number
  scaleLabels: string[]
  dimensions: Option[]
  /** Allow an item without dimension (e.g. RIASEC attention checks, PRD §13 `RIA-AC1`). */
  allowNoDimension?: boolean
  /** Item code example shown as placeholder. */
  codeExample: string
}

const LIKERT_INTEREST_4 = ['Tidak tertarik', 'Kurang tertarik', 'Tertarik', 'Sangat tertarik']

export const SUBTESTS: readonly SubtestDef[] = [
  {
    value: 'part1_minat',
    label: 'Bagian 1 — Minat Bidang',
    instrument: 'TMB',
    type: 'likert',
    scaleMin: 1,
    scaleMax: 4,
    scaleLabels: LIKERT_INTEREST_4,
    dimensions: [
      { value: 'M', label: 'M — MIPA' },
      { value: 'T', label: 'T — Teknologi & Rekayasa' },
      { value: 'S', label: 'S — Sosial-Hukum-Pemerintahan' },
      { value: 'E', label: 'E — Ekonomi-Bisnis' },
      { value: 'B', label: 'B — Bahasa-Sastra-Budaya' },
      { value: 'K', label: 'K — Seni-Desain-Kreatif' },
    ],
    codeExample: 'TMB-M1',
  },
  {
    value: 'part2_bakat',
    label: 'Bagian 2 — Bakat (pilihan ganda, 20 menit)',
    instrument: 'TMB',
    type: 'multiple_choice',
    scaleMin: 0,
    scaleMax: 1,
    scaleLabels: [],
    dimensions: [
      { value: 'V', label: 'V — Verbal' },
      { value: 'N', label: 'N — Numerik' },
      { value: 'L', label: 'L — Penalaran Logis' },
      { value: 'S', label: 'S — Spasial' },
    ],
    codeExample: 'TMB-V1 / TMB-SP1',
  },
  {
    value: 'riasec_main',
    label: 'Preferensi aktivitas (skala 1–5)',
    instrument: 'RIA',
    type: 'likert',
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: ['Sangat tidak suka', 'Tidak suka', 'Netral', 'Suka', 'Sangat suka'],
    dimensions: RIASEC,
    allowNoDimension: true,
    codeExample: 'RIA-R1',
  },
  {
    value: 'part_a_activities',
    label: 'Bagian A — Aktivitas (Suka / Tidak)',
    instrument: 'PMK',
    type: 'boolean',
    scaleMin: 0,
    scaleMax: 1,
    scaleLabels: ['Tidak', 'Suka'],
    dimensions: RIASEC,
    codeExample: 'PMK-A-R1',
  },
  {
    value: 'part_b_competencies',
    label: 'Bagian B — Kompetensi (Bisa / Belum)',
    instrument: 'PMK',
    type: 'boolean',
    scaleMin: 0,
    scaleMax: 1,
    scaleLabels: ['Belum', 'Bisa'],
    dimensions: RIASEC,
    codeExample: 'PMK-B-R1',
  },
  {
    value: 'part_c_occupations',
    label: 'Bagian C — Pekerjaan (Tertarik / Tidak)',
    instrument: 'PMK',
    type: 'boolean',
    scaleMin: 0,
    scaleMax: 1,
    scaleLabels: ['Tidak', 'Tertarik'],
    dimensions: RIASEC,
    codeExample: 'PMK-C-R1',
  },
  {
    value: 'part_d_self_estimates',
    label: 'Bagian D — Estimasi Diri (skala 1–7)',
    instrument: 'PMK',
    type: 'likert',
    scaleMin: 1,
    scaleMax: 7,
    scaleLabels: ['Paling rendah', 'Rendah', 'Agak rendah', 'Rata-rata', 'Agak tinggi', 'Tinggi', 'Paling tinggi'],
    dimensions: RIASEC,
    codeExample: 'PMK-D1-R',
  },
  {
    value: 'module1_vark',
    label: 'Modul 1 — Gaya Belajar (VARK)',
    instrument: 'ADN',
    type: 'likert',
    scaleMin: 1,
    scaleMax: 4,
    scaleLabels: ['Tidak pernah', 'Jarang', 'Sering', 'Selalu'],
    dimensions: [
      { value: 'V', label: 'V — Visual' },
      { value: 'A', label: 'A — Auditori' },
      { value: 'R', label: 'R — Baca-Tulis' },
      { value: 'K', label: 'K — Kinestetik' },
    ],
    codeExample: 'ADN-V1',
  },
  {
    value: 'module2_wellbeing',
    label: 'Modul 2 — Kebiasaan Belajar & Sosio-Emosional',
    instrument: 'ADN',
    type: 'likert',
    scaleMin: 1,
    scaleMax: 4,
    scaleLabels: ['Sangat tidak setuju', 'Tidak setuju', 'Setuju', 'Sangat setuju'],
    dimensions: [
      { value: 'MOT', label: 'MOT — Motivasi' },
      { value: 'EFI', label: 'EFI — Efikasi diri' },
      { value: 'REG', label: 'REG — Regulasi belajar' },
      { value: 'KEC', label: 'KEC — Kecemasan belajar' },
      { value: 'SOS', label: 'SOS — Dukungan sosial' },
      { value: 'WEL', label: 'WEL — Butir waspada kesejahteraan' },
    ],
    codeExample: 'ADN-MOT1',
  },
  {
    value: 'module3_career',
    label: 'Modul 3 — Minat Karier Singkat',
    instrument: 'ADN',
    type: 'likert',
    scaleMin: 1,
    scaleMax: 4,
    scaleLabels: LIKERT_INTEREST_4,
    dimensions: RIASEC,
    codeExample: 'ADN-KR1',
  },
]

export const subtestsOf = (code: string) => SUBTESTS.filter((s) => s.instrument === code)
export const findSubtest = (instrument: string, subtest: string) =>
  SUBTESTS.find((s) => s.instrument === instrument && s.value === subtest)

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

export const BADGE_COLORS = ['indigo', 'blue', 'sky', 'emerald', 'amber', 'rose', 'violet', 'zinc'] as const
export type BadgeColor = (typeof BADGE_COLORS)[number]

export interface AssessmentPackage {
  id: string
  name: string
  code: string
  description: string
  price: number
  student_quota: number
  instrument_codes: string[]
  /** Server-computed: more than one instrument. */
  is_bundle: boolean
  is_active: boolean
  badge_color?: string
  created_at?: string
  updated_at?: string
}

export interface PackagePayload {
  name: string
  code: string
  description: string
  price: number
  student_quota: number
  instrument_codes: InstrumentCode[]
  badge_color: string
}

// ---------------------------------------------------------------------------
// Vouchers
// ---------------------------------------------------------------------------

export type DiscountType = 'free_claim' | 'percentage' | 'fixed_amount'

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  free_claim: 'Klaim gratis',
  percentage: 'Potongan persen',
  fixed_amount: 'Potongan nominal',
}

export interface AssessmentVoucher {
  id: string
  code: string
  name: string
  discount_type: DiscountType
  discount_value: number
  max_usage: number
  used_count: number
  valid_from: string
  valid_until: string
  /** Empty = berlaku untuk semua paket. */
  applicable_package_ids?: string[] | null
  is_active: boolean
  created_at?: string
}

export interface VoucherPayload {
  code: string
  name: string
  discount_type: DiscountType
  discount_value: number
  max_usage: number
  valid_from: string
  valid_until: string
  applicable_package_ids: string[]
}

export interface AssessmentVoucherLog {
  id: string
  voucher_id?: string
  voucher?: { code: string; name: string } | null
  school_id: string
  school_name?: string | null
  subscription_id: string
  claimed_at: string
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export const SUBSCRIPTION_STATUSES = ['pending', 'active', 'rejected', 'expired', 'depleted'] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]
export type SubscriptionStatusFilter = SubscriptionStatus | 'all'

export interface SchoolSubscription {
  id: string
  school_id: string
  school_name?: string | null
  package_id: string
  package?: Pick<AssessmentPackage, 'id' | 'name' | 'code'> & Partial<AssessmentPackage>
  voucher_id?: string | null
  voucher?: { code: string; name?: string } | null
  claim_type: 'purchase' | 'voucher' | string
  total_quota: number
  used_quota: number
  amount_due?: number | null
  status: SubscriptionStatus | string
  expires_at?: string | null
  created_at: string
  updated_at?: string
}

export interface SubscriptionListQuery extends ListQuery {
  status?: SubscriptionStatusFilter
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface AssessmentAdminStats {
  total_packages: number
  active_packages: number
  total_vouchers: number
  active_vouchers: number
  total_claims: number
  total_subscriptions: number
  pending_subscriptions: number
  total_attempts: number
  completed_results: number
  total_questions: number
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

/** Options are stored as plain texts; their key is the position (A–E). Tolerates `{key,text}` too. */
export type RawOption = string | { key?: string; text: string }

export interface AssessmentQuestion {
  id: string
  instrument_code: InstrumentCode | string
  subtest: string
  item_code: string
  question_text: string
  question_type: QuestionType
  scale_min?: number | null
  scale_max?: number | null
  scale_labels?: string[] | null
  options?: RawOption[] | null
  correct_key?: string | null
  dimension?: string | null
  weight?: number | null
  order_num?: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface QuestionPayload {
  instrument_code: InstrumentCode
  subtest: string
  item_code: string
  question_text: string
  question_type: QuestionType
  scale_min: number
  scale_max: number
  scale_labels: string[]
  options: string[]
  correct_key: string
  dimension: string
  weight: number
  order_num: number
  is_active: boolean
}

export interface QuestionListQuery extends ListQuery {
  instrument_code?: string
  subtest?: string
}

export const optionText = (o: RawOption) => (typeof o === 'string' ? o : o.text)
