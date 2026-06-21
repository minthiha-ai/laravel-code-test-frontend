import { QueryClient } from '@tanstack/react-query'
import { UnauthorizedError } from './graphql'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Never retry auth failures — they won't fix themselves.
        if (error instanceof UnauthorizedError) return false
        return failureCount < 1
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
