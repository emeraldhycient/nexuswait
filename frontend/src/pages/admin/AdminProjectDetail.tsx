import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, ExternalLink, Plug, UserPlus } from 'lucide-react'
import { useAdminProject, useAdminUpdateProject } from '../../api/hooks'

const statusBadge: Record<string, string> = {
  active: 'bg-emerald-glow/10 text-emerald-glow',
  paused: 'bg-amber-glow/10 text-amber-glow',
  archived: 'bg-nexus-700/30 text-nexus-400',
}

const planBadge: Record<string, string> = {
  spark: 'bg-cyan-glow/10 text-cyan-glow',
  pulse: 'bg-violet-glow/10 text-violet-glow',
  nexus: 'bg-magenta-glow/10 text-magenta-glow',
  enterprise: 'bg-amber-glow/10 text-amber-glow',
}

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading, error } = useAdminProject(id)
  const updateMutation = useAdminUpdateProject(id)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  if (isLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (error || !project) return <div className="p-6 text-magenta-glow">Failed to load project.</div>

  const p = project as Record<string, unknown>
  const name = (p.name as string) ?? '—'
  const slug = (p.slug as string) ?? '—'
  const currentStatus = (p.status as string) ?? 'active'
  const status = selectedStatus ?? currentStatus
  const redirectUrl = (p.redirectUrl as string) ?? null
  const webhookUrl = (p.webhookUrl as string) ?? null
  const accountId = (p.accountId as string) ?? '—'
  const account = p.account as Record<string, unknown> | null
  const accountPlan = ((account?.plan as string) ?? 'spark').toLowerCase()
  const hostedPage = p.hostedPage as Record<string, unknown> | null
  const counts = p._count as Record<string, number> | null
  const subscriberCount = counts?.subscribers ?? 0
  const integrationCount = counts?.integrations ?? 0
  const createdAt = p.createdAt ? new Date(p.createdAt as string).toLocaleDateString() : '—'
  const updatedAt = p.updatedAt ? new Date(p.updatedAt as string).toLocaleDateString() : '—'

  const subscribers: Record<string, unknown>[] = (p.subscribers as Record<string, unknown>[]) ?? []
  const integrations: Record<string, unknown>[] = (p.integrations as Record<string, unknown>[]) ?? []

  const handleSaveStatus = () => {
    if (selectedStatus && selectedStatus !== currentStatus) {
      updateMutation.mutate({ status: selectedStatus })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/projects" className="text-nexus-500 hover:text-nexus-200 transition-colors no-underline">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">{name}</h1>
          <p className="text-sm text-nexus-400 mt-0.5">ID: <span className="font-mono text-nexus-500">{id}</span></p>
        </div>
      </div>

      {/* Project Info */}
      <div className="card-surface p-6">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-5">Project Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Status</div>
            <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${statusBadge[currentStatus] ?? 'bg-nexus-700/30 text-nexus-400'}`}>
              {currentStatus}
            </span>
          </div>
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Slug</div>
            <div className="text-sm text-nexus-200 font-mono">{slug}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Account</div>
            <div className="flex items-center gap-2">
              <Link to={`/admin/accounts/${accountId}`} className="text-sm text-cyan-glow hover:text-cyan-glow/80 font-mono no-underline">
                {accountId.slice(0, 8)}...
              </Link>
              <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${planBadge[accountPlan] ?? 'bg-nexus-600/10 text-nexus-400'}`}>
                {accountPlan}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Subscribers</div>
            <div className="text-sm text-nexus-200 font-mono">{subscriberCount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Integrations</div>
            <div className="text-sm text-nexus-200 font-mono">{integrationCount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Hosted Page</div>
            {hostedPage ? (
              <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${(hostedPage.status as string) === 'published' ? 'bg-emerald-glow/10 text-emerald-glow' : 'bg-nexus-700/30 text-nexus-400'}`}>
                {(hostedPage.status as string) ?? 'draft'}
              </span>
            ) : (
              <span className="text-sm text-nexus-500">None</span>
            )}
          </div>
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Created</div>
            <div className="text-sm text-nexus-200">{createdAt}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Updated</div>
            <div className="text-sm text-nexus-200">{updatedAt}</div>
          </div>
        </div>

        {/* URLs */}
        {(redirectUrl || webhookUrl) && (
          <div className="mt-5 pt-5 border-t border-magenta-glow/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {redirectUrl && (
              <div>
                <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Redirect URL</div>
                <div className="text-sm text-nexus-300 font-mono truncate max-w-[300px]">{redirectUrl}</div>
              </div>
            )}
            {webhookUrl && (
              <div>
                <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Webhook URL</div>
                <div className="text-sm text-nexus-300 font-mono truncate max-w-[300px]">{webhookUrl}</div>
              </div>
            )}
          </div>
        )}

        {/* Status Change */}
        <div className="mt-6 flex items-end gap-3">
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Change Status</label>
            <select
              value={status}
              onChange={e => setSelectedStatus(e.target.value)}
              className="input-field w-48"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleSaveStatus}
            disabled={updateMutation.isPending || !selectedStatus || selectedStatus === currentStatus}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            <Save size={14} />
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
        {updateMutation.isSuccess && <p className="text-xs text-emerald-glow mt-2">Status updated successfully.</p>}
        {updateMutation.isError && <p className="text-xs text-magenta-glow mt-2">Failed to update status.</p>}
      </div>

      {/* Subscribers Table */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center gap-2">
          <UserPlus size={15} className="text-cyan-glow" />
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">
            Recent Subscribers ({subscriberCount})
          </h2>
        </div>
        {subscribers.length === 0 ? (
          <div className="px-6 pb-5 text-sm text-nexus-500">No subscribers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-glow/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Source</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Created</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s, i) => (
                  <tr key={(s.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[200px]">{(s.email as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-nexus-300">{(s.name as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-nexus-400 font-mono">{(s.source as string) ?? 'direct'}</td>
                    <td className="px-4 py-3 text-xs text-nexus-500 font-mono">{s.createdAt ? new Date(s.createdAt as string).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integrations Table */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center gap-2">
          <Plug size={15} className="text-violet-glow" />
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">
            Integrations ({integrationCount})
          </h2>
        </div>
        {integrations.length === 0 ? (
          <div className="px-6 pb-5 text-sm text-nexus-500">No integrations configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-glow/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Failures</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {integrations.map((int, i) => {
                  const enabled = (int.enabled as boolean) ?? true
                  const failures = (int.failureCount as number) ?? 0
                  return (
                    <tr key={(int.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-nexus-200 font-semibold truncate max-w-[180px]">{(int.displayName as string) ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-violet-glow/10 text-violet-glow">
                          {(int.type as string) ?? 'webhook'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          enabled ? 'bg-emerald-glow/10 text-emerald-glow' : 'bg-magenta-glow/10 text-magenta-glow'
                        }`}>
                          {enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-mono font-bold ${
                          failures >= 5 ? 'text-magenta-glow' : failures >= 3 ? 'text-amber-glow' : 'text-nexus-300'
                        }`}>
                          {failures}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-nexus-500 font-mono">
                        {int.createdAt ? new Date(int.createdAt as string).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/webhook-logs?integrationId=${int.id}`}
                          className="text-nexus-500 hover:text-violet-glow transition-colors"
                          title="View logs"
                        >
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
    </div>
  )
}
