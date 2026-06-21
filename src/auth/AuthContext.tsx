import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { gqlRequest, setAuthToken, setOnUnauthorized, UnauthorizedError } from '../lib/graphql'
import { LOGIN, ME } from '../lib/operations'
import { queryClient } from '../lib/queryClient'
import type { AuthPayload, User } from '../types'

const TOKEN_KEY = 'employee_admin_token'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  // Track the live token without forcing re-renders mid-request.
  const tokenRef = useRef<string | null>(localStorage.getItem(TOKEN_KEY))

  const applyToken = (token: string | null) => {
    tokenRef.current = token
    setAuthToken(token)
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }

  const logout = useCallback(() => {
    applyToken(null)
    setUser(null)
    setStatus('unauthenticated')
    queryClient.clear()
  }, [])

  // Fire logout whenever the API rejects our token from anywhere.
  useEffect(() => {
    setOnUnauthorized(() => logout())
    return () => setOnUnauthorized(null)
  }, [logout])

  // Bootstrap: if we have a stored token, confirm it by loading `me`.
  useEffect(() => {
    const token = tokenRef.current
    if (!token) {
      setStatus('unauthenticated')
      return
    }
    setAuthToken(token)
    let cancelled = false
    gqlRequest<{ me: User | null }>(ME)
      .then((data) => {
        if (cancelled) return
        if (data.me) {
          setUser(data.me)
          setStatus('authenticated')
        } else {
          logout() // token present but invalid -> me returns null
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof UnauthorizedError) logout()
        else setStatus('unauthenticated')
      })
    return () => {
      cancelled = true
    }
  }, [logout])

  const login = useCallback(async (username: string, password: string) => {
    const data = await gqlRequest<{ login: AuthPayload }>(LOGIN, { username, password })
    applyToken(data.login.access_token)
    const meData = await gqlRequest<{ me: User | null }>(ME)
    setUser(meData.me)
    setStatus('authenticated')
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, status, isAuthenticated: status === 'authenticated', login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
