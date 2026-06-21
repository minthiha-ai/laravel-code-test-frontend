import type { ReactNode } from 'react'
import type { Employee } from '../../types'
import { formatSalary } from '../../lib/format'

interface EmployeesTableProps {
  employees: Employee[]
  renderActions?: (employee: Employee) => ReactNode
}

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'
const td = 'px-4 py-3 text-sm text-slate-700'

export function EmployeesTable({ employees, renderActions }: EmployeesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className={th}>ID</th>
            <th className={th}>Name</th>
            <th className={th}>Email</th>
            <th className={th}>Phone</th>
            <th className={th}>Address</th>
            <th className={`${th} text-right`}>Salary</th>
            {renderActions && <th className={`${th} text-right`}>Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50/60">
              <td className={`${td} text-slate-400`}>{e.id}</td>
              <td className={`${td} font-medium text-slate-900`}>
                {e.first_name} {e.last_name}
              </td>
              <td className={td}>{e.email}</td>
              <td className={`${td} whitespace-nowrap`}>{e.phone}</td>
              <td className={`${td} max-w-xs truncate`} title={e.address}>
                {e.address}
              </td>
              <td className={`${td} whitespace-nowrap text-right tabular-nums`}>
                {formatSalary(e.salary)}
              </td>
              {renderActions && (
                <td className={`${td} text-right`}>
                  <div className="flex justify-end">{renderActions(e)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EmployeesTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="h-3 w-8 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}
