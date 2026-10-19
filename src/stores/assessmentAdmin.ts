import { defineStore } from 'pinia'
import api from '@/utils/api'
import { getErrorMessage } from '@/utils/errors'
import type { DataResponse, PaginationMeta } from '@/types/api'
import type {
  AssessmentAdminStats,
  AssessmentPackage,
  AssessmentQuestion,
  AssessmentVoucher,
  AssessmentVoucherLog,
  PackagePayload,
  QuestionListQuery,
  QuestionPayload,
  SchoolSubscription,
  SubscriptionListQuery,
  VoucherPayload,
} from '@/types/assessment'

/** API_CONTRACT.md §13.3 */
const BASE = '/assessment/admin'

/** Upper bound for lists the admin UI shows in full (packages / vouchers). §13: limit max 100. */
const FULL_LIST_LIMIT = 100

const emptyMeta = (limit = 20): PaginationMeta => ({ page: 1, limit, total: 0, total_pages: 0 })

interface ListBody<T> {
  message?: string
  data?: T[] | null
  meta?: PaginationMeta
}

/** Lists are `{ data, meta }` (§1/§13); tolerate a missing meta for non-paginated endpoints. */
function normalizeList<T>(body: ListBody<T> | undefined, page: number, limit: number) {
  const items = Array.isArray(body?.data) ? body.data : []
  const meta = body?.meta ?? { page, limit, total: items.length, total_pages: items.length ? 1 : 0 }
  return { items, meta }
}

export interface DeleteQuestionResult {
  /** true when the backend kept the row and set is_active=false (item already has responses). */
  soft: boolean
  message?: string
}

