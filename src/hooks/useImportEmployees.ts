import { useMutation, useQuery } from '@tanstack/react-query'
import { gqlRequest, gqlUpload, type ProgressCallback } from '../lib/graphql'
import { IMPORT_EMPLOYEES, IMPORT_STATUS } from '../lib/operations'
import type { ImportResult, ImportStatus } from '../types'

/**
 * Upload a spreadsheet for bulk-upsert. The import is processed asynchronously
 * on the backend queue, so this does NOT invalidate the list automatically —
 * the dialog polls `useImportStatus` and refreshes once processing completes.
 *
 * `onProgress` reports upload bytes so the dialog can show an upload bar.
 */
export function useImportEmployees() {
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: ProgressCallback }) =>
      gqlUpload<{ importEmployees: ImportResult }>(IMPORT_EMPLOYEES, file, {}, onProgress).then(
        (r) => r.importEmployees,
      ),
  })
}

/**
 * Poll the live progress of a queued import. Polls every 800ms until the
 * backend reports `completed` or `failed`, then stops.
 */
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
