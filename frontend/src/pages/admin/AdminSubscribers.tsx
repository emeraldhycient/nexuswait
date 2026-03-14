import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Users } from 'lucide-react'
import { useAdminSubscribers, useAdminFlaggedSubscribers } from '../../api/hooks'
import SortableHeader from '../../components/SortableHeader'
import { useSortState } from '../../hooks/useSortState'

type TabId = 'all' | 'flagged'

export default function AdminSubscribers() {
  const [activeTab, setActiveTab] = useState<TabId>('all')

  // All subscribers state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20
  const { sortBy, sortOrder, handleSort } = useSortState()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => { setPage(1) }, [sortBy, sortOrder])

  const { data, isLoading, error } = useAdminSubscribers({
    search: debouncedSearch || undefined,
    source: source || undefined,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  const subscribers: Record<string, unknown>[] = (data as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
  const total: number = ((data as Record<string, unknown>)?.total as number) ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // Flagged subscribers
  const { data: flaggedData, isLoading: flaggedLoading, error: flaggedError } = useAdminFlaggedSubscribers()
  const flagged: Record<string, unknown>[] = (flaggedData as Record<string, unknown>[]) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Subscribers</h1>
        <p className="text-sm text-nexus-400 mt-1">All subscribers across the platform.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-nexus-800/40 border border-nexus-700/20 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'all' ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-nexus-400 hover:text-nexus-200'
          }`}
        >
          <Users size={14} /> All Subscribers
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('flagged')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'flagged' ? 'bg-amber-glow/10 text-amber-glow' : 'text-nexus-400 hover:text-nexus-200'
          }`}
        >
          <AlertTriangle size={14} /> Flagged
          {flagged.length > 0 && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-glow/10 text-amber-glow">
              {flagged.length}
            </span>
          )}
        </button>
      </div>

      {/* All Subscribers Tab */}
      {activeTab === 'all' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-500" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="input-field pl-11 w-full"
              />
            </div>
            <select
              value={source}
              onChange={e => { setSource(e.target.value); setPage(1) }}
              className="input-field w-48"
            >
              <option value="">All Sources</option>
              <option value="direct">Direct</option>
              <option value="referral">Referral</option>
              <option value="api">API</option>
              <option value="import">Import</option>
            </select>
          </div>

          {/* Table */}
          <div className="card-surface overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-nexus-400">Loading...</div>
            ) : error ? (
              <div className="p-6 text-magenta-glow">Failed to load subscribers.</div>
            ) : subscribers.length === 0 ? (
              <div className="p-6 text-nexus-500">No subscribers found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-magenta-glow/[0.06]">
                      <SortableHeader label="Email" sortKey="email" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Name" sortKey="name" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                      <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Project</th>
                      <SortableHeader label="Source" sortKey="source" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Date" sortKey="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub, i) => {
                      const project = sub.project as Record<string, unknown> | undefined
                      return (
                        <tr key={(sub.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                          <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[200px]">{(sub.email as string) ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-nexus-300">{(sub.name as string) ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-nexus-300">
                            {project ? (
                              <Link to={`/admin/projects/${project.id}`} className="text-nexus-400 hover:text-cyan-glow no-underline transition-colors font-mono text-xs">
                                {(project.name as string) ?? '—'}
                              </Link>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-glow/10 text-cyan-glow">
                              {(sub.source as string) ?? 'direct'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-nexus-500 font-mono">
                            {sub.createdAt ? new Date(sub.createdAt as string).toLocaleDateString() : '—'}
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
        </>
      )}

      {/* Flagged Tab */}
      {activeTab === 'flagged' && (
        <div className="card-surface overflow-hidden animate-fade-in">
          {flaggedLoading ? (
            <div className="p-6 text-nexus-400">Loading...</div>
          ) : flaggedError ? (
            <div className="p-6 text-magenta-glow">Failed to load flagged subscribers.</div>
          ) : flagged.length === 0 ? (
            <div className="p-6 text-nexus-500">No flagged subscribers. All clear.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-magenta-glow/[0.06]">
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Project</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Total Referrals</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Last 24h</th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.map((sub, i) => {
                    const project = sub.project as Record<string, unknown> | undefined
                    const countData = sub._count as Record<string, number> | undefined
                    return (
                      <tr key={(sub.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[200px]">{(sub.email as string) ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-nexus-400 font-mono">{(project?.name as string) ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-nexus-300 font-mono">{countData?.referred ?? 0}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-bold text-amber-glow">{(sub.referralsLast24h as number) ?? 0}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
