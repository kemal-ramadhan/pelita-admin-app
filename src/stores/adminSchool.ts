import { defineStore } from 'pinia'
import api from '@/utils/api'
import { getErrorMessage } from '@/utils/errors'
import type { DataResponse, Paginated, PaginationMeta } from '@/types/api'
import type {
  AdminStats,
  CreateSchoolPayload,
  InstitutionAccount,
  School,
  SchoolListQuery,
  SchoolRequest,
} from '@/types/school'

const BASE = '/instantion/admin/schools'

const emptyMeta = (): PaginationMeta => ({ page: 1, limit: 10, total: 0, total_pages: 0 })

export const useAdminSchoolStore = defineStore('adminSchool', {
  state: () => ({
    schools: [] as School[],
    meta: emptyMeta(),
    query: { page: 1, limit: 10, search: '', status: 'all' } as Required<SchoolListQuery>,
    loading: false,
    loaded: false,
    error: null as string | null,

    stats: null as AdminStats | null,
    statsLoading: false,
    statsError: null as string | null,
  }),
  actions: {
    async fetchSchools(patch: Partial<SchoolListQuery> = {}): Promise<void> {
      this.query = { ...this.query, ...patch }
      this.loading = true
      this.error = null
      const { page, limit, search, status } = this.query
      try {
        const { data } = await api.get<Paginated<School>>(BASE, {
          params: {
            page,
            limit,
            search: search.trim() || undefined,
            status: status === 'all' ? undefined : status,
          },
        })
        this.schools = Array.isArray(data?.data) ? data.data : []
        this.meta = data?.meta ?? { ...emptyMeta(), page, limit, total: this.schools.length, total_pages: 1 }
        // If the current page became empty (e.g. after a filter), step back once.
        if (this.schools.length === 0 && page > 1 && this.meta.total > 0) {
          return this.fetchSchools({ page: Math.max(1, this.meta.total_pages) })
        }
        this.loaded = true
      } catch (err) {
        this.error = getErrorMessage(err, 'Gagal memuat daftar sekolah.')
      } finally {
        this.loading = false
      }
    },

    async fetchStats() {
      this.statsLoading = true
      this.statsError = null
      try {
        const { data } = await api.get<DataResponse<AdminStats>>('/instantion/admin/stats')
        this.stats = data.data
      } catch (err) {
        this.statsError = getErrorMessage(err, 'Gagal memuat statistik.')
      } finally {
        this.statsLoading = false
      }
    },

    /** First page of schools for dashboard widgets; does not touch the list state. */
    async fetchPreview(limit = 5) {
      const { data } = await api.get<Paginated<School>>(BASE, { params: { page: 1, limit } })
      return { items: Array.isArray(data?.data) ? data.data : [], total: data?.meta?.total ?? 0 }
    },

    /** Single call: creates the school and (optionally) its institution account atomically. */
    async createSchool(payload: CreateSchoolPayload) {
      const { data } = await api.post<DataResponse<School>>(BASE, payload)
      return data.data
    },

    async updateSchool(id: string, payload: SchoolRequest) {
      const { data } = await api.put<DataResponse<School>>(`${BASE}/${id}`, payload)
      const updated = data?.data
      if (updated) {
        const idx = this.schools.findIndex((s) => s.id === id)
        if (idx >= 0) this.schools[idx] = { ...this.schools[idx], ...updated }
      }
      return updated
    },

    async setSchoolStatus(id: string, isActive: boolean) {
      await api.patch(`${BASE}/${id}/status`, { is_active: isActive })
      const school = this.schools.find((s) => s.id === id)
      if (school) school.is_active = isActive
    },

    async getLinkedAccounts(schoolId: string) {
      const { data } = await api.get<DataResponse<InstitutionAccount[] | null>>(`${BASE}/${schoolId}/accounts`)
      return Array.isArray(data?.data) ? data.data : []
    },

    async linkAccount(schoolId: string, userId: number) {
      await api.post(`${BASE}/${schoolId}/accounts`, { user_id: userId })
    },

    async unlinkAccount(schoolId: string, userId: number) {
      await api.delete(`${BASE}/${schoolId}/accounts`, { data: { user_id: userId } })
    },
  },
})
