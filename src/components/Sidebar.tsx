import { NavLink } from 'react-router-dom'

const navItemBase =
  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'

function UsersIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="9" cy="7" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.5" />
    </svg>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white sm:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm font-semibold text-white">
          E
        </div>
        <span className="text-sm font-semibold text-slate-900">Employee Admin</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${navItemBase} ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`
          }
        >
          <UsersIcon />
          Employees
        </NavLink>
      </nav>
    </aside>
  )
}
