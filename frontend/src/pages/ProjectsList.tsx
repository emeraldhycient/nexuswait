import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Plus } from 'lucide-react'
import { useProjectsPaginated } from '../api/hooks'
import SortableHeader from '../components/SortableHeader'
import SearchInput from '../components/SearchInput'
import FilterSelect from '../components/FilterSelect'
import PaginationFooter from '../components/PaginationFooter'
import { useListState } from '../hooks/useListState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
]

export default function ProjectsList() {
  useDocumentTitle('Projects')
  const list = useListState()
  const [status, setStatus] = useState('')

  const { data, isLoading, error } = useProjectsPaginated({
    search: list.debouncedSearch || undefined,
    status: status || undefined,
    page: list.page,
    limit: list.limit,
    sortBy: list.sortBy,
    sortOrder: list.sortOrder,
  })

  const projects = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / list.limit))

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

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search by name..." />
        <FilterSelect value={status} onChange={v => { setStatus(v); list.setPage(1) }} options={statusOptions} />
      </div>

      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-nexus-400">Loading...</div>
        ) : error ? (
          <div className="p-6 text-magenta-glow">Failed to load projects.</div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-nexus-500">
            {list.debouncedSearch || status
              ? 'No projects match your filters.'
              : 'No projects yet. Create one to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-glow/[0.06]">
                  <SortableHeader label="Name" sortKey="name" currentSortBy={list.sortBy} currentSortOrder={list.sortOrder} onSort={list.handleSort} />
                  <SortableHeader label="Status" sortKey="status" currentSortBy={list.sortBy} currentSortOrder={list.sortOrder} onSort={list.handleSort} />
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Subscribers</th>
                  <SortableHeader label="Created" sortKey="createdAt" currentSortBy={list.sortBy} currentSortOrder={list.sortOrder} onSort={list.handleSort} />
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

      <PaginationFooter page={list.page} totalPages={totalPages} total={total} onPageChange={list.setPage} />
    </div>
  )
}
