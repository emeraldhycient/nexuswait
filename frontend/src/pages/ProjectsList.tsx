import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, ExternalLink, Plus } from 'lucide-react'
import { useProjectsPaginated } from '../api/hooks'
import SortableHeader from '../components/SortableHeader'
import { useSortState } from '../hooks/useSortState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function ProjectsList() {
  useDocumentTitle('Projects')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const limit = 15
  const { sortBy, sortOrder, handleSort } = useSortState()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => { setPage(1) }, [sortBy, sortOrder])

  const { data, isLoading, error } = useProjectsPaginated({
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  const projects = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Projects</h1>
          <p className="text-sm text-nexus-400 mt-1">All your waitlist projects.</p>
        </div>
        <Link to="/dashboard/create" className="btn-primary no-underline flex items-center gap-2">
          <Plus size={15} /> New Project
        </Link>
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
        </select>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-nexus-400">Loading...</div>
        ) : error ? (
          <div className="p-6 text-magenta-glow">Failed to load projects.</div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-nexus-500">
            {debouncedSearch || status
              ? 'No projects match your filters.'
              : 'No projects yet. Create one to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-glow/[0.06]">
                  <SortableHeader label="Name" sortKey="name" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Status" sortKey="status" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Subscribers</th>
                  <SortableHeader label="Created" sortKey="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const projectStatus = p.status ?? 'active'
                  const subscribersCount = p._count?.subscribers ?? 0
                  const createdAt = p.createdAt
                    ? new Date(p.createdAt as string).toLocaleDateString()
                    : '—'
                  return (
                    <tr key={p.id ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold">
                        <Link to={`/dashboard/project/${p.id}`} className="text-nexus-200 hover:text-cyan-glow no-underline transition-colors">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${projectStatus === 'active' ? 'bg-emerald-glow' : 'bg-amber-glow'}`} />
                          <span className="text-xs text-nexus-400 font-mono">{projectStatus}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-nexus-300 font-mono">{subscribersCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-nexus-500 font-mono">{createdAt}</td>
                      <td className="px-4 py-3">
                        <Link to={`/dashboard/project/${p.id}`} className="text-nexus-500 hover:text-cyan-glow transition-colors">
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
