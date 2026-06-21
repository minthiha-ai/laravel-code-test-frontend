import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { downloadExport, UnauthorizedError } from '../../lib/graphql'

export function ExportButton() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const blob = await downloadExport()
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
    }
  }

  return (
    <Button variant="secondary" onClick={handleExport} loading={loading}>
      Export
    </Button>
  )
}
