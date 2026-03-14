import type { LucideIcon } from 'lucide-react'
import { Building2, FolderOpen, UserPlus, Users } from 'lucide-react'
import { useAdminStats } from '../../api/hooks'

const planColors: Record<string, string> = {
  spark: 'bg-cyan-glow/60',
  pulse: 'bg-violet-glow/60',
  nexus: 'bg-magenta-glow/60',
  enterprise: 'bg-amber-glow/60',
}

const planLabelColors: Record<string, string> = {
  spark: 'text-cyan-glow',
  pulse: 'text-violet-glow',
  nexus: 'text-magenta-glow',
  enterprise: 'text-amber-glow',
}

export default function AdminOverview() {
  const { data, isLoading, error } = useAdminStats()

  if (isLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (error) return <div className="p-6 text-magenta-glow">Failed to load admin stats.</div>

  const stats: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: 'Total Accounts', value: data?.totalAccounts ?? 0, icon: Building2, color: 'text-cyan-glow bg-cyan-glow/10' },
    { label: 'Total Projects', value: data?.totalProjects ?? 0, icon: FolderOpen, color: 'text-violet-glow bg-violet-glow/10' },
    { label: 'Total Subscribers', value: data?.totalSubscribers ?? 0, icon: UserPlus, color: 'text-magenta-glow bg-magenta-glow/10' },
    { label: 'Total Users', value: data?.totalUsers ?? 0, icon: Users, color: 'text-amber-glow bg-amber-glow/10' },
  ]

  const planBreakdown: { plan: string; _count: number }[] = data?.planBreakdown ?? []
  const maxCount = Math.max(...planBreakdown.map(p => p._count), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Admin Overview</h1>
        <p className="text-sm text-nexus-400 mt-1">Platform-wide statistics and metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card-surface p-5 animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon size={15} />
                </div>
              </div>
              <div className="font-display text-2xl font-black text-nexus-50">{s?.value?.toLocaleString()}</div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mt-1">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Plan Distribution */}
      <div className="card-surface p-6">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-5">Plan Distribution</h2>
        {planBreakdown.length === 0 ? (
          <p className="text-sm text-nexus-500">No plan data available.</p>
        ) : (
          <div className="space-y-4">
            {planBreakdown.map((item, i) => {
              const pct = Math.round((item._count / maxCount) * 100)
              const planKey = item.plan?.toLowerCase() ?? 'spark'
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-mono font-bold tracking-wider uppercase ${planLabelColors[planKey] ?? 'text-nexus-400'}`}>
                      {item.plan}
                    </span>
                    <span className="text-xs font-mono text-nexus-400">{item?._count?.toLocaleString()} accounts</span>
                  </div>
                  <div className="h-2 bg-nexus-700/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${planColors[planKey] ?? 'bg-nexus-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
