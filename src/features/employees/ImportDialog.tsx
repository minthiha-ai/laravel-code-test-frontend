import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { GraphQLRequestError } from '../../lib/graphql'
import { useImportEmployees, useImportStatus } from '../../hooks/useImportEmployees'

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
  const [uploadPct, setUploadPct] = useState(0)
  const [importId, setImportId] = useState<string | null>(null)

  const statusQuery = useImportStatus(importId)
  const status = statusQuery.data

  // Phase is derived (no phase state) to keep effects free of setState.
  const phase: 'idle' | 'uploading' | 'processing' | 'done' | 'failed' =
    importMut.isPending
      ? 'uploading'
      : importId == null
        ? 'idle'
        : status?.status === 'completed'
          ? 'done'
          : status?.status === 'failed'
            ? 'failed'
            : 'processing'

  // Once processing completes, refresh the list so it's current on close.
  useEffect(() => {
    if (status?.status === 'completed') {
      qc.invalidateQueries({ queryKey: ['employees'] })
    }
  }, [status?.status, qc])

  function reset() {
    setFile(null)
    setError(null)
    setUploadPct(0)
    setImportId(null)
    importMut.reset()
    if (inputRef.current) inputRef.current.value = ''
  }

  function close() {
    if (phase === 'uploading') return // don't interrupt an in-flight upload
    reset()
    onClose()
  }

  function pick(selected: File | null) {
    setError(null)
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
    setUploadPct(0)
    try {
      const res = await importMut.mutateAsync({
        file,
        onProgress: (loaded, total) => {
          if (total) setUploadPct(Math.round((loaded / total) * 100))
        },
      })
      setImportId(res.import_id)
    } catch (err) {
      setError(
        err instanceof GraphQLRequestError ? err.message : 'Upload failed. Please try again.',
      )
    }
  }

  const total = status?.total ?? 0
  const processed = status?.processed ?? 0
  const procPct = total > 0 ? Math.round((processed / total) * 100) : null

  const showResult = phase === 'processing' || phase === 'done'

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import employees"
      footer={
        phase === 'done' ? (
          <Button onClick={close}>View list</Button>
        ) : phase === 'processing' ? (
          <Button variant="secondary" onClick={close}>
            Close (keeps running)
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close} disabled={phase === 'uploading'}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              loading={phase === 'uploading'}
              disabled={!file || phase === 'uploading'}
            >
              Upload
            </Button>
          </>
        )
      }
    >
      {showResult ? (
        <div className="space-y-4">
          {phase === 'done' ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Import complete — {processed.toLocaleString()}
              {total > 0 ? ` of ${total.toLocaleString()}` : ''} rows processed.
            </div>
          ) : (
            <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
              Processing in the background…
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{phase === 'done' ? 'Completed' : 'Importing rows'}</span>
              <span className="font-medium text-slate-700">
                {procPct != null
                  ? `${procPct}%`
                  : `${processed.toLocaleString()} rows`}
              </span>
            </div>
            <ProgressBar value={phase === 'done' ? 100 : procPct} />
            {total > 0 && (
              <p className="text-xs text-slate-400">
                {processed.toLocaleString()} / {total.toLocaleString()} rows
              </p>
            )}
          </div>

          {phase === 'processing' && (
            <p className="text-xs text-slate-400">
              The import runs on the backend queue worker. You can close this dialog — it
              will keep running.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Upload an <span className="font-medium">.xlsx</span>,{' '}
            <span className="font-medium">.xls</span>, or{' '}
            <span className="font-medium">.csv</span> file with columns:{' '}
            <code className="text-xs">first_name, last_name, email, phone, address, salary</code>.
            Existing employees are matched by email and updated; new emails are created.
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

          {phase === 'uploading' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Uploading…</span>
                <span className="font-medium text-slate-700">{uploadPct}%</span>
              </div>
              <ProgressBar value={uploadPct} />
            </div>
          )}

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
