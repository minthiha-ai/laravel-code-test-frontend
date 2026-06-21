import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { GraphQLRequestError } from '../../lib/graphql'
import { useImportEmployees } from '../../hooks/useImportEmployees'
import type { ImportResult } from '../../types'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
}

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB, matching the backend `max:51200` rule
const ACCEPT = '.xlsx,.xls,.csv'

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const qc = useQueryClient()
  const importMut = useImportEmployees()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  function reset() {
    setFile(null)
    setError(null)
    setResult(null)
    importMut.reset()
    if (inputRef.current) inputRef.current.value = ''
  }

  function close() {
    if (importMut.isPending) return
    reset()
    onClose()
  }

  function pick(selected: File | null) {
    setError(null)
    setResult(null)
    if (selected && selected.size > MAX_BYTES) {
      setFile(null)
      setError('File is too large (max 50 MB).')
      return
    }
    setFile(selected)
  }

  async function handleUpload() {
    if (!file) return
    setError(null)
    try {
      const res = await importMut.mutateAsync(file)
      setResult(res)
    } catch (err) {
      setError(err instanceof GraphQLRequestError ? err.message : 'Upload failed. Please try again.')
    }
  }

  function refreshAndClose() {
    qc.invalidateQueries({ queryKey: ['employees'] })
    close()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import employees"
      footer={
        result ? (
          <>
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
            <Button onClick={refreshAndClose}>Refresh list</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={close} disabled={importMut.isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpload} loading={importMut.isPending} disabled={!file}>
              Upload
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {result.message}
          </div>
          <p className="text-sm text-slate-600">
            The import runs in the background. It updates existing employees matched by{' '}
            <span className="font-medium">email</span> and never creates new ones. Once the
            backend queue worker has processed it, use <span className="font-medium">Refresh
            list</span> to see the changes.
          </p>
          <p className="text-xs text-slate-400">
            Backend requirement: <code>php artisan queue:work</code> must be running for the
            import to be applied.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Upload an <span className="font-medium">.xlsx</span>, <span className="font-medium">.xls</span>,
            or <span className="font-medium">.csv</span> file with columns:{' '}
            <code className="text-xs">first_name, last_name, email, phone, address, salary</code>.
            Rows are matched to existing employees by email.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-center hover:border-indigo-400 hover:bg-slate-50"
          >
            <span className="text-sm font-medium text-slate-700">
              {file ? file.name : 'Choose a file'}
            </span>
            <span className="text-xs text-slate-400">
              {file ? `${(file.size / 1024).toFixed(0)} KB` : 'or click to browse (max 50 MB)'}
            </span>
          </button>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-400">
            The import is processed asynchronously — the backend queue worker
            (<code>php artisan queue:work</code>) must be running.
          </p>
        </div>
      )}
    </Modal>
  )
}
