import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { formatSalary } from '../../lib/format'
import type { Employee } from '../../types'

interface ViewEmployeeModalProps {
  employee: Employee | null
  onClose: () => void
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="col-span-2 text-sm text-slate-900">{value}</dd>
    </div>
  )
}

export function ViewEmployeeModal({ employee, onClose }: ViewEmployeeModalProps) {
  return (
    <Modal
      open={employee !== null}
      onClose={onClose}
      title="Employee details"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {employee && (
        <dl className="divide-y divide-slate-100">
          <Row label="ID" value={employee.id} />
          <Row label="First name" value={employee.first_name} />
          <Row label="Last name" value={employee.last_name} />
          <Row label="Email" value={employee.email} />
          <Row label="Phone" value={employee.phone} />
          <Row label="Address" value={employee.address} />
          <Row label="Salary" value={formatSalary(employee.salary)} />
        </dl>
      )}
    </Modal>
  )
}
