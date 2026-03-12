import { Plug, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useAdminIntegrationHealth } from '../../api/hooks'

export default function AdminIntegrations() {
  const { data, isLoading, error } = useAdminIntegrationHealth()

  if (isLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (error) return <div className="p-6 text-magenta-glow">Failed to load integration health.</div>

  const integrations: Record<string, unknown>[] = (data as Record<string, unknown>[]) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Integrations</h1>
        <p className="text-sm text-nexus-400 mt-1">Integration health and status across all accounts.</p>
      </div>

      {integrations.length === 0 ? (
        <div className="card-surface p-6 text-nexus-500">No integration data available.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((item, i) => {
            const type = (item.type as string) ?? 'Unknown'
            const count = (item.count as number) ?? 0
            const successRate = (item.successRate as number) ?? 0
            const failures = (item.failures as number) ?? 0

            const isHealthy = successRate >= 95
            const isWarning = successRate >= 80 && successRate < 95

            return (
              <div key={i} className="card-surface p-5 animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-glow/10 text-violet-glow">
                      <Plug size={15} />
                    </div>
                    <span className="text-sm font-semibold text-nexus-200 capitalize">{type}</span>
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
                    <span className="text-sm font-mono text-nexus-200">{count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-nexus-500 tracking-wider uppercase">Success Rate</span>
                    <span className={`text-sm font-mono font-bold ${isHealthy ? 'text-emerald-glow' : isWarning ? 'text-amber-glow' : 'text-magenta-glow'}`}>
                      {successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <div className="h-1.5 bg-nexus-700/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isHealthy ? 'bg-emerald-glow/60' : isWarning ? 'bg-amber-glow/60' : 'bg-magenta-glow/60'}`}
                        style={{ width: `${Math.min(100, successRate)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-nexus-500 tracking-wider uppercase">Failures</span>
                    <span className="text-sm font-mono text-nexus-300">{failures.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
