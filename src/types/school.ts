/** Instantion admin shapes — see services/docs/API_CONTRACT.md §6 (Admin). */
import type { ListQuery } from './api'

export const SCHOOL_LEVELS = ['TK', 'SD', 'SMP', 'SMA', 'SMK', 'SLB', 'Lainnya'] as const
export type SchoolLevel = (typeof SCHOOL_LEVELS)[number]

export const SCHOOL_STATUSES = ['Negeri', 'Swasta'] as const

export interface School {
  id: string
  customer_id?: number
  code: string
  name: string
  npsn?: string | null
  nss?: string | null
  school_level: SchoolLevel | string
  school_status?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  province_id?: string | null
  city_id?: string | null
  district_id?: string | null
  postal_code?: string | null
  logo_file_id?: string | null
  timezone?: string | null
  is_active: boolean
  account_count?: number
  created_at?: string
  updated_at?: string
}

export interface SchoolRequest {
  code: string
  name: string
  school_level: SchoolLevel
  npsn?: string | null
  nss?: string | null
  school_status?: string
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  province_id?: string | null
  city_id?: string | null
  district_id?: string | null
  postal_code?: string | null
  timezone?: string
}

export interface SchoolAccountInput {
  email: string
  password: string
  full_name: string
  phone?: string
}

export interface CreateSchoolPayload extends SchoolRequest {
  account?: SchoolAccountInput
}

export type SchoolStatusFilter = 'all' | 'active' | 'inactive'

export interface SchoolListQuery extends ListQuery {
  status?: SchoolStatusFilter
}

export interface InstitutionAccount {
  id: string
  school_id: string
  user_id: number
  created_at?: string
  updated_at?: string
}

export interface AdminStats {
  total_schools: number
  active_schools: number
  inactive_schools: number
  total_teachers: number
}
