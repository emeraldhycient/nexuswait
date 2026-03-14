import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useAdminAccounts } from '../../api/hooks'
import SortableHeader from '../../components/SortableHeader'
import SearchInput from '../../components/SearchInput'
import FilterSelect from '../../components/FilterSelect'
import PaginationFooter from '../../components/PaginationFooter'
import { useListState } from '../../hooks/useListState'

const planBadge: Record<string, string> = {
  spark: 'bg-cyan-glow/10 text-cyan-glow',
  pulse: 'bg-violet-glow/10 text-violet-glow',
  nexus: 'bg-magenta-glow/10 text-magenta-glow',
  enterprise: 'bg-amber-glow/10 text-amber-glow',
}

const planOptions = [
  { value: '', label: 'All Plans' },
  { value: 'spark', label: 'Spark' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'nexus', label: 'Nexus' },
  { value: 'enterprise', label: 'Enterprise' },
]

export default function AdminAccounts() {
  const list = useListState()
  const [plan, setPlan] = useState('')

  const { data, isLoading, error } = useAdminAccounts({ search: list.debouncedSearch || undefined, plan: plan || undefined, page: list.page, limit: list.limit, sortBy: list.sortBy, sortOrder: list.sortOrder })

  const accounts: Record<string, unknown>[] = (data as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
  const total: number = ((data as Record<string, unknown>)?.total as number) ?? 0
  const totalPages = Math.max(1, Math.ceil(total / list.limit))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Accounts</h1>
        <p className="text-sm text-nexus-400 mt-1">Manage all platform accounts.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search by email..." />
        <FilterSelect value={plan} onChange={v => { setPlan(v); list.setPage(1) }} options={planOptions} />
      </div>

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
                  <SortableHeader label="Plan" sortKey="plan" currentSortBy={list.sortBy} currentSortOrder={list.sortOrder} onSort={list.handleSort} />
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Projects</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Subscribers</th>
                  <SortableHeader label="Created" sortKey="createdAt" currentSortBy={list.sortBy} currentSortOrder={list.sortOrder} onSort={list.handleSort} />
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

      <PaginationFooter page={list.page} totalPages={totalPages} total={total} onPageChange={list.setPage} />
    </div>
  )
}
