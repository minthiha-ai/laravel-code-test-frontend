import type { ValidationFields } from '../types'

/** Base URL of the API. Empty in dev => relative URLs hit the Vite proxy. */
const API_BASE = import.meta.env.VITE_API_URL ?? ''

export const GRAPHQL_URL = `${API_BASE}/graphql`
export const EXPORT_URL = `${API_BASE}/api/employees/export`

// ---------------------------------------------------------------------------
// Auth token holder + unauthorized hook
//
// The token lives in a module-level variable so non-React code (this client)
// can read it on every request. AuthContext keeps it in sync and registers the
// onUnauthorized callback, which fires whenever the API rejects our token.
// ---------------------------------------------------------------------------

let authToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
}

export function setOnUnauthorized(handler: (() => void) | null): void {
  onUnauthorized = handler
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra }
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  return headers
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class GraphQLRequestError extends Error {}

export class UnauthorizedError extends GraphQLRequestError {
  constructor(message = 'Unauthenticated.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ValidationError extends GraphQLRequestError {
  fields: ValidationFields
  constructor(message: string, fields: ValidationFields) {
    super(message)
    this.name = 'ValidationError'
    this.fields = fields
  }
}

interface GraphQLErrorShape {
  message: string
  extensions?: {
    validation?: Record<string, string[]>
    [key: string]: unknown
  }
}

interface GraphQLResponse<T> {
  data?: T | null
  errors?: GraphQLErrorShape[]
}

/**
 * Strip the `input.` prefix that Lighthouse adds to validation keys for
 * `@spread` inputs (e.g. `input.email` -> `email`), so the edit form can map
 * errors to its fields. Also tidies the prefix out of the message text.
 */
function normalizeValidation(raw: Record<string, string[]>): ValidationFields {
  const out: ValidationFields = {}
  for (const [key, messages] of Object.entries(raw)) {
    const field = key.replace(/^input\./, '')
    out[field] = messages.map((m) => m.replaceAll('input.', '').replace(/\s\s+/g, ' ').trim())
  }
  return out
}

function throwForErrors(errors: GraphQLErrorShape[]): never {
  // Auth failures (from @guard) come back as a normal GraphQL error at HTTP 200.
  if (errors.some((e) => e.message === 'Unauthenticated.')) {
    onUnauthorized?.()
    throw new UnauthorizedError()
  }

  const validationError = errors.find((e) => e.extensions?.validation)
  if (validationError) {
    throw new ValidationError(
      validationError.message,
      normalizeValidation(validationError.extensions!.validation!),
    )
  }

  throw new GraphQLRequestError(errors[0]?.message ?? 'GraphQL request failed.')
}

async function parse<T>(res: Response): Promise<T> {
  // A genuine HTTP 401 can also occur (e.g. before GraphQL even runs).
  if (res.status === 401) {
    onUnauthorized?.()
    throw new UnauthorizedError()
  }

  const body = (await res.json()) as GraphQLResponse<T>
  if (body.errors && body.errors.length > 0) throwForErrors(body.errors)
  if (body.data == null) throw new GraphQLRequestError('Empty response from server.')
  return body.data
}

/** Execute a GraphQL query/mutation with JSON variables. */
export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify({ query, variables: variables ?? {} }),
  })
  return parse<T>(res)
}

/**
 * Download the employees export as a binary Blob. This is a REST endpoint
 * (GraphQL can't return a file body) that still requires the Bearer token, so
 * it can't be a plain <a href> — we fetch with the auth header, then the caller
 * turns the Blob into a download.
 */
export async function downloadExport(): Promise<Blob> {
  const res = await fetch(EXPORT_URL, { headers: authHeaders() })
  if (res.status === 401) {
    onUnauthorized?.()
    throw new UnauthorizedError()
  }
  if (!res.ok) {
    throw new GraphQLRequestError(`Export failed (HTTP ${res.status}).`)
  }
  return res.blob()
}

/**
 * Execute a GraphQL mutation that uploads a single file, per the
 * graphql-multipart-request-spec. Content-Type is intentionally left unset so
 * the browser adds the multipart boundary; the Authorization header is sent.
 */
export async function gqlUpload<T>(
  query: string,
  file: File,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const form = new FormData()
  form.append('operations', JSON.stringify({ query, variables: { ...variables, file: null } }))
  form.append('map', JSON.stringify({ '0': ['variables.file'] }))
  form.append('0', file)

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: authHeaders({ Accept: 'application/json' }),
    body: form,
  })
  return parse<T>(res)
}
