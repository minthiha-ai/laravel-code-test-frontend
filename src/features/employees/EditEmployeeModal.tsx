import { useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { GraphQLRequestError, ValidationError } from '../../lib/graphql'
import { useUpdateEmployee } from '../../hooks/useEmployeeMutations'
import type { Employee } from '../../types'

interface EditEmployeeModalProps {
  // Parent keys this by employee.id so it remounts with fresh state per row.
  employee: Employee
  onClose: () => void
}

interface FormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  salary: string
}

export function EditEmployeeModal({ employee, onClose }: EditEmployeeModalProps) {
  const { toast } = useToast()
  const update = useUpdateEmployee()
  // Initialized directly from props; a keyed remount handles switching rows.
  const [form, setForm] = useState<FormState>(() => ({
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    salary: String(employee.salary),
  }))
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    try {
      await update.mutateAsync({
        id: employee.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        salary: form.salary === '' ? undefined : Number(form.salary),
      })
      toast('success', 'Employee updated.')
      onClose()
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors(err.fields)
      } else {
        toast('error', err instanceof GraphQLRequestError ? err.message : 'Update failed.')
      }
    }
  }

  return (
    <Modal
      open
      onClose={update.isPending ? () => {} : onClose}
      title="Edit employee"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="edit-employee-form" loading={update.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            value={form.first_name}
            onChange={(e) => set('first_name', e.target.value)}
            error={errors.first_name?.[0]}
          />
          <Field
            label="Last name"
            value={form.last_name}
            onChange={(e) => set('last_name', e.target.value)}
            error={errors.last_name?.[0]}
          />
        </div>
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email?.[0]}
        />
        <Field
          label="Phone"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          error={errors.phone?.[0]}
        />
        <Field
          label="Address"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          error={errors.address?.[0]}
        />
        <Field
          label="Salary"
          type="number"
          min="0"
          step="0.01"
          value={form.salary}
          onChange={(e) => set('salary', e.target.value)}
          error={errors.salary?.[0]}
        />
      </form>
    </Modal>
  )
}
