import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Users } from 'lucide-react'
import { useAdminSubscribers, useAdminFlaggedSubscribers } from '../../api/hooks'
import SortableHeader from '../../components/SortableHeader'
import SearchInput from '../../components/SearchInput'
import FilterSelect from '../../components/FilterSelect'
import PaginationFooter from '../../components/PaginationFooter'
import { useListState } from '../../hooks/useListState'

type TabId = 'all' | 'flagged'

const sourceOptions = [
  { value: '', label: 'All Sources' },
  { value: 'direct', label: 'Direct' },
  { value: 'referral', label: 'Referral' },
  { value: 'api', label: 'API' },
  { value: 'import', label: 'Import' },
]

export default function AdminSubscribers() {
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const list = useListState({ limit: 20 })
  const [source, setSource] = useState('')

  const { data, isLoading, error } = useAdminSubscribers({
    search: list.debouncedSearch || undefined,
    source: source || undefined,
    page: list.page,
    limit: list.limit,
    sortBy: list.sortBy,
    sortOrder: list.sortOrder,
  })

  const subscribers: Record<string, unknown>[] = (data as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
  const total: number = ((data as Record<string, unknown>)?.total as number) ?? 0
  const totalPages = Math.max(1, Math.ceil(total / list.limit))

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
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search by email or name..." />
            <FilterSelect value={source} onChange={v => { setSource(v); list.setPage(1) }} options={sourceOptions} />
          </div>

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
                      <SortableHeader label="Email" sortKey="email" currentSortBy={list.sortBy} currentSortOrder={list.sortOrder} onSort={list.handleSort} />
                      <SortableHeader label="Name" sortKey="name" currentSortBy={list.sortBy} currentSortOrder={list.sortOrder} onSort={list.handleSort} />
                      <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Project</th>
                      <SortableHeader label="Source" sortKey="source" currentSortBy={list.sortBy} currentSortOrder={list.sortOrder} onSort={list.handleSort} />
                      <SortableHeader label="Date" sortKey="createdAt" currentSortBy={list.sortBy} currentSortOrder={list.sortOrder} onSort={list.handleSort} />
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

          <PaginationFooter page={list.page} totalPages={totalPages} total={total} onPageChange={list.setPage} />
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
