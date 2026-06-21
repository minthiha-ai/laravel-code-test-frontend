import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlRequest } from '../lib/graphql'
import { DELETE_EMPLOYEE, UPDATE_EMPLOYEE } from '../lib/operations'
import type { Employee } from '../types'

export interface UpdateEmployeeInput {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  address?: string
  salary?: number
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) =>
      gqlRequest<{ updateEmployee: Employee }>(UPDATE_EMPLOYEE, { input }).then(
        (r) => r.updateEmployee,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deleteEmployee: Employee }>(DELETE_EMPLOYEE, { id }).then(
        (r) => r.deleteEmployee,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
