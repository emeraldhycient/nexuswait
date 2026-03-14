import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plug, CheckCircle, AlertTriangle, XCircle, RefreshCw, Loader2,
  ChevronDown, ChevronUp, FileText, Save, Search, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  useAdminIntegrationHealth,
  useAdminFailedIntegrationsPaginated,
  useAdminRetryIntegration,
  useAdminUpdateIntegrationConfig,
} from '../../api/hooks'
import SortableHeader from '../../components/SortableHeader'
import { useSortState } from '../../hooks/useSortState'

interface FailedIntegration {
  id: string
  type: string
  displayName: string
  failureCount: number
  maxRetryAttempts?: number
  enabled: boolean
  lastTriggeredAt: string | null
  updatedAt: string
  project: { id: string; name: string; accountId: string }
}

interface HealthEntry {
  type: string
  total: number
  avgFailureCount: number
  totalFailures: number
  deadCount: number
}

function RetryConfig({ integration }: { integration: FailedIntegration }) {
  const [value, setValue] = useState(integration.maxRetryAttempts ?? 5)
  const [dirty, setDirty] = useState(false)
  const updateConfig = useAdminUpdateIntegrationConfig(integration.id)

  const save = () => {
    updateConfig.mutate(
      { maxRetryAttempts: value },
      { onSuccess: () => setDirty(false) },
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        max={20}
        value={value}
        onChange={e => { setValue(parseInt(e.target.value) || 5); setDirty(true) }}
        className="input-field text-xs font-mono w-14 py-1 px-2 text-center"
      />
      {dirty && (
        <button
          type="button"
          onClick={save}
          disabled={updateConfig.isPending}
          className="text-cyan-glow hover:text-cyan-glow/80 transition-colors"
          title="Save retry config"
        >
          {updateConfig.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        </button>
      )}
    </div>
  )
}

export default function AdminIntegrations() {
  const { data: healthData, isLoading: healthLoading, error: healthError } = useAdminIntegrationHealth()
  const retryMutation = useAdminRetryIntegration()
  const [showFailed, setShowFailed] = useState(true)

  // Failed integrations paginated state
  const [failedSearch, setFailedSearch] = useState('')
  const [debouncedFailedSearch, setDebouncedFailedSearch] = useState('')
  const [failedPage, setFailedPage] = useState(1)
  const failedLimit = 20
  const { sortBy: failedSortBy, sortOrder: failedSortOrder, handleSort: handleFailedSort } = useSortState('failureCount', 'desc')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFailedSearch(failedSearch), 300)
    return () => clearTimeout(timer)
  }, [failedSearch])

  useEffect(() => { setFailedPage(1) }, [failedSortBy, failedSortOrder])

  const { data: failedData, isLoading: failedLoading } = useAdminFailedIntegrationsPaginated({
    search: debouncedFailedSearch || undefined,
    page: failedPage,
    limit: failedLimit,
    sortBy: failedSortBy,
    sortOrder: failedSortOrder,
  })

  const failedIntegrations: FailedIntegration[] = (failedData as Record<string, unknown>)?.data as FailedIntegration[] ?? []
  const failedTotal: number = ((failedData as Record<string, unknown>)?.total as number) ?? 0
  const failedTotalPages = Math.max(1, Math.ceil(failedTotal / failedLimit))

  if (healthLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (healthError) return <div className="p-6 text-magenta-glow">Failed to load integration health.</div>

  const healthEntries: HealthEntry[] = (healthData as HealthEntry[]) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Integrations</h1>
        <p className="text-sm text-nexus-400 mt-1">Integration health, failed webhooks, and retry management.</p>
      </div>

      {/* Health Cards */}
      {healthEntries.length === 0 ? (
        <div className="card-surface p-6 text-nexus-500">No integration data available.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthEntries.map((entry, i) => {
            const healthyRate = entry.total > 0
              ? ((entry.total - entry.deadCount) / entry.total) * 100
              : 100
            const isHealthy = healthyRate >= 95
            const isWarning = healthyRate >= 80 && healthyRate < 95

            return (
              <div key={i} className="card-surface p-5 animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-glow/10 text-violet-glow">
                      <Plug size={15} />
                    </div>
                    <span className="text-sm font-semibold text-nexus-200 capitalize">{entry.type}</span>
                  </div>
                  {isHealthy ? (
                    <CheckCircle size={16} className="text-emerald-glow" />
                  ) : isWarning ? (
                    <AlertTriangle size={16} className="text-amber-glow" />
                  ) : (
                    <XCircle size={16} className="text-magenta-glow" />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-nexus-500 tracking-wider uppercase">Total</span>
                    <span className="text-sm font-mono text-nexus-200">{entry.total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-nexus-500 tracking-wider uppercase">Health Rate</span>
                    <span className={`text-sm font-mono font-bold ${isHealthy ? 'text-emerald-glow' : isWarning ? 'text-amber-glow' : 'text-magenta-glow'}`}>
                      {healthyRate.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <div className="h-1.5 bg-nexus-700/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isHealthy ? 'bg-emerald-glow/60' : isWarning ? 'bg-amber-glow/60' : 'bg-magenta-glow/60'}`}
                        style={{ width: `${Math.min(100, healthyRate)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-nexus-500 tracking-wider uppercase">Failing</span>
                    <span className="text-sm font-mono text-nexus-300">{entry.deadCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-nexus-500 tracking-wider uppercase">Total Failures</span>
                    <span className="text-sm font-mono text-nexus-300">{entry.totalFailures.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Failed Integrations */}
      <div className="card-surface overflow-hidden">
        <button
          onClick={() => setShowFailed(!showFailed)}
          className="w-full px-6 pt-5 pb-3 flex items-center justify-between hover:bg-nexus-700/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <XCircle size={15} className="text-magenta-glow" />
            <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">
              Failed Integrations
            </h2>
            {failedTotal > 0 && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-magenta-glow/10 text-magenta-glow">
                {failedTotal}
              </span>
            )}
          </div>
          {showFailed ? <ChevronUp size={14} className="text-nexus-500" /> : <ChevronDown size={14} className="text-nexus-500" />}
        </button>

        {showFailed && (
          <div className="space-y-4 pb-5">
            {/* Search */}
            <div className="px-6 pt-2">
              <div className="relative max-w-lg">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-500" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={failedSearch}
                  onChange={e => { setFailedSearch(e.target.value); setFailedPage(1) }}
                  className="input-field pl-11 w-full"
                />
              </div>
            </div>

            {failedLoading ? (
              <div className="px-6 flex justify-center py-8">
                <Loader2 size={18} className="animate-spin text-nexus-500" />
              </div>
            ) : failedIntegrations.length === 0 ? (
              <div className="px-6 text-sm text-nexus-500">No failed integrations found.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-magenta-glow/[0.06]">
                        <SortableHeader label="Integration" sortKey="displayName" currentSortBy={failedSortBy} currentSortOrder={failedSortOrder} onSort={handleFailedSort} />
                        <SortableHeader label="Type" sortKey="type" currentSortBy={failedSortBy} currentSortOrder={failedSortOrder} onSort={handleFailedSort} />
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Project</th>
                        <SortableHeader label="Failures" sortKey="failureCount" currentSortBy={failedSortBy} currentSortOrder={failedSortOrder} onSort={handleFailedSort} />
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Max Retries</th>
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Status</th>
                        <SortableHeader label="Last Update" sortKey="updatedAt" currentSortBy={failedSortBy} currentSortOrder={failedSortOrder} onSort={handleFailedSort} />
                        <th className="text-right px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedIntegrations.map((int) => (
                        <tr key={int.id} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                          <td className="px-4 py-3 text-sm text-nexus-200 font-semibold truncate max-w-[180px]">
                            {int.displayName}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-violet-glow/10 text-violet-glow">
                              {int.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-nexus-300 font-mono truncate max-w-[150px]">
                            {int.project.name}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-mono font-bold ${
                              int.failureCount >= 5 ? 'text-magenta-glow' : int.failureCount >= 3 ? 'text-amber-glow' : 'text-nexus-300'
                            }`}>
                              {int.failureCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <RetryConfig integration={int} />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                              int.enabled
                                ? 'bg-amber-glow/10 text-amber-glow'
                                : 'bg-magenta-glow/10 text-magenta-glow'
                            }`}>
                              {int.enabled ? 'Failing' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-nexus-500 font-mono">
                            {new Date(int.updatedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Link
                                to={`/admin/webhook-logs?integrationId=${int.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold bg-violet-glow/10 text-violet-glow hover:bg-violet-glow/20 rounded-lg transition-colors no-underline"
                                title="View delivery logs"
                              >
                                <FileText size={11} />
                                Logs
                              </Link>
                              <button
                                onClick={() => retryMutation.mutate(int.id)}
                                disabled={retryMutation.isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20 rounded-lg transition-colors disabled:opacity-40"
                                title="Reset failure count, re-enable integration"
                              >
                                {retryMutation.isPending ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <RefreshCw size={11} />
                                )}
                                Retry
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {failedTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6">
                    <span className="text-xs font-mono text-nexus-500">
                      Page {failedPage} of {failedTotalPages} ({failedTotal} total)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={failedPage <= 1}
                        onClick={() => setFailedPage(p => Math.max(1, p - 1))}
                        className="btn-ghost p-2 disabled:opacity-30"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={failedPage >= failedTotalPages}
                        onClick={() => setFailedPage(p => p + 1)}
                        className="btn-ghost p-2 disabled:opacity-30"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
