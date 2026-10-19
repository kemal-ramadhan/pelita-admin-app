/** Shared API shapes — see services/docs/API_CONTRACT.md §1 and §5. */

export interface ApiErrorBody {
  error?: string
  code?: string
  message?: string
  /** Optional validation details (string, list, or field → message map). */
  details?: unknown
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface Paginated<T> {
  message?: string
  data: T[]
  meta: PaginationMeta
}

export interface DataResponse<T> {
  message?: string
  data: T
}

export interface ListQuery {
  page?: number
  limit?: number
  search?: string
}

export type UserRole = 'super_admin' | 'admin' | 'institution' | 'customer'

export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'super_admin'] as const

export interface CustomerDTO {
  id: number
  full_name: string
  school_name?: string | null
  birth_place?: string | null
  /** YYYY-MM-DD */
  birth_date?: string | null
  /** 1 = Laki-laki, 2 = Perempuan */
  gender?: number | string | null
  role?: string | null
}

export interface UserDTO {
  id: number
  email: string
  role: UserRole | string
  phone?: string | null
  photo_profile?: string | null
  cover?: string | null
  email_verified_at?: string | null
  customer?: CustomerDTO | null
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export interface LoginResponse extends TokenPair {
  message?: string
  user: UserDTO
}

export interface MeResponse {
  message?: string
  data: UserDTO
  abilities?: string[]
}

export interface UpdateProfilePayload {
  full_name: string
  phone?: string
  birth_place?: string
  /** YYYY-MM-DD */
  birth_date?: string
  /** 1 = Laki-laki, 2 = Perempuan */
  gender?: 1 | 2
}
