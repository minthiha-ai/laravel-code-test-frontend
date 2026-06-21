import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useToast } from '../../components/ui/Toast'
import { downloadExport, UnauthorizedError } from '../../lib/graphql'

export function ExportButton() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pct, setPct] = useState<number | null>(null)

  async function handleExport() {
    setLoading(true)
    setPct(null) // indeterminate until bytes start streaming
    try {
      const blob = await downloadExport((loaded, total) => {
        setPct(total && total > 0 ? Math.round((loaded / total) * 100) : null)
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'employees.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast('success', 'Export downloaded.')
    } catch (err) {
      // UnauthorizedError already triggers a global logout — no extra toast.
      if (!(err instanceof UnauthorizedError)) {
        toast('error', 'Export failed. Please try again.')
      }
    } finally {
      setLoading(false)
      setPct(null)
    }
  }

  return (
    <div className="relative">
      <Button variant="secondary" onClick={handleExport} loading={loading}>
        {loading && pct != null ? `Export ${pct}%` : 'Export'}
      </Button>
      {loading && (
        <div className="absolute -bottom-2 left-0 right-0">
          <ProgressBar value={pct} className="h-1" />
        </div>
      )}
    </div>
  )
}
