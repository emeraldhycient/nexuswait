import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useAdminAccounts } from '../../api/hooks'
import SortableHeader from '../../components/SortableHeader'
import { useSortState } from '../../hooks/useSortState'

const planBadge: Record<string, string> = {
  spark: 'bg-cyan-glow/10 text-cyan-glow',
  pulse: 'bg-violet-glow/10 text-violet-glow',
  nexus: 'bg-magenta-glow/10 text-magenta-glow',
  enterprise: 'bg-amber-glow/10 text-amber-glow',
}

export default function AdminAccounts() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [page, setPage] = useState(1)
  const limit = 15
  const { sortBy, sortOrder, handleSort } = useSortState()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page on sort change
  useEffect(() => { setPage(1) }, [sortBy, sortOrder])

  const { data, isLoading, error } = useAdminAccounts({ search: debouncedSearch || undefined, plan: plan || undefined, page, limit, sortBy, sortOrder })

  const accounts: Record<string, unknown>[] = (data as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
  const total: number = ((data as Record<string, unknown>)?.total as number) ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Accounts</h1>
        <p className="text-sm text-nexus-400 mt-1">Manage all platform accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-500" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-11 w-full"
          />
        </div>
        <select
          value={plan}
          onChange={e => { setPlan(e.target.value); setPage(1) }}
          className="input-field w-48"
        >
          <option value="">All Plans</option>
          <option value="spark">Spark</option>
          <option value="pulse">Pulse</option>
          <option value="nexus">Nexus</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-nexus-400">Loading...</div>
        ) : error ? (
          <div className="p-6 text-magenta-glow">Failed to load accounts.</div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-nexus-500">No accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-glow/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Email</th>
                  <SortableHeader label="Plan" sortKey="plan" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Projects</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Subscribers</th>
                  <SortableHeader label="Created" sortKey="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {accounts.map((acct, i) => {
                  const id = acct.id as string
                  const email = (acct.email as string) ?? (acct.ownerEmail as string) ?? '—'
                  const acctPlan = ((acct.plan as string) ?? 'spark').toLowerCase()
                  const projectsCount = (acct._count as Record<string, number>)?.projects ?? (acct.projectsCount as number) ?? 0
                  const subscribersCount = (acct._count as Record<string, number>)?.subscribers ?? (acct.subscribersCount as number) ?? 0
                  const createdAt = acct.createdAt ? new Date(acct.createdAt as string).toLocaleDateString() : '—'
                  return (
                    <tr key={id ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[200px]">{email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${planBadge[acctPlan] ?? 'bg-nexus-600/10 text-nexus-400'}`}>
                          {acctPlan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-nexus-300 font-mono">{projectsCount}</td>
                      <td className="px-4 py-3 text-sm text-nexus-300 font-mono">{subscribersCount}</td>
                      <td className="px-4 py-3 text-xs text-nexus-500 font-mono">{createdAt}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/accounts/${id}`} className="text-nexus-500 hover:text-magenta-glow transition-colors">
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-nexus-500">
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
