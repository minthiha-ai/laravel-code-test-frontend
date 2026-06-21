export interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  salary: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  name: string
  username: string
  email: string
  created_at: string
  updated_at: string
}

export interface AuthPayload {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string | null
}

export interface PaginatorInfo {
  count: number
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  hasMorePages: boolean
}

export interface Paginated<T> {
  data: T[]
  paginatorInfo: PaginatorInfo
}

export interface ImportResult {
  message: string
  queued: boolean
  import_id: string
}

export type ImportStatusValue =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'unknown'

export interface ImportStatus {
  status: ImportStatusValue
  processed: number
  total: number
}

// Validation errors keyed by field name.
export type ValidationFields = Record<string, string[]>
