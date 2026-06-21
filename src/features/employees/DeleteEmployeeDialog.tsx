import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/Toast'
import { GraphQLRequestError } from '../../lib/graphql'
import { useDeleteEmployee } from '../../hooks/useEmployeeMutations'
import type { Employee } from '../../types'

interface DeleteEmployeeDialogProps {
  employee: Employee | null
  onClose: () => void
}

export function DeleteEmployeeDialog({ employee, onClose }: DeleteEmployeeDialogProps) {
  const { toast } = useToast()
  const del = useDeleteEmployee()

  async function handleConfirm() {
    if (!employee) return
    try {
      await del.mutateAsync(employee.id)
      toast('success', `Deleted ${employee.first_name} ${employee.last_name}.`)
      onClose()
    } catch (err) {
      toast('error', err instanceof GraphQLRequestError ? err.message : 'Delete failed.')
    }
  }

  return (
    <ConfirmDialog
      open={employee !== null}
      title="Delete employee"
      message={
        employee
          ? `Delete ${employee.first_name} ${employee.last_name} (${employee.email})? This cannot be undone.`
          : ''
      }
      confirmLabel="Delete"
      loading={del.isPending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  )
}
