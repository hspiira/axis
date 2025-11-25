/**
 * URL Search Params Hook
 *
 * Manages filter state persistence using URL query parameters
 * Allows users to bookmark, share, and refresh pages while maintaining filters
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useURLSearchParams<T extends Record<string, any>>() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse URL params into typed object
  const params = useMemo(() => {
    const result: Record<string, any> = {}

    searchParams.forEach((value, key) => {
      // Handle boolean values
      if (value === 'true') {
        result[key] = true
      } else if (value === 'false') {
        result[key] = false
      } else {
        result[key] = value
      }
    })

    return result as T
  }, [searchParams])

  // Update URL params
  const updateParams = useCallback(
    (newParams: Partial<T>) => {
      const updatedParams = new URLSearchParams()

      // Add all non-empty values
      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          updatedParams.set(key, String(value))
        }
      })

      setSearchParams(updatedParams, { replace: true })
    },
    [setSearchParams]
  )

  // Clear all params
  const clearParams = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  // Update a single param
  const updateParam = useCallback(
    (key: keyof T, value: any) => {
      const current = Object.fromEntries(searchParams.entries())

      if (value === undefined || value === null || value === '') {
        delete current[key as string]
      } else {
        current[key as string] = String(value)
      }

      updateParams(current as T)
    },
    [searchParams, updateParams]
  )

  return {
    params,
    updateParams,
    updateParam,
    clearParams,
  }
}
