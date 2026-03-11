import { useParams, Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft, Users, TrendingUp, Share2, Eye, Copy,
  Download, Filter, Pause, Play, Code, Globe, ArrowUpRight
} from 'lucide-react'

const tabs = ['Overview', 'Subscribers', 'Referrals', 'Settings'] as const
type Tab = (typeof tabs)[number]

const subscribers = [
  { name: 'Alex Chen', email: 'alex@startup.io', date: 'Mar 11, 2026', source: 'referral' as const, position: 1, referrals: 12 },
  { name: 'Mira Patel', email: 'mira@design.co', date: 'Mar 11, 2026', source: 'direct' as const, position: 2, referrals: 8 },
  { name: 'Jordan Kim', email: 'jordan@dev.xyz', date: 'Mar 10, 2026', source: 'twitter' as const, position: 3, referrals: 5 },
  { name: 'Sam Rivera', email: 'sam@venture.vc', date: 'Mar 10, 2026', source: 'referral' as const, position: 4, referrals: 3 },
  { name: 'Tara Osei', email: 'tara@cloud.dev', date: 'Mar 10, 2026', source: 'producthunt' as const, position: 5, referrals: 2 },
  { name: 'Liam Walsh', email: 'liam@saas.io', date: 'Mar 9, 2026', source: 'direct' as const, position: 6, referrals: 1 },
  { name: 'Ava Tanaka', email: 'ava@agency.jp', date: 'Mar 9, 2026', source: 'referral' as const, position: 7, referrals: 0 },
  { name: 'Diego Morales', email: 'diego@fintech.mx', date: 'Mar 9, 2026', source: 'direct' as const, position: 8, referrals: 0 },
]

const sourceColors: Record<string, string> = {
  referral: 'bg-emerald-glow/10 text-emerald-glow',
  direct: 'bg-cyan-glow/10 text-cyan-glow',
  twitter: 'bg-violet-glow/10 text-violet-glow',
  producthunt: 'bg-amber-glow/10 text-amber-glow',
}

const referralData = [
  { tier: 'Bronze (1-2 refs)', count: 842, reward: 'Priority Access' },
  { tier: 'Silver (3-5 refs)', count: 234, reward: 'Early Beta Invite' },
  { tier: 'Gold (6-10 refs)', count: 67, reward: 'Lifetime Discount' },
  { tier: 'Platinum (10+ refs)', count: 12, reward: 'Founding Member' },
]

