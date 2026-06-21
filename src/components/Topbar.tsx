import { useAuth } from '../auth/AuthContext'
import { Button } from './ui/Button'

export function Topbar() {
  const { user, logout } = useAuth()

  const initials = (user?.name ?? user?.username ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-base font-semibold text-slate-900">Employees</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {initials}
          </div>
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-medium text-slate-900">{user?.name}</div>
            <div className="text-xs text-slate-500">@{user?.username}</div>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  )
}
