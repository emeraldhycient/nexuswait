import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Plus, Users, TrendingUp, ArrowUpRight, MoreHorizontal,
  ExternalLink, Activity, Zap
} from 'lucide-react'
import { useProjects } from '../api/hooks'
import { useAuth } from '../contexts/AuthContext'

const colorMap: Record<string, string> = {
  cyan: 'text-cyan-glow bg-cyan-glow/10',
  emerald: 'text-emerald-glow bg-emerald-glow/10',
  violet: 'text-violet-glow bg-violet-glow/10',
  amber: 'text-amber-glow bg-amber-glow/10',
}

const recentSignups = [
  { name: 'Alex Chen', email: 'alex@startup.io', project: 'SynthOS Launch', time: '2 min ago', source: 'referral' as const },
  { name: 'Mira Patel', email: 'mira@design.co', project: 'Quantum API Beta', time: '8 min ago', source: 'direct' as const },
  { name: 'Jordan Kim', email: 'jordan@dev.xyz', project: 'SynthOS Launch', time: '14 min ago', source: 'twitter' as const },
  { name: 'Sam Rivera', email: 'sam@venture.vc', project: 'NeuralKit Pro', time: '22 min ago', source: 'referral' as const },
  { name: 'Tara Osei', email: 'tara@cloud.dev', project: 'SynthOS Launch', time: '31 min ago', source: 'direct' as const },
]

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
  const totalSignups = projects.reduce((acc, p) => acc + (p._count?.subscribers ?? 0), 0)
  const chartHeights = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    i,
    h: Math.min(20 + (i % 10) * 7 + (i > 20 ? i * 0.5 : 0), 100),
  })), [])
  const stats: { label: string; value: string; change: string; icon: LucideIcon; color: string }[] = [
    { label: 'Total Signups', value: totalSignups.toLocaleString(), change: '', icon: Users, color: 'cyan' },
    { label: 'This Week', value: '—', change: '', icon: TrendingUp, color: 'emerald' },
    { label: 'Conversion Rate', value: '—', change: '', icon: Activity, color: 'violet' },
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
            {recentSignups.map((s, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-glow/20 to-magenta-glow/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-display font-bold text-cyan-glow">{s.name.split(' ').map(n=>n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-nexus-200 truncate">{s.name}</div>
                  <div className="text-xs text-nexus-500 truncate">{s.email}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${sourceColors[s.source]}`}>{s.source}</span>
                    <span className="text-[10px] text-nexus-600">{s.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Signup Trend — Last 30 Days</h2>
        <div className="h-40 flex items-end gap-1">
          {chartHeights.map(({ i, h }) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-cyan-glow/30 to-cyan-glow/5 rounded-t hover:from-cyan-glow/50 hover:to-cyan-glow/15 transition-colors cursor-pointer"
              style={{ height: `${h}%` }}
              title={`Day ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] font-mono text-nexus-600">Feb 10</span>
          <span className="text-[10px] font-mono text-nexus-600">Mar 11</span>
        </div>
      </div>
    </div>
  )
}
