import type { ValidationFields } from '../types'

// Empty base in dev so relative URLs go through the Vite proxy.
const API_BASE = import.meta.env.VITE_API_URL ?? ''

export const GRAPHQL_URL = `${API_BASE}/api/graphql`
export const EXPORT_URL = `${API_BASE}/api/employees/export`

// Module-level so the client can read the token outside React. AuthContext
// keeps these in sync.
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

// Lighthouse prefixes @spread input keys with `input.` — strip it so errors
// map to form fields.
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

function handleGraphQLBody<T>(body: GraphQLResponse<T>): T {
  if (body.errors && body.errors.length > 0) throwForErrors(body.errors)
  if (body.data == null) throw new GraphQLRequestError('Empty response from server.')
  return body.data
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    onUnauthorized?.()
    throw new UnauthorizedError()
  }

  const body = (await res.json()) as GraphQLResponse<T>
  return handleGraphQLBody(body)
}

export type ProgressCallback = (loaded: number, total: number | null) => void

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

// Fetch the export with the auth header (so it can't be a plain <a href>) and
// hand back a Blob for the caller to download.
export async function downloadExport(onProgress?: ProgressCallback): Promise<Blob> {
  const res = await fetch(EXPORT_URL, { headers: authHeaders() })
  if (res.status === 401) {
    onUnauthorized?.()
    throw new UnauthorizedError()
  }
  if (!res.ok) {
    throw new GraphQLRequestError(`Export failed (HTTP ${res.status}).`)
  }

  const lenHeader = res.headers.get('Content-Length')
  const total = lenHeader ? Number.parseInt(lenHeader, 10) : null

  if (!res.body || !onProgress) {
    const blob = await res.blob()
    onProgress?.(blob.size, total ?? blob.size)
    return blob
  }

  // Stream the body to report bytes as they arrive.
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    onProgress(loaded, total)
  }

  return new Blob(chunks as BlobPart[], {
    type: res.headers.get('Content-Type') ?? 'application/octet-stream',
  })
}

// Single-file upload per the graphql-multipart-request-spec. Uses XHR (not
// fetch) for upload progress; Content-Type is left unset so the browser sets
// the multipart boundary.
export function gqlUpload<T>(
  query: string,
  file: File,
  variables: Record<string, unknown> = {},
  onUploadProgress?: ProgressCallback,
): Promise<T> {
  const form = new FormData()
  form.append('operations', JSON.stringify({ query, variables: { ...variables, file: null } }))
  form.append('map', JSON.stringify({ '0': ['variables.file'] }))
  form.append('0', file)

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', GRAPHQL_URL)
    xhr.setRequestHeader('Accept', 'application/json')
    if (authToken) xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)

    if (onUploadProgress) {
      xhr.upload.onprogress = (e) =>
        onUploadProgress(e.loaded, e.lengthComputable ? e.total : null)
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        onUnauthorized?.()
        reject(new UnauthorizedError())
        return
      }
      let body: GraphQLResponse<T>
      try {
        body = JSON.parse(xhr.responseText) as GraphQLResponse<T>
      } catch {
        reject(new GraphQLRequestError('Invalid response from server.'))
        return
      }
      try {
        resolve(handleGraphQLBody(body))
      } catch (err) {
        reject(err)
      }
    }

    xhr.onerror = () => reject(new GraphQLRequestError('Network error during upload.'))
    xhr.send(form)
  })
}
