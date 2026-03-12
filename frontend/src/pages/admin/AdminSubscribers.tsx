import { useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { useAdminRecentSubscribers, useAdminFlaggedSubscribers } from '../../api/hooks'

type TabId = 'recent' | 'flagged'

const tabs: { id: TabId; label: string; icon: typeof Clock }[] = [
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'flagged', label: 'Flagged', icon: AlertTriangle },
]

export default function AdminSubscribers() {
  const [activeTab, setActiveTab] = useState<TabId>('recent')
  const { data: recentData, isLoading: recentLoading, error: recentError } = useAdminRecentSubscribers()
  const { data: flaggedData, isLoading: flaggedLoading, error: flaggedError } = useAdminFlaggedSubscribers()

  const recent: Record<string, unknown>[] = (recentData as Record<string, unknown>[]) ?? []
  const flagged: Record<string, unknown>[] = (flaggedData as Record<string, unknown>[]) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Subscribers</h1>
        <p className="text-sm text-nexus-400 mt-1">Monitor recent and flagged subscribers.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-magenta-glow/[0.08] text-magenta-glow'
                  : 'text-nexus-400 hover:text-nexus-200 hover:bg-nexus-700/30'
              }`}
            >
              <Icon size={15} />
              {tab.label}
              <span className="text-[10px] font-mono ml-1 opacity-60">
                {tab.id === 'recent' ? recent.length : flagged.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Recent Tab */}
      {activeTab === 'recent' && (
        <div className="card-surface overflow-hidden animate-fade-in">
          {recentLoading ? (
            <div className="p-6 text-nexus-400">Loading...</div>
          ) : recentError ? (
            <div className="p-6 text-magenta-glow">Failed to load recent subscribers.</div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-nexus-500">No recent subscribers.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-magenta-glow/[0.06]">
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Project</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Source</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((sub, i) => (
                    <tr key={(sub.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[200px]">{(sub.email as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-nexus-300">
                        {[sub.firstName, sub.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-nexus-400 font-mono">{(sub.projectName as string) ?? (sub.projectId as string) ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-glow/10 text-cyan-glow">
                          {(sub.source as string) ?? 'direct'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-nexus-500 font-mono">
                        {sub.createdAt ? new Date(sub.createdAt as string).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Flagged Tab */}
      {activeTab === 'flagged' && (
        <div className="card-surface overflow-hidden animate-fade-in">
          {flaggedLoading ? (
            <div className="p-6 text-nexus-400">Loading...</div>
          ) : flaggedError ? (
            <div className="p-6 text-magenta-glow">Failed to load flagged subscribers.</div>
          ) : flagged.length === 0 ? (
            <div className="p-6 text-nexus-500">No flagged subscribers. All clear.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-magenta-glow/[0.06]">
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Project</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Reason</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.map((sub, i) => (
                    <tr key={(sub.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[200px]">{(sub.email as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-nexus-300">
                        {[sub.firstName, sub.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-nexus-400 font-mono">{(sub.projectName as string) ?? (sub.projectId as string) ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-glow/10 text-amber-glow">
                          {(sub.flagReason as string) ?? 'suspicious'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-nexus-500 font-mono">
                        {sub.createdAt ? new Date(sub.createdAt as string).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
