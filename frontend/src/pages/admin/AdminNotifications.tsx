import { Bell, Clock, XCircle, Skull } from 'lucide-react'
import { useAdminNotificationQueue } from '../../api/hooks'

export default function AdminNotifications() {
  const { data, isLoading, error } = useAdminNotificationQueue()

  if (isLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (error) return <div className="p-6 text-magenta-glow">Failed to load notification queue.</div>

  const queue = data as Record<string, unknown> | undefined
  const counts = (queue?.counts as Record<string, number>) ?? { pending: 0, failed: 0, dead_letter: 0 }
  const recentFailures: Record<string, unknown>[] = (queue?.recentFailures as Record<string, unknown>[]) ?? []

  const statusCards: { label: string; value: number; icon: typeof Clock; color: string }[] = [
    { label: 'Pending', value: counts.pending ?? 0, icon: Clock, color: 'text-cyan-glow bg-cyan-glow/10' },
    { label: 'Failed', value: counts.failed ?? 0, icon: XCircle, color: 'text-magenta-glow bg-magenta-glow/10' },
    { label: 'Dead Letter', value: counts.dead_letter ?? 0, icon: Skull, color: 'text-amber-glow bg-amber-glow/10' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Notifications</h1>
        <p className="text-sm text-nexus-400 mt-1">Notification queue status and recent failures.</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statusCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="card-surface p-5 animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon size={15} />
                </div>
              </div>
              <div className="font-display text-2xl font-black text-nexus-50">{card.value.toLocaleString()}</div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mt-1">{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Recent Failures Table */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center gap-2">
          <Bell size={15} className="text-magenta-glow" />
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Recent Failures</h2>
        </div>
        {recentFailures.length === 0 ? (
          <div className="px-6 pb-5 text-sm text-nexus-500">No recent failures. Queue is healthy.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-glow/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Recipient</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Error</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Attempts</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Last Attempt</th>
                </tr>
              </thead>
              <tbody>
                {recentFailures.map((failure, i) => (
                  <tr key={(failure.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-violet-glow/10 text-violet-glow">
                        {(failure.type as string) ?? 'email'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[200px]">{(failure.recipient as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-magenta-glow font-mono truncate max-w-[200px]">{(failure.error as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-nexus-300 font-mono">{(failure.attempts as number) ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-nexus-500 font-mono">
                      {failure.lastAttemptAt ? new Date(failure.lastAttemptAt as string).toLocaleString() : '—'}
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
