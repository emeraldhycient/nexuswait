import { useState, useCallback } from 'react'

export function useSortState(defaultSortBy = 'createdAt', defaultOrder: 'asc' | 'desc' = 'desc') {
  const [sortBy, setSortBy] = useState(defaultSortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultOrder)

  const handleSort = useCallback(
    (key: string) => {
      if (key === sortBy) {
        setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortBy(key)
        setSortOrder('desc')
      }
    },
    [sortBy],
  )

  return { sortBy, sortOrder, handleSort }
}
