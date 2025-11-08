'use client'

import { useOptimistic, useTransition } from 'react'

export type OptimisticAction<T, TPayload> = (
  currentState: T,
  payload: TPayload
) => T

export interface UseOptimisticMutationOptions<T, TPayload, TResult> {
  initialState: T
  updateFn: OptimisticAction<T, TPayload>
  mutateFn: (payload: TPayload) => Promise<TResult>
  onSuccess?: (result: TResult) => void
  onError?: (error: Error) => void
}

/**
 * Hook for optimistic UI updates with automatic rollback on error
 *
 * @example
 * const { state, mutate, isPending } = useOptimisticMutation({
 *   initialState: link.rating,
 *   updateFn: (_, newRating) => newRating,
 *   mutateFn: async (newRating) => await updateRating(linkId, newRating),
 *   onSuccess: () => toast({ title: 'Updated!' }),
 *   onError: (error) => toast({ title: 'Error', variant: 'destructive' }),
 * })
 */
export function useOptimisticMutation<T, TPayload, TResult = unknown>({
  initialState,
  updateFn,
  mutateFn,
  onSuccess,
  onError,
}: UseOptimisticMutationOptions<T, TPayload, TResult>) {
  const [optimisticState, setOptimisticState] = useOptimistic(
    initialState,
    updateFn
  )
  const [isPending, startTransition] = useTransition()

  const mutate = async (payload: TPayload) => {
    startTransition(async () => {
      // Optimistically update UI
      setOptimisticState(payload)

      try {
        // Execute actual mutation
        const result = await mutateFn(payload)

        // Call success callback
        onSuccess?.(result)
      } catch (error) {
        // On error, the optimistic state automatically reverts to initialState
        onError?.(error instanceof Error ? error : new Error('Mutation failed'))
      }
    })
  }

  return {
    state: optimisticState,
    mutate,
    isPending,
  }
}
