import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { gqlRequest } from '../lib/graphql'
import { EMPLOYEES } from '../lib/operations'
import type { Employee, Paginated } from '../types'

export function employeesKey(page: number, perPage: number) {
  return ['employees', { page, perPage }] as const
}

export function useEmployees(page: number, perPage: number) {
  return useQuery({
    queryKey: employeesKey(page, perPage),
    queryFn: () =>
      gqlRequest<{ employees: Paginated<Employee> }>(EMPLOYEES, {
        first: perPage,
        page,
      }).then((r) => r.employees),
    placeholderData: keepPreviousData,
  })
}
