'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { makeQueryClient } from '@/lib/react-query/query-client'
import { useState } from 'react'

/**
 * React Query provider component that wraps the application
 * with QueryClientProvider and development tools.
 *
 * Uses useState to ensure QueryClient is created only once per request
 * in the browser, avoiding issues with React Server Components.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient once per browser session
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
