import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import type { TokenPair } from '@/types/api'

/**
 * Single axios instance for every API call. All traffic goes through the gateway
 * (VITE_API_BASE_URL, default http://localhost:8888). Paths follow API_CONTRACT.md.
 *
 * Note: no default Content-Type — axios picks JSON for objects and multipart (with boundary)
 * for FormData automatically.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
})

/** Bridge registered by the auth store so this module does not import Pinia directly. */
export interface AuthBridge {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  setTokens: (tokens: TokenPair) => void
  onAuthFailure: () => void
}

let bridge: AuthBridge | null = null

export function registerAuthBridge(b: AuthBridge) {
  bridge = b
}

/** Endpoints that must never trigger a refresh-and-retry cycle. */
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/verify',
  '/auth/register',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/logout',
]

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.request.use((config) => {
  const token = bridge?.getAccessToken()
  if (token) {
    const headers = AxiosHeaders.from(config.headers)
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

let refreshPromise: Promise<string> | null = null

/** Single-flight refresh: concurrent 401s share one POST /auth/refresh call. */
function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise
  const refreshToken = bridge?.getRefreshToken()
  if (!refreshToken) return Promise.reject(new Error('no refresh token'))

  // Plain axios (not `api`) so the refresh call itself never goes through the 401 interceptor.
  refreshPromise = axios
    .post<TokenPair>(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken }, { timeout: 15_000 })
    .then(({ data }) => {
      if (!data?.access_token || !data?.refresh_token) throw new Error('invalid refresh response')
      bridge?.setTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
      return data.access_token
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    // 401 UNAUTHORIZED_GATEWAY = secret antar-service tidak cocok (salah konfigurasi server),
    // bukan sesi pengguna yang habis — jangan refresh/logout.
    const gatewayMisconfig =
      error.response?.status === 401 &&
      (error.response.data as { code?: string } | undefined)?.code === 'UNAUTHORIZED_GATEWAY'
    const status = gatewayMisconfig ? 502 : error.response?.status
    const url = config?.url ?? ''

    if (
      status !== 401 ||
      !config ||
      config._retry ||
      NO_REFRESH_PATHS.some((p) => url.startsWith(p)) ||
      !bridge?.getRefreshToken()
    ) {
      if (status === 401 && config && !NO_REFRESH_PATHS.some((p) => url.startsWith(p))) {
        bridge?.onAuthFailure()
      }
      return Promise.reject(error)
    }

    config._retry = true
    try {
      const token = await refreshAccessToken()
      const headers = AxiosHeaders.from(config.headers)
      headers.set('Authorization', `Bearer ${token}`)
      config.headers = headers
      return api(config)
    } catch {
      bridge?.onAuthFailure()
      return Promise.reject(error)
    }
  },
)

export default api
