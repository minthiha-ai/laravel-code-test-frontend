import { useMutation } from '@tanstack/react-query'
import { gqlUpload } from '../lib/graphql'
import { IMPORT_EMPLOYEES } from '../lib/operations'
import type { ImportResult } from '../types'

/**
 * Upload a spreadsheet for bulk-update. The import is processed asynchronously
 * on the backend queue, so this does NOT invalidate the list automatically —
 * the dialog offers a manual refresh once the worker has run.
 */
export function useImportEmployees() {
  return useMutation({
    mutationFn: (file: File) =>
      gqlUpload<{ importEmployees: ImportResult }>(IMPORT_EMPLOYEES, file).then(
        (r) => r.importEmployees,
      ),
  })
}
