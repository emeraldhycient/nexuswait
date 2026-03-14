import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAdminProjects } from '../../api/hooks'

export default function AdminProjects() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const limit = 15

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, error } = useAdminProjects({ search: debouncedSearch || undefined, status: status || undefined, page, limit })

  const projects: Record<string, unknown>[] = (data as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
  const total: number = ((data as Record<string, unknown>)?.total as number) ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Projects</h1>
        <p className="text-sm text-nexus-400 mt-1">All projects across the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-500" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-11 w-full"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="input-field w-48"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-nexus-400">Loading...</div>
        ) : error ? (
          <div className="p-6 text-magenta-glow">Failed to load projects.</div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-nexus-500">No projects found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-glow/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Account</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Subscribers</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const id = p.id as string
                  const name = (p.name as string) ?? '—'
                  const accountId = (p.accountId as string) ?? '—'
                  const projectStatus = (p.status as string) ?? 'unknown'
                  const subscribersCount = (p._count as Record<string, number>)?.subscribers ?? 0
                  const createdAt = p.createdAt ? new Date(p.createdAt as string).toLocaleDateString() : '—'
                  return (
                    <tr key={id ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-nexus-200 font-semibold">{name}</td>
                      <td className="px-4 py-3 text-xs text-nexus-500 font-mono truncate max-w-[140px]">{accountId}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${projectStatus === 'active' ? 'bg-emerald-glow' : projectStatus === 'paused' ? 'bg-amber-glow' : 'bg-nexus-500'}`} />
                          <span className="text-xs text-nexus-400 font-mono">{projectStatus}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-nexus-300 font-mono">{subscribersCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-nexus-500 font-mono">{createdAt}</td>
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
