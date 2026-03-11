import { useState } from 'react'
import {
  Search, ExternalLink, Check, Plus, Zap, ArrowRight,
  Mail, MessageCircle, Database, Globe, Code, Webhook
} from 'lucide-react'

const integrations = [
  {
    name: 'Slack',
    desc: 'Get real-time signup notifications in your channels.',
    category: 'Communication',
    icon: MessageCircle,
    color: 'bg-violet-glow/10 text-violet-glow border-violet-glow/20',
    connected: true,
  },
  {
    name: 'Mailchimp',
    desc: 'Sync subscribers to your email marketing lists automatically.',
    category: 'Email',
    icon: Mail,
    color: 'bg-amber-glow/10 text-amber-glow border-amber-glow/20',
    connected: true,
  },
  {
    name: 'Zapier',
    desc: 'Connect NexusWait to 5,000+ apps with zero code.',
    category: 'Automation',
    icon: Zap,
    color: 'bg-amber-glow/10 text-amber-glow border-amber-glow/20',
    connected: false,
  },
  {
    name: 'Webhook',
    desc: 'Send real-time events to any HTTP endpoint.',
    category: 'Developer',
    icon: Webhook,
    color: 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20',
    connected: true,
  },
  {
    name: 'Segment',
    desc: 'Route signup data to your analytics and data warehouse.',
    category: 'Analytics',
    icon: Database,
    color: 'bg-emerald-glow/10 text-emerald-glow border-emerald-glow/20',
    connected: false,
  },
  {
    name: 'HubSpot',
    desc: 'Create contacts and deals from waitlist signups.',
    category: 'CRM',
    icon: Globe,
    color: 'bg-magenta-glow/10 text-magenta-glow border-magenta-glow/20',
    connected: false,
  },
  {
    name: 'Intercom',
    desc: 'Engage waitlist leads with targeted messages.',
    category: 'Communication',
    icon: MessageCircle,
    color: 'bg-violet-glow/10 text-violet-glow border-violet-glow/20',
    connected: false,
  },
  {
    name: 'Supabase',
    desc: 'Store subscriber data in your own Postgres database.',
    category: 'Developer',
    icon: Database,
    color: 'bg-emerald-glow/10 text-emerald-glow border-emerald-glow/20',
    connected: false,
  },
  {
    name: 'SendGrid',
    desc: 'Trigger custom transactional emails on signup.',
    category: 'Email',
    icon: Mail,
    color: 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20',
    connected: false,
  },
  {
    name: 'REST API',
    desc: 'Full access to all NexusWait data and operations.',
    category: 'Developer',
    icon: Code,
    color: 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20',
    connected: true,
  },
  {
    name: 'Google Sheets',
    desc: 'Auto-export signups to a Google spreadsheet.',
    category: 'Automation',
    icon: Database,
    color: 'bg-emerald-glow/10 text-emerald-glow border-emerald-glow/20',
    connected: false,
  },
  {
    name: 'Discord',
    desc: 'Post signup alerts to your Discord server.',
    category: 'Communication',
    icon: MessageCircle,
    color: 'bg-violet-glow/10 text-violet-glow border-violet-glow/20',
    connected: false,
  },
]

const categories = ['All', 'Communication', 'Email', 'Automation', 'Developer', 'CRM', 'Analytics']

export default function Integrations() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [connectedState, setConnectedState] = useState(
    Object.fromEntries(integrations.map(i => [i.name, i.connected]))
  )

  const toggleConnect = name => {
    setConnectedState(s => ({ ...s, [name]: !s[name] }))
  }

  const filtered = integrations.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || i.category === filter
    return matchSearch && matchFilter
  })

  const connectedCount = Object.values(connectedState).filter(Boolean).length

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Integrations</h1>
          <p className="text-sm text-nexus-400 mt-1">
            Connect NexusWait to your favorite tools. <span className="text-cyan-glow font-mono">{connectedCount}</span> active.
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all ${
                filter === cat
                  ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20'
                  : 'text-nexus-500 border border-nexus-700/30 hover:border-nexus-600/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, i) => {
          const isConnected = connectedState[item.name]
          return (
            <div
              key={item.name}
              className={`card-surface p-5 flex flex-col animate-slide-up ${isConnected ? 'border-cyan-glow/10' : ''}`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${item.color}`}>
                  <item.icon size={18} />
                </div>
                {isConnected && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-glow bg-emerald-glow/10 px-2 py-0.5 rounded-full">
                    <Check size={9} /> Active
                  </span>
                )}
              </div>
              <h3 className="font-display text-sm font-bold text-nexus-100 tracking-wider">{item.name}</h3>
              <p className="text-xs text-nexus-500 mt-1 flex-1 leading-relaxed">{item.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-mono text-nexus-600 tracking-wider uppercase">{item.category}</span>
                <button
                  onClick={() => toggleConnect(item.name)}
                  className={`text-xs font-display font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                    isConnected
                      ? 'text-nexus-500 border border-nexus-600 hover:text-magenta-glow hover:border-magenta-glow/30'
                      : 'text-cyan-glow border border-cyan-glow/30 hover:bg-cyan-glow/10'
                  }`}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-nexus-500">No integrations found matching your search.</p>
        </div>
      )}

      {/* API Key Section */}
      <div className="mt-10 card-surface p-6">
        <div className="flex items-center gap-3 mb-4">
          <Code size={18} className="text-cyan-glow" />
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">API Access</h2>
        </div>
        <p className="text-sm text-nexus-400 mb-4">Use the NexusWait REST API for full programmatic control.</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value="nw_sk_live_a8f3k2m9x1b7c4d6e0g5h..."
            className="input-field font-mono text-xs flex-1"
          />
          <button className="btn-ghost text-xs">Regenerate</button>
        </div>
      </div>
    </div>
  )
}
