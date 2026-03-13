import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useAdminAccount, useAdminUpdateAccount } from '../../api/hooks'

const planBadge: Record<string, string> = {
  spark: 'bg-cyan-glow/10 text-cyan-glow',
  pulse: 'bg-violet-glow/10 text-violet-glow',
  nexus: 'bg-magenta-glow/10 text-magenta-glow',
  enterprise: 'bg-amber-glow/10 text-amber-glow',
}

export default function AdminAccountDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: account, isLoading, error } = useAdminAccount(id)
  const mutation = useAdminUpdateAccount(id)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  if (isLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (error || !account) return <div className="p-6 text-magenta-glow">Failed to load account.</div>

  const acct = account as Record<string, unknown>
  const plan = ((selectedPlan ?? acct.plan) as string ?? 'spark').toLowerCase()
  const users: Record<string, unknown>[] = (acct.users as Record<string, unknown>[]) ?? []
  const projects: Record<string, unknown>[] = (acct.projects as Record<string, unknown>[]) ?? []
  const createdAt = acct.createdAt ? new Date(acct.createdAt as string).toLocaleDateString() : '—'

  const handleSavePlan = () => {
    if (selectedPlan && selectedPlan !== acct.plan) {
      mutation.mutate({ plan: selectedPlan })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/admin/accounts" className="text-nexus-500 hover:text-nexus-200 transition-colors no-underline">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Account Detail</h1>
          <p className="text-sm text-nexus-400 mt-0.5">ID: <span className="font-mono text-nexus-500">{id}</span></p>
        </div>
      </div>

      {/* Account Info */}
      <div className="card-surface p-6">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-5">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Plan</div>
            <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${planBadge[plan] ?? 'bg-nexus-600/10 text-nexus-400'}`}>
              {plan}
            </span>
          </div>
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Created</div>
            <div className="text-sm text-nexus-200">{createdAt}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Subscription</div>
            <div className="text-sm text-nexus-200">{(acct.subscriptionId as string) ?? 'None'}</div>
          </div>
        </div>

        {/* Plan Change */}
        <div className="mt-6 flex items-end gap-3">
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Change Plan</label>
            <select
              value={selectedPlan ?? plan}
              onChange={e => setSelectedPlan(e.target.value)}
              className="input-field w-44"
            >
              <option value="spark">Spark</option>
              <option value="pulse">Pulse</option>
              <option value="nexus">Nexus</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleSavePlan}
            disabled={mutation.isPending || !selectedPlan || selectedPlan === acct.plan}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            <Save size={14} />
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
        {mutation.isSuccess && <p className="text-xs text-emerald-glow mt-2">Plan updated successfully.</p>}
        {mutation.isError && <p className="text-xs text-magenta-glow mt-2">Failed to update plan.</p>}
      </div>

      {/* Users Table */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Users ({users.length})</h2>
        </div>
        {users.length === 0 ? (
          <div className="px-6 pb-5 text-sm text-nexus-500">No users found for this account.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-glow/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">First Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Last Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Roles</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={(u.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-nexus-200 font-mono">{(u.email as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-nexus-300">{(u.firstName as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-nexus-300">{(u.lastName as string) ?? '—'}</td>
                    <td className="px-4 py-3 flex flex-wrap gap-1">
                      {((u.roles as string[]) ?? ['member']).map((r: string) => (
                        <span key={r} className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-nexus-700/30 text-nexus-400">
                          {r}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projects List */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Projects ({projects.length})</h2>
        </div>
        {projects.length === 0 ? (
          <div className="px-6 pb-5 text-sm text-nexus-500">No projects found for this account.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-glow/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Subscribers</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => (
                  <tr key={(p.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-nexus-200">{(p.name as string) ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${(p.status as string) === 'active' ? 'bg-emerald-glow' : 'bg-nexus-500'}`} />
                        <span className="text-xs text-nexus-400 font-mono">{(p.status as string) ?? 'unknown'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-nexus-300 font-mono">
                      {((p._count as Record<string, number>)?.subscribers ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
