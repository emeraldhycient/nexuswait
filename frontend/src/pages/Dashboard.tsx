import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Plus, Users, TrendingUp, ArrowUpRight, MoreHorizontal,
  ExternalLink, Activity, Zap
} from 'lucide-react'
import { useProjects, useSubscribers } from '../api/hooks'
import { useAuth } from '../contexts/AuthContext'

const colorMap: Record<string, string> = {
  cyan: 'text-cyan-glow bg-cyan-glow/10',
  emerald: 'text-emerald-glow bg-emerald-glow/10',
  violet: 'text-violet-glow bg-violet-glow/10',
  amber: 'text-amber-glow bg-amber-glow/10',
}

const sourceColors: Record<string, string> = {
  referral: 'bg-emerald-glow/10 text-emerald-glow',
  direct: 'bg-cyan-glow/10 text-cyan-glow',
  twitter: 'bg-violet-glow/10 text-violet-glow',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { data: projectsList, isLoading: projectsLoading, error: projectsError } = useProjects()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login')
  }, [authLoading, isAuthenticated, navigate])

  const projects = projectsList ?? []
  const firstProjectId = projects.length > 0 ? projects[0].id : undefined

  // Load subscribers from first project to show recent signups
  const { data: recentSubsData } = useSubscribers(firstProjectId, { enabled: !!firstProjectId })
  const recentSubs = (
    Array.isArray(recentSubsData)
      ? recentSubsData
      : (recentSubsData as { data?: unknown[] })?.data ?? []
  ) as { id?: string; name?: string; email?: string; source?: string; createdAt?: string; projectId?: string }[]

  const totalSignups = projects.reduce((acc, p) => acc + (p._count?.subscribers ?? 0), 0)
  const stats: { label: string; value: string; change: string; icon: LucideIcon; color: string }[] = [
    { label: 'Total Signups', value: totalSignups.toLocaleString(), change: '', icon: Users, color: 'cyan' },
    { label: 'This Week', value: '\u2014', change: '', icon: TrendingUp, color: 'emerald' },
    { label: 'Conversion Rate', value: '\u2014', change: '', icon: Activity, color: 'violet' },
    { label: 'Active Projects', value: String(projects.length), change: '', icon: Zap, color: 'amber' },
  ]

  if (authLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (!isAuthenticated) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Dashboard</h1>
          <p className="text-sm text-nexus-400 mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
        </div>
        <Link to="/dashboard/create" className="btn-primary no-underline flex items-center gap-2">
          <Plus size={15} /> New Project
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card-surface p-5 animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[s.color]}`}>
                  <Icon size={15} />
                </div>
                {s.change && (
                  <span className="flex items-center gap-0.5 text-xs font-mono text-emerald-glow">
                    <ArrowUpRight size={11} /> {s.change}
                  </span>
                )}
              </div>
              <div className="font-display text-2xl font-black text-nexus-50">{s.value}</div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mt-1">{s.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Projects</h2>
            <Link to="/dashboard/create" className="text-xs text-cyan-glow/60 hover:text-cyan-glow no-underline flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          {projectsError && <p className="text-magenta-glow text-sm mb-2">Failed to load projects</p>}
          {projectsLoading && <p className="text-nexus-500 text-sm">Loading projects...</p>}
          <div className="space-y-3">
            {!projectsLoading && projects.map((p, i) => (
              <Link
                key={p.id}
                to={`/dashboard/project/${p.id}`}
                className="no-underline card-surface p-4 flex items-center gap-4 group hover:border-cyan-glow/15 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-glow/15 to-violet-glow/15 border border-cyan-glow/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-xs font-bold text-cyan-glow">{(p.name || 'P').charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-nexus-100 text-sm truncate">{p.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === 'active' ? 'bg-emerald-glow' : 'bg-nexus-500'}`} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-nexus-500 font-mono">{(p._count?.subscribers ?? 0).toLocaleString()} signups</span>
                  </div>
                </div>
                <ExternalLink size={14} className="text-nexus-600 group-hover:text-cyan-glow transition-colors shrink-0" />
              </Link>
            ))}
            {!projectsLoading && !projectsError && projects.length === 0 && (
              <p className="text-nexus-500 text-sm">No projects yet. Create one to get started.</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Recent Signups</h2>
            <button type="button" className="text-nexus-500 hover:text-nexus-300"><MoreHorizontal size={16} /></button>
          </div>
          <div className="card-surface divide-y divide-cyan-glow/[0.04]">
            {recentSubs.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-xs text-nexus-500">Recent signups will appear here.</p>
              </div>
            )}
            {recentSubs.slice(0, 5).map((s, i) => {
              const displayName = s.name ?? s.email ?? 'Unknown'
              const initials = displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              const source = s.source ?? 'direct'
              const timeAgo = s.createdAt ? getTimeAgo(s.createdAt) : ''
              return (
                <div key={s.id ?? i} className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-glow/20 to-magenta-glow/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-display font-bold text-cyan-glow">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-nexus-200 truncate">{displayName}</div>
                    <div className="text-xs text-nexus-500 truncate">{s.email ?? ''}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${sourceColors[source] ?? 'bg-nexus-600/10 text-nexus-400'}`}>{source}</span>
                      {timeAgo && <span className="text-[10px] text-nexus-600">{timeAgo}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Signup Trend</h2>
        {projects.length === 0 ? (
          <p className="text-xs text-nexus-500">Create a project to see signup trends.</p>
        ) : (
          <div className="h-40 flex items-end gap-1">
            {projects.map((p) => {
              const count = p._count?.subscribers ?? 0
              const maxSubs = Math.max(...projects.map(pp => pp._count?.subscribers ?? 0), 1)
              const h = Math.max((count / maxSubs) * 100, 5)
              return (
                <div
                  key={p.id}
                  className="flex-1 bg-gradient-to-t from-cyan-glow/30 to-cyan-glow/5 rounded-t hover:from-cyan-glow/50 hover:to-cyan-glow/15 transition-colors cursor-pointer"
                  style={{ height: `${h}%` }}
                  title={`${p.name}: ${count.toLocaleString()} signups`}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
