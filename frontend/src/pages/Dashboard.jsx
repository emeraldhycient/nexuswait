import { Link } from 'react-router-dom'
import {
  Plus, Users, TrendingUp, Eye, ArrowUpRight, MoreHorizontal,
  Clock, ExternalLink, Activity, Zap
} from 'lucide-react'

const stats = [
  { label: 'Total Signups', value: '8,429', change: '+12.3%', icon: Users, color: 'cyan' },
  { label: 'This Week', value: '1,247', change: '+24.8%', icon: TrendingUp, color: 'emerald' },
  { label: 'Conversion Rate', value: '34.2%', change: '+2.1%', icon: Activity, color: 'violet' },
  { label: 'Active Projects', value: '4', change: '', icon: Zap, color: 'amber' },
]

const projects = [
  {
    id: 'prj-001',
    name: 'SynthOS Launch',
    signups: 3842,
    growth: '+18%',
    status: 'active',
    referralRate: '28%',
    lastSignup: '2 min ago',
  },
  {
    id: 'prj-002',
    name: 'Quantum API Beta',
    signups: 2190,
    growth: '+9%',
    status: 'active',
    referralRate: '34%',
    lastSignup: '15 min ago',
  },
  {
    id: 'prj-003',
    name: 'NeuralKit Pro',
    signups: 1587,
    growth: '+31%',
    status: 'active',
    referralRate: '22%',
    lastSignup: '1 hr ago',
  },
  {
    id: 'prj-004',
    name: 'Horizon Mobile',
    signups: 810,
    growth: '+5%',
    status: 'paused',
    referralRate: '15%',
    lastSignup: '3 hrs ago',
  },
]

const recentSignups = [
  { name: 'Alex Chen', email: 'alex@startup.io', project: 'SynthOS Launch', time: '2 min ago', source: 'referral' },
  { name: 'Mira Patel', email: 'mira@design.co', project: 'Quantum API Beta', time: '8 min ago', source: 'direct' },
  { name: 'Jordan Kim', email: 'jordan@dev.xyz', project: 'SynthOS Launch', time: '14 min ago', source: 'twitter' },
  { name: 'Sam Rivera', email: 'sam@venture.vc', project: 'NeuralKit Pro', time: '22 min ago', source: 'referral' },
  { name: 'Tara Osei', email: 'tara@cloud.dev', project: 'SynthOS Launch', time: '31 min ago', source: 'direct' },
]

const sourceColors = {
  referral: 'bg-emerald-glow/10 text-emerald-glow',
  direct: 'bg-cyan-glow/10 text-cyan-glow',
  twitter: 'bg-violet-glow/10 text-violet-glow',
}

const colorMap = {
  cyan: 'text-cyan-glow bg-cyan-glow/10',
  emerald: 'text-emerald-glow bg-emerald-glow/10',
  violet: 'text-violet-glow bg-violet-glow/10',
  amber: 'text-amber-glow bg-amber-glow/10',
}

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Dashboard</h1>
          <p className="text-sm text-nexus-400 mt-1">Welcome back. Here's what's happening.</p>
        </div>
        <Link to="/dashboard/create" className="btn-primary no-underline flex items-center gap-2">
          <Plus size={15} /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card-surface p-5 animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[s.color]}`}>
                <s.icon size={15} />
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
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Projects</h2>
            <Link to="/dashboard/create" className="text-xs text-cyan-glow/60 hover:text-cyan-glow no-underline flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="space-y-3">
            {projects.map((p, i) => (
              <Link
                key={p.id}
                to={`/dashboard/project/${p.id}`}
                className="no-underline card-surface p-4 flex items-center gap-4 group hover:border-cyan-glow/15 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-glow/15 to-violet-glow/15 border border-cyan-glow/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-xs font-bold text-cyan-glow">{p.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-nexus-100 text-sm truncate">{p.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === 'active' ? 'bg-emerald-glow' : 'bg-nexus-500'}`} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-nexus-500 font-mono">{p.signups.toLocaleString()} signups</span>
                    <span className="text-xs text-nexus-600">•</span>
                    <span className="text-xs text-nexus-500 font-mono">{p.referralRate} referral</span>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-mono text-emerald-glow">{p.growth}</span>
                  <div className="flex items-center gap-1 text-[10px] text-nexus-600 mt-0.5">
                    <Clock size={9} /> {p.lastSignup}
                  </div>
                </div>
                <ExternalLink size={14} className="text-nexus-600 group-hover:text-cyan-glow transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent signups */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Recent Signups</h2>
            <button className="text-nexus-500 hover:text-nexus-300"><MoreHorizontal size={16} /></button>
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

      {/* Mini chart placeholder */}
      <div className="card-surface p-6">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Signup Trend — Last 30 Days</h2>
        <div className="h-40 flex items-end gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const h = 20 + Math.random() * 70 + (i > 20 ? i * 1.5 : 0)
            return (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-cyan-glow/30 to-cyan-glow/5 rounded-t hover:from-cyan-glow/50 hover:to-cyan-glow/15 transition-colors cursor-pointer"
                style={{ height: `${Math.min(h, 100)}%` }}
                title={`Day ${i + 1}`}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] font-mono text-nexus-600">Feb 10</span>
          <span className="text-[10px] font-mono text-nexus-600">Mar 11</span>
        </div>
      </div>
    </div>
  )
}