export default function ViewProject() {
  useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [isPaused, setIsPaused] = useState(false)

  const project = {
    name: 'SynthOS Launch',
    url: 'nexuswait.io/synthos',
    status: isPaused ? 'paused' : 'active',
    created: 'Feb 15, 2026',
  }

  const overviewChartHeights = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const base = 15 + Math.sin(i * 0.15) * 20 + i * 0.8
    const h = Math.min(Math.max(base + (i % 7) * 2, 5), 100)
    return { i, h }
  }), [])
  const stats: { label: string; value: string; icon: LucideIcon; change: string }[] = [
    { label: 'Total Signups', value: '3,842', icon: Users, change: '+18%' },
    { label: 'Page Views', value: '24,819', icon: Eye, change: '+22%' },
    { label: 'Referral Rate', value: '28%', icon: Share2, change: '+3%' },
    { label: 'Avg. Daily', value: '156', icon: TrendingUp, change: '+12%' },
  ]

  return (
    <div className="animate-fade-in">
      <Link to="/dashboard" className="no-underline inline-flex items-center gap-1.5 text-sm text-nexus-500 hover:text-cyan-glow transition-colors mb-5">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-glow/15 to-violet-glow/15 border border-cyan-glow/10 flex items-center justify-center">
            <span className="font-display text-sm font-bold text-cyan-glow">S</span>
          </div>
          <div>
            <h1 className="font-display text-xl font-black text-nexus-50 tracking-wider">{project.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Globe size={11} className="text-nexus-500" />
              <span className="text-xs font-mono text-nexus-500">{project.url}</span>
              <button type="button" className="text-nexus-600 hover:text-cyan-glow"><Copy size={10} /></button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`btn-ghost flex items-center gap-1.5 text-xs ${isPaused ? 'text-emerald-glow' : 'text-amber-glow'}`}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="btn-ghost flex items-center gap-1.5 text-xs">
            <Code size={13} /> Embed
          </button>
          <button type="button" className="btn-ghost flex items-center gap-1.5 text-xs">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon size={15} className="text-nexus-500" />
                <span className="flex items-center gap-0.5 text-xs font-mono text-emerald-glow">
                  <ArrowUpRight size={10} /> {s.change}
                </span>
              </div>
              <div className="font-display text-xl font-black text-nexus-50">{s.value}</div>
              <div className="text-[10px] font-mono text-nexus-500 tracking-wider uppercase mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-cyan-glow/[0.06]">
        {tabs.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === tab
                ? 'text-cyan-glow border-cyan-glow'
                : 'text-nexus-500 border-transparent hover:text-nexus-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Signups Over Time</h3>
              <div className="flex gap-2">
                {['7d', '30d', '90d'].map(period => (
                  <button key={period} type="button" className="text-[10px] font-mono text-nexus-500 hover:text-cyan-glow px-2 py-1 rounded bg-nexus-700/30 hover:bg-cyan-glow/5 transition-all">
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 flex items-end gap-[3px]">
              {overviewChartHeights.map(({ i, h }) => (
                <div
                  key={i}
                  className="flex-1 rounded-t transition-colors cursor-pointer bg-gradient-to-t from-cyan-glow/25 to-cyan-glow/5 hover:from-cyan-glow/50 hover:to-cyan-glow/15"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card-surface p-6">
              <h3 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Traffic Sources</h3>
              {[
                { source: 'Direct', pct: 42, color: 'bg-cyan-glow' },
                { source: 'Referral', pct: 28, color: 'bg-emerald-glow' },
                { source: 'Twitter/X', pct: 18, color: 'bg-violet-glow' },
                { source: 'ProductHunt', pct: 8, color: 'bg-amber-glow' },
                { source: 'Other', pct: 4, color: 'bg-nexus-500' },
              ].map((s, i) => (
                <div key={i} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-nexus-300">{s.source}</span>
                    <span className="text-xs font-mono text-nexus-500">{s.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-nexus-700/30 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color} opacity-60`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="card-surface p-6">
              <h3 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Top Locations</h3>
              {[
                { country: 'United States', count: '1,284', pct: 33 },
                { country: 'United Kingdom', count: '612', pct: 16 },
                { country: 'Germany', count: '445', pct: 12 },
                { country: 'Canada', count: '389', pct: 10 },
                { country: 'Japan', count: '312', pct: 8 },
              ].map((loc, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-nexus-700/20 last:border-0">
                  <span className="text-sm text-nexus-300">{loc.country}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-nexus-500">{loc.count}</span>
                    <span className="text-[10px] font-mono text-nexus-600">{loc.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Subscribers' && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button type="button" className="btn-ghost text-xs flex items-center gap-1.5"><Filter size={13} /> Filter</button>
              <button type="button" className="btn-ghost text-xs flex items-center gap-1.5"><Download size={13} /> Export CSV</button>
            </div>
            <span className="text-xs font-mono text-nexus-500">3,842 subscribers</span>
          </div>
          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-glow/[0.06]">
                    {['#', 'Name', 'Email', 'Source', 'Referrals', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-mono text-nexus-500 tracking-widest uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s, i) => (
                    <tr key={i} className="border-b border-cyan-glow/[0.03] hover:bg-cyan-glow/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-nexus-600">{s.position}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-glow/15 to-magenta-glow/15 flex items-center justify-center">
                            <span className="text-[9px] font-display font-bold text-cyan-glow">{s.name.split(' ').map(n=>n[0]).join('')}</span>
                          </div>
                          <span className="text-sm text-nexus-200 font-semibold">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-nexus-400">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${sourceColors[s.source]}`}>{s.source}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-nexus-400">{s.referrals}</td>
                      <td className="px-4 py-3 text-xs text-nexus-500">{s.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Referrals' && (
        <div className="animate-fade-in space-y-6">
          <div className="card-surface p-6">
            <h3 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Referral Tiers</h3>
            <div className="space-y-4">
              {referralData.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-nexus-700/15 border border-nexus-700/20">
                  <div>
                    <div className="text-sm font-semibold text-nexus-200">{r.tier}</div>
                    <div className="text-xs text-nexus-500 mt-0.5">Reward: {r.reward}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold text-cyan-glow">{r.count}</div>
                    <div className="text-[10px] font-mono text-nexus-600">members</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface p-6">
            <h3 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Top Referrers</h3>
            {subscribers.filter(s => s.referrals > 0).slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-nexus-700/20 last:border-0">
                <span className="font-display text-xs font-bold text-nexus-500 w-5">#{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-glow/15 to-magenta-glow/15 flex items-center justify-center">
                  <span className="text-[9px] font-display font-bold text-cyan-glow">{s.name.split(' ').map(n=>n[0]).join('')}</span>
                </div>
                <div className="flex-1">
                  <span className="text-sm text-nexus-200 font-semibold">{s.name}</span>
                </div>
                <span className="text-sm font-mono text-cyan-glow font-bold">{s.referrals}</span>
                <span className="text-[10px] text-nexus-600">referrals</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="animate-fade-in space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Project Name</label>
            <input type="text" defaultValue="SynthOS Launch" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Redirect URL</label>
            <input type="url" defaultValue="https://synthos.dev/thanks" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Webhook URL</label>
            <input type="url" placeholder="https://..." className="input-field" />
          </div>
          <div className="pt-4 border-t border-nexus-700/30">
            <button type="button" className="btn-primary">Save Changes</button>
          </div>
          <div className="pt-6 border-t border-nexus-700/30">
            <h3 className="font-display text-sm font-bold text-magenta-glow tracking-wider mb-2">Danger Zone</h3>
            <p className="text-xs text-nexus-500 mb-3">Delete this project and all associated data permanently.</p>
            <button type="button" className="px-4 py-2 rounded-lg border border-magenta-glow/30 text-magenta-glow text-xs font-display font-bold tracking-wider hover:bg-magenta-glow/10 transition-all">
              Delete Project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
