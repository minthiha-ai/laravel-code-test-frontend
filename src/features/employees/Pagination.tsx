import { Button } from '../../components/ui/Button'

const PAGE_SIZES = [10, 25, 50, 100] as const

interface PaginationProps {
  page: number
  lastPage: number
  perPage: number
  total: number
  isFetching: boolean
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

export function Pagination({
  page,
  lastPage,
  perPage,
  total,
  isFetching,
  onPageChange,
  onPerPageChange,
}: PaginationProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * perPage + 1
  const lastItem = Math.min(page * perPage, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row">
      <div className="flex items-center gap-3">
        <span>
          {firstItem.toLocaleString()}–{lastItem.toLocaleString()} of{' '}
          <span className="font-medium text-slate-900">{total.toLocaleString()}</span>
        </span>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-500">Rows</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white py-1 pl-2 pr-7 text-sm"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <span className="mr-1 text-slate-500">
          Page <span className="font-medium text-slate-900">{page}</span> of{' '}
          {lastPage.toLocaleString()}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page <= 1 || isFetching}
          aria-label="First page"
        >
          «
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isFetching}
          aria-label="Previous page"
        >
          ‹ Prev
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage || isFetching}
          aria-label="Next page"
        >
          Next ›
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(lastPage)}
          disabled={page >= lastPage || isFetching}
          aria-label="Last page"
        >
          »
        </Button>
      </div>
    </div>
  )
}
