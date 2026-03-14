import { useState, useEffect, useCallback } from 'react'
import { useSortState } from './useSortState'

interface UseListStateOptions {
  defaultSortBy?: string
  defaultSortOrder?: 'asc' | 'desc'
  limit?: number
  debounceMs?: number
}

export function useListState(options: UseListStateOptions = {}) {
  const {
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc',
    limit = 15,
    debounceMs = 300,
  } = options

  const [search, setSearchRaw] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const { sortBy, sortOrder, handleSort } = useSortState(defaultSortBy, defaultSortOrder)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), debounceMs)
    return () => clearTimeout(timer)
  }, [search, debounceMs])

  // Reset page on sort change
  useEffect(() => { setPage(1) }, [sortBy, sortOrder])

  // setSearch also resets page
  const setSearch = useCallback((value: string) => {
    setSearchRaw(value)
    setPage(1)
  }, [])

  return {
    search,
    debouncedSearch,
    setSearch,
    page,
    setPage,
    limit,
    sortBy,
    sortOrder,
    handleSort,
  }
}
