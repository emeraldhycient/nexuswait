import type { QueryClient } from '@tanstack/react-query'

/** User- and account-scoped query key prefixes. Cleared on logout and when token changes so a new session never sees previous user's data. */
const USER_SCOPED_PREFIXES = new Set([
  'projects',
  'project',
  'subscribers',
  'account',
  'billing',
  'api-keys',
  'hosted-page',
  'integrations',
  'analytics',
  'referrals',
  'notifications',
  'search',
  'public-subscriber-count',
  'admin',
])

export function clearUserScopeCache(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: (query) => {
      const firstKey = query.queryKey[0]
      return typeof firstKey === 'string' && USER_SCOPED_PREFIXES.has(firstKey)
    },
  })
}