export const useAssessmentAdminStore = defineStore('assessmentAdmin', {
  state: () => ({
    stats: null as AssessmentAdminStats | null,
    statsLoading: false,
    statsError: null as string | null,

    packages: [] as AssessmentPackage[],
    packagesLoading: false,
    packagesLoaded: false,
    packagesError: null as string | null,

    vouchers: [] as AssessmentVoucher[],
    vouchersLoading: false,
    vouchersError: null as string | null,

    voucherLogs: [] as AssessmentVoucherLog[],
    voucherLogsMeta: emptyMeta(),
    voucherLogsLoading: false,
    voucherLogsError: null as string | null,

    subscriptions: [] as SchoolSubscription[],
    subscriptionsMeta: emptyMeta(),
    subscriptionsQuery: { page: 1, limit: 20, status: 'pending' } as Required<Pick<SubscriptionListQuery, 'page' | 'limit' | 'status'>>,
    subscriptionsLoading: false,
    subscriptionsError: null as string | null,

    questions: [] as AssessmentQuestion[],
    questionsMeta: emptyMeta(),
    questionsQuery: { page: 1, limit: 20, instrument_code: '', subtest: '', search: '' } as Required<QuestionListQuery>,
    questionsLoading: false,
    questionsError: null as string | null,
  }),

  actions: {
    // --- Stats -------------------------------------------------------------
    async fetchStats() {
      this.statsLoading = true
      this.statsError = null
      try {
        const { data } = await api.get<DataResponse<AssessmentAdminStats> | AssessmentAdminStats>(`${BASE}/stats`)
        this.stats = 'data' in data && data.data ? data.data : (data as AssessmentAdminStats)
      } catch (err) {
        this.statsError = getErrorMessage(err, 'Gagal memuat statistik asesmen.')
      } finally {
        this.statsLoading = false
      }
    },

    // --- Packages ----------------------------------------------------------
    async fetchPackages() {
      this.packagesLoading = true
      this.packagesError = null
      try {
        const { data } = await api.get<ListBody<AssessmentPackage>>(`${BASE}/packages`, {
          params: { page: 1, limit: FULL_LIST_LIMIT },
        })
        this.packages = normalizeList(data, 1, FULL_LIST_LIMIT).items
        this.packagesLoaded = true
      } catch (err) {
        this.packagesError = getErrorMessage(err, 'Gagal memuat daftar paket asesmen.')
      } finally {
        this.packagesLoading = false
      }
    },

    async createPackage(payload: PackagePayload) {
      const { data } = await api.post<DataResponse<AssessmentPackage>>(`${BASE}/packages`, payload)
      return data?.data
    },

    async updatePackage(id: string, payload: PackagePayload) {
      const { data } = await api.put<DataResponse<AssessmentPackage>>(`${BASE}/packages/${id}`, payload)
      const updated = data?.data
      if (updated) {
        const idx = this.packages.findIndex((p) => p.id === id)
        if (idx >= 0) this.packages[idx] = { ...this.packages[idx], ...updated }
      }
      return updated
    },

    async setPackageStatus(id: string, isActive: boolean) {
      const { data } = await api.patch<{ is_active?: boolean; data?: AssessmentPackage }>(`${BASE}/packages/${id}/status`, {
        is_active: isActive,
      })
      const next = data?.data?.is_active ?? data?.is_active ?? isActive
      const pkg = this.packages.find((p) => p.id === id)
      if (pkg) pkg.is_active = next
      return next
    },

    // --- Vouchers ----------------------------------------------------------
    async fetchVouchers() {
      this.vouchersLoading = true
      this.vouchersError = null
      try {
        const { data } = await api.get<ListBody<AssessmentVoucher>>(`${BASE}/vouchers`, {
          params: { page: 1, limit: FULL_LIST_LIMIT },
        })
        this.vouchers = normalizeList(data, 1, FULL_LIST_LIMIT).items
      } catch (err) {
        this.vouchersError = getErrorMessage(err, 'Gagal memuat daftar voucher.')
      } finally {
        this.vouchersLoading = false
      }
    },

    async createVoucher(payload: VoucherPayload) {
      const { data } = await api.post<DataResponse<AssessmentVoucher>>(`${BASE}/vouchers`, payload)
      return data?.data
    },

    async setVoucherStatus(id: string, isActive: boolean) {
      const { data } = await api.patch<{ is_active?: boolean; data?: AssessmentVoucher }>(`${BASE}/vouchers/${id}/status`, {
        is_active: isActive,
      })
      const next = data?.data?.is_active ?? data?.is_active ?? isActive
      const v = this.vouchers.find((x) => x.id === id)
      if (v) v.is_active = next
      return next
    },

    async fetchVoucherLogs(pageArg?: number, limitArg?: number) {
      const page = pageArg ?? (this.voucherLogsMeta.page || 1)
      const limit = limitArg ?? (this.voucherLogsMeta.limit || 20)
      this.voucherLogsLoading = true
      this.voucherLogsError = null
      try {
        const { data } = await api.get<ListBody<AssessmentVoucherLog>>(`${BASE}/vouchers/logs`, { params: { page, limit } })
        const { items, meta } = normalizeList(data, page, limit)
        this.voucherLogs = items
        this.voucherLogsMeta = meta
      } catch (err) {
        this.voucherLogsError = getErrorMessage(err, 'Gagal memuat riwayat klaim voucher.')
      } finally {
        this.voucherLogsLoading = false
      }
    },

    // --- Subscriptions -----------------------------------------------------
    async fetchSubscriptions(patch: Partial<SubscriptionListQuery> = {}): Promise<void> {
      this.subscriptionsQuery = {
        page: patch.page ?? this.subscriptionsQuery.page,
        limit: patch.limit ?? this.subscriptionsQuery.limit,
        status: patch.status ?? this.subscriptionsQuery.status,
      }
      const { page, limit, status } = this.subscriptionsQuery
      this.subscriptionsLoading = true
      this.subscriptionsError = null
      try {
        const { data } = await api.get<ListBody<SchoolSubscription>>(`${BASE}/subscriptions`, {
          params: { page, limit, status: status === 'all' ? undefined : status },
        })
        const { items, meta } = normalizeList(data, page, limit)
        this.subscriptions = items
        this.subscriptionsMeta = meta
        if (items.length === 0 && page > 1 && meta.total > 0) {
          return this.fetchSubscriptions({ page: Math.max(1, meta.total_pages) })
        }
      } catch (err) {
        this.subscriptionsError = getErrorMessage(err, 'Gagal memuat langganan sekolah.')
      } finally {
        this.subscriptionsLoading = false
      }
    },

    async setSubscriptionStatus(id: string, status: 'active' | 'rejected') {
      const { data } = await api.patch<DataResponse<SchoolSubscription>>(`${BASE}/subscriptions/${id}/status`, { status })
      const sub = this.subscriptions.find((s) => s.id === id)
      if (sub) Object.assign(sub, data?.data ?? {}, { status: data?.data?.status ?? status })
      return data?.data
    },

    // --- Questions ---------------------------------------------------------
    async fetchQuestions(patch: Partial<QuestionListQuery> = {}): Promise<void> {
      this.questionsQuery = { ...this.questionsQuery, ...patch }
      const { page, limit, instrument_code, subtest, search } = this.questionsQuery
      this.questionsLoading = true
      this.questionsError = null
      try {
        const { data } = await api.get<ListBody<AssessmentQuestion>>(`${BASE}/questions`, {
          params: {
            page,
            limit,
            instrument_code: instrument_code || undefined,
            subtest: subtest || undefined,
            search: search.trim() || undefined,
          },
        })
        const { items, meta } = normalizeList(data, page, limit)
        this.questions = items
        this.questionsMeta = meta
        if (items.length === 0 && page > 1 && meta.total > 0) {
          return this.fetchQuestions({ page: Math.max(1, meta.total_pages) })
        }
      } catch (err) {
        this.questionsError = getErrorMessage(err, 'Gagal memuat bank soal asesmen.')
      } finally {
        this.questionsLoading = false
      }
    },

    async getQuestion(id: string) {
      const { data } = await api.get<DataResponse<AssessmentQuestion>>(`${BASE}/questions/${id}`)
      return data?.data
    },

    async createQuestion(payload: QuestionPayload) {
      const { data } = await api.post<DataResponse<AssessmentQuestion>>(`${BASE}/questions`, payload)
      return data?.data
    },

    async updateQuestion(id: string, payload: QuestionPayload) {
      const { data } = await api.put<DataResponse<AssessmentQuestion>>(`${BASE}/questions/${id}`, payload)
      return data?.data
    },

    /**
     * §13.3: DELETE of an item that already has responses is soft (is_active=false).
     * Detected from the response body (`soft_deleted`, `data.is_active === false`) when provided.
     */
    async deleteQuestion(id: string): Promise<DeleteQuestionResult> {
      const res = await api.delete<{ message?: string; soft_deleted?: boolean; soft?: boolean; data?: Partial<AssessmentQuestion> | null }>(
        `${BASE}/questions/${id}`,
      )
      const body = res.data ?? {}
      const soft = body.soft_deleted === true || body.soft === true || body.data?.is_active === false
      return { soft, message: body.message }
    },
  },
})
