import { useState } from 'react'
import { useEmployees } from '../hooks/useEmployees'
import {
  EmployeesTable,
  EmployeesTableSkeleton,
} from '../features/employees/EmployeesTable'
import { Pagination } from '../features/employees/Pagination'
import { ViewEmployeeModal } from '../features/employees/ViewEmployeeModal'
import { EditEmployeeModal } from '../features/employees/EditEmployeeModal'
import { DeleteEmployeeDialog } from '../features/employees/DeleteEmployeeDialog'
import { ImportDialog } from '../features/employees/ImportDialog'
import { ExportButton } from '../features/employees/ExportButton'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import type { Employee } from '../types'

export function EmployeesPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const [viewing, setViewing] = useState<Employee | null>(null)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)
  const [importing, setImporting] = useState(false)

  const { data, isLoading, isError, error, isFetching, refetch } = useEmployees(page, perPage)

  function changePerPage(next: number) {
    setPerPage(next)
    setPage(1) // page size change resets to the first page
  }

  const employees = data?.data ?? []
  const info = data?.paginatorInfo

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Employees</h2>
          <p className="text-sm text-slate-500">
            {info ? `${info.total.toLocaleString()} total` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImporting(true)}>
            Import
          </Button>
          <ExportButton />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <EmployeesTableSkeleton rows={perPage > 25 ? 12 : perPage} />
        ) : isError ? (
          <EmptyState
            title="Couldn’t load employees"
            description={error instanceof Error ? error.message : 'Something went wrong.'}
            action={
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        ) : employees.length === 0 ? (
          <EmptyState title="No employees found" description="There are no employees to display." />
        ) : (
          <>
            <EmployeesTable
              employees={employees}
              renderActions={(e) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setViewing(e)}>
                    View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(e)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setDeleting(e)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            />
            {info && (
              <Pagination
                page={info.currentPage}
                lastPage={info.lastPage}
                perPage={info.perPage}
                total={info.total}
                isFetching={isFetching}
                onPageChange={setPage}
                onPerPageChange={changePerPage}
              />
            )}
          </>
        )}
      </div>

      <ImportDialog open={importing} onClose={() => setImporting(false)} />
      <ViewEmployeeModal employee={viewing} onClose={() => setViewing(null)} />
      {editing && (
        <EditEmployeeModal key={editing.id} employee={editing} onClose={() => setEditing(null)} />
      )}
      <DeleteEmployeeDialog employee={deleting} onClose={() => setDeleting(null)} />
    </div>
  )
}
