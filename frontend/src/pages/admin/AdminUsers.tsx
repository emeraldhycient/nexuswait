import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useAdminUsers } from '../../api/hooks'

const planBadge: Record<string, string> = {
  spark: 'bg-cyan-glow/10 text-cyan-glow',
  pulse: 'bg-violet-glow/10 text-violet-glow',
  nexus: 'bg-magenta-glow/10 text-magenta-glow',
  enterprise: 'bg-amber-glow/10 text-amber-glow',
}

const roleBadge: Record<string, string> = {
  admin: 'bg-magenta-glow/15 text-magenta-glow',
  user: 'bg-nexus-700/30 text-nexus-400',
}

const providerBadge: Record<string, string> = {
  local: 'bg-nexus-700/30 text-nexus-400',
  google: 'bg-cyan-glow/10 text-cyan-glow',
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, error } = useAdminUsers({ search: search || undefined, role: role || undefined, page, limit })

  const users: Record<string, unknown>[] = (data as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
  const total: number = ((data as Record<string, unknown>)?.total as number) ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Users</h1>
        <p className="text-sm text-nexus-400 mt-1">Manage all platform users.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-500" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9 w-full"
          />
        </div>
        <select
          value={role}
          onChange={e => { setRole(e.target.value); setPage(1) }}
          className="input-field w-40"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-nexus-400">Loading...</div>
        ) : error ? (
          <div className="p-6 text-magenta-glow">Failed to load users.</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-nexus-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-glow/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Roles</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Provider</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Plan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const id = u.id as string
                  const email = (u.email as string) ?? '—'
                  const firstName = (u.firstName as string) ?? ''
                  const lastName = (u.lastName as string) ?? ''
                  const name = [firstName, lastName].filter(Boolean).join(' ') || '—'
                  const roles = (u.roles as string[]) ?? ['user']
                  const provider = (u.provider as string) ?? 'local'
                  const accountPlan = ((u.account as Record<string, unknown>)?.plan as string ?? 'spark').toLowerCase()
                  const createdAt = u.createdAt ? new Date(u.createdAt as string).toLocaleDateString() : '—'
                  return (
                    <tr key={id ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[200px]">{email}</td>
                      <td className="px-4 py-3 text-sm text-nexus-300">{name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {roles.map((r: string) => (
                            <span key={r} className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${roleBadge[r] ?? 'bg-nexus-700/30 text-nexus-400'}`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${providerBadge[provider] ?? 'bg-nexus-700/30 text-nexus-400'}`}>
                          {provider}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${planBadge[accountPlan] ?? 'bg-nexus-600/10 text-nexus-400'}`}>
                          {accountPlan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-nexus-500 font-mono">{createdAt}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/users/${id}`} className="text-nexus-500 hover:text-magenta-glow transition-colors">
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
