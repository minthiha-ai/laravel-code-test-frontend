import { useMutation, useQuery } from '@tanstack/react-query'
import { gqlRequest, gqlUpload, type ProgressCallback } from '../lib/graphql'
import { IMPORT_EMPLOYEES, IMPORT_STATUS } from '../lib/operations'
import type { ImportResult, ImportStatus } from '../types'

// Upload runs async on the backend queue, so we don't invalidate the list here
// — the dialog polls useImportStatus and refreshes when it finishes.
export function useImportEmployees() {
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: ProgressCallback }) =>
      gqlUpload<{ importEmployees: ImportResult }>(IMPORT_EMPLOYEES, file, {}, onProgress).then(
        (r) => r.importEmployees,
      ),
  })
}

// Polls every 800ms until the import is completed or failed.
export function useImportStatus(importId: string | null) {
  return useQuery({
    queryKey: ['importStatus', importId],
    enabled: importId != null,
    queryFn: () =>
      gqlRequest<{ importStatus: ImportStatus }>(IMPORT_STATUS, { id: importId }).then(
        (r) => r.importStatus,
      ),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'completed' || status === 'failed' ? false : 800
    },
  })
}
