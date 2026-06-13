import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '@/api/client'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Run an async fetcher on mount (and when deps change), tracking
 * loading/error/data state. Returns a refetch trigger.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoFetcher = useCallback(fetcher, deps)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await memoFetcher()
      setData(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [memoFetcher])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    memoFetcher()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [memoFetcher])

  return { data, loading, error, refetch: run }
}
