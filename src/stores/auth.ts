import { defineStore } from 'pinia'
import type { AxiosProgressEvent } from 'axios'
import api from '@/utils/api'
import { resetAllStores } from './registry'
import {
  ADMIN_ROLES,
  type DataResponse,
  type LoginResponse,
  type MeResponse,
  type TokenPair,
  type UpdateProfilePayload,
  type UserDTO,
  type UserRole,
} from '@/types/api'

export class AccessDeniedError extends Error {
  constructor(message = 'Akses ditolak. Aplikasi ini hanya untuk akun admin platform.') {
    super(message)
    this.name = 'AccessDeniedError'
  }
}

export type ProgressCallback = (percent: number) => void

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  institution: 'Institusi',
  customer: 'Pelanggan',
}

const progressHandler = (cb?: ProgressCallback) =>
  cb
    ? (e: AxiosProgressEvent) => {
        if (e.total) cb(Math.round((e.loaded / e.total) * 100))
      }
    : undefined

/**
 * Single source of truth for the session. Only the token pair is persisted;
 * the user profile (which may contain large base64 images) is refetched via GET /auth/me.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
    refreshToken: null as string | null,
    user: null as UserDTO | null,
    abilities: [] as string[],
  }),
  getters: {
    isAuthenticated: (s) => !!s.accessToken,
    isAdmin: (s) => !!s.user && ADMIN_ROLES.includes(s.user.role as UserRole),
    displayName: (s) => s.user?.customer?.full_name || s.user?.email || 'Pengguna',
    roleLabel: (s) => (s.user ? (ROLE_LABELS[s.user.role] ?? s.user.role) : ''),
  },
  actions: {
    setTokens(tokens: TokenPair) {
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token
    },

    /** Stores a LoginResponse and enforces the admin-only rule (contract §2). */
    applyLogin(resp: LoginResponse) {
      this.setTokens(resp)
      this.user = resp.user
      if (!this.isAdmin) {
        // Local clear only: calling /auth/logout would revoke this user's sessions in the schools app.
        this.clearSession()
        throw new AccessDeniedError()
      }
    },

    async login(email: string, password: string) {
      const { data } = await api.post<LoginResponse>('/auth/login', { email: email.trim(), password })
      this.applyLogin(data)
    },

    async verifyOtp(email: string, otp: string) {
      // Backend binds `otp` as a number.
      const { data } = await api.post<LoginResponse>('/auth/verify', { email: email.trim(), otp: Number(otp) })
      this.applyLogin(data)
    },

    async resendOtp(email: string) {
      await api.post('/auth/resend-otp', { email: email.trim() })
    },

    async fetchMe() {
      const { data } = await api.get<MeResponse>('/auth/me')
      this.user = data.data
      this.abilities = data.abilities ?? []
      return data.data
    },

    async updateProfile(payload: UpdateProfilePayload) {
      const { data } = await api.put<DataResponse<UserDTO>>('/auth/profile', payload)
      if (data?.data) this.user = data.data
      else await this.fetchMe()
    },

    async uploadPhotoProfile(file: File, onProgress?: ProgressCallback) {
      const form = new FormData()
      form.append('photo', file)
      const { data } = await api.put<DataResponse<UserDTO>>('/auth/photo-profile', form, {
        onUploadProgress: progressHandler(onProgress),
      })
      if (data?.data) this.user = data.data
      else await this.fetchMe()
    },

    async uploadCover(file: File, onProgress?: ProgressCallback) {
      const form = new FormData()
      form.append('cover', file)
      const { data } = await api.put<DataResponse<UserDTO>>('/auth/cover', form, {
        onUploadProgress: progressHandler(onProgress),
      })
      if (data?.data) this.user = data.data
      else await this.fetchMe()
    },

    async forgotPassword(email: string) {
      await api.post('/auth/forgot-password', { email: email.trim() })
    },

    async resetPassword(token: string, password: string) {
      await api.post('/auth/reset-password', { token, password })
    },

    /** Revokes the session server-side (best effort) and wipes all client state. */
    async logout() {
      const refresh = this.refreshToken
      if (this.accessToken) {
        try {
          await api.post('/auth/logout', refresh ? { refresh_token: refresh } : {}, { timeout: 8000 })
        } catch {
          /* session is cleared locally regardless */
        }
      }
      this.clearSession()
    },

    clearSession() {
      resetAllStores()
    },
  },
  persist: {
    key: 'admin-auth',
    pick: ['accessToken', 'refreshToken'],
  },
})
