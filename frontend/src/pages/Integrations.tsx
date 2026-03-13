import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Search, Check, Settings,
  Mail, MessageCircle, Database, Globe, Zap, Webhook, Loader2,
} from 'lucide-react'
import { useProjects, useIntegrations, useCreateIntegration } from '../api/hooks'

interface IntegrationItem {
  name: string
  type: string
  desc: string
  category: string
  icon: LucideIcon
  color: string
}

const integrations: IntegrationItem[] = [
  { name: 'Slack', type: 'slack', desc: 'Get real-time signup notifications in your channels.', category: 'Communication', icon: MessageCircle, color: 'bg-violet-glow/10 text-violet-glow border-violet-glow/20' },
  { name: 'Mailchimp', type: 'mailchimp', desc: 'Sync subscribers to your email marketing lists automatically.', category: 'Email', icon: Mail, color: 'bg-amber-glow/10 text-amber-glow border-amber-glow/20' },
  { name: 'Zapier', type: 'zapier', desc: 'Connect NexusWait to 5,000+ apps with zero code.', category: 'Automation', icon: Zap, color: 'bg-amber-glow/10 text-amber-glow border-amber-glow/20' },
  { name: 'Webhook', type: 'webhook', desc: 'Send real-time events to any HTTP endpoint.', category: 'Developer', icon: Webhook, color: 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20' },
  { name: 'Segment', type: 'segment', desc: 'Route signup data to your analytics and data warehouse.', category: 'Analytics', icon: Database, color: 'bg-emerald-glow/10 text-emerald-glow border-emerald-glow/20' },
  { name: 'HubSpot', type: 'hubspot', desc: 'Create contacts and deals from waitlist signups.', category: 'CRM', icon: Globe, color: 'bg-magenta-glow/10 text-magenta-glow border-magenta-glow/20' },
  { name: 'Intercom', type: 'intercom', desc: 'Engage waitlist leads with targeted messages.', category: 'Communication', icon: MessageCircle, color: 'bg-violet-glow/10 text-violet-glow border-violet-glow/20' },
  { name: 'Supabase', type: 'supabase', desc: 'Store subscriber data in your own Postgres database.', category: 'Developer', icon: Database, color: 'bg-emerald-glow/10 text-emerald-glow border-emerald-glow/20' },
  { name: 'SendGrid', type: 'sendgrid', desc: 'Trigger custom transactional emails on signup.', category: 'Email', icon: Mail, color: 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20' },
  { name: 'Google Sheets', type: 'google_sheets', desc: 'Auto-export signups to a Google spreadsheet.', category: 'Automation', icon: Database, color: 'bg-emerald-glow/10 text-emerald-glow border-emerald-glow/20' },
  { name: 'Discord', type: 'discord', desc: 'Post signup alerts to your Discord server.', category: 'Communication', icon: MessageCircle, color: 'bg-violet-glow/10 text-violet-glow border-violet-glow/20' },
]

const categories = ['All', 'Communication', 'Email', 'Automation', 'Developer', 'CRM', 'Analytics']

export default function Integrations() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  // Real backend data
  const { data: projectsList } = useProjects()
  const projects = projectsList ?? []
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const { data: integrationsData } = useIntegrations(selectedProjectId)
  const liveIntegrations = (
    Array.isArray(integrationsData)
      ? integrationsData
      : (integrationsData as { data?: unknown[] })?.data ?? []
  ) as { type: string; enabled: boolean; id: string }[]

  const createInt = useCreateIntegration(selectedProjectId)

  // Derive connected state from real integrations
  const connectedTypes = new Set(liveIntegrations.map(i => i.type.toLowerCase()))
  const connectedCount = liveIntegrations.filter(i => i.enabled).length

  const handleConnect = (item: IntegrationItem) => {
    if (!selectedProjectId) return

    if (connectedTypes.has(item.type)) {
      // Already connected — navigate to manage
      navigate('/dashboard/form-integrations')
    } else {
      // Create new integration with defaults, then navigate to configure
      createInt.mutate(
        { type: item.type, displayName: item.name, events: ['waitlist.signup.created'], config: {} },
        { onSuccess: () => navigate('/dashboard/form-integrations') },
      )
    }
  }

  const filtered = integrations.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || i.category === filter
    return matchSearch && matchFilter
  })

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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-500" />
          <input
            type="text"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, i) => {
          const isConnected = connectedTypes.has(item.type)
          const Icon = item.icon
          return (
            <div
              key={item.name}
              className={`card-surface p-5 flex flex-col animate-slide-up ${isConnected ? 'border-cyan-glow/10' : ''}`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${item.color}`}>
                  <Icon size={18} />
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
                  type="button"
                  onClick={() => handleConnect(item)}
                  disabled={createInt.isPending}
                  className={`text-xs font-display font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    isConnected
                      ? 'text-cyan-glow border border-cyan-glow/30 hover:bg-cyan-glow/10'
                      : 'text-nexus-300 border border-nexus-600 hover:text-cyan-glow hover:border-cyan-glow/30'
                  }`}
                >
                  {createInt.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : isConnected ? (
                    <><Settings size={12} /> Configure</>
                  ) : (
                    'Connect'
                  )}
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
    </div>
  )
}
