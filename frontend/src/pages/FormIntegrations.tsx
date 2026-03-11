import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft, Plus, Webhook, Mail, MessageCircle, Database,
  Zap, Globe, Check, X, ChevronDown, ChevronUp,
  Play, AlertTriangle, Clock, ArrowRight, RefreshCw, Trash2
} from 'lucide-react'

interface IntegrationDef {
  type: string
  name: string
  icon: LucideIcon
  color: string
  desc: string
}

const integrationDefs: IntegrationDef[] = [
  { type: 'webhook', name: 'Custom Webhook', icon: Webhook, color: 'cyan', desc: 'HTTP POST to any URL with HMAC verification' },
  { type: 'mailchimp', name: 'Mailchimp', icon: Mail, color: 'amber', desc: 'Add subscribers to your Mailchimp audience' },
  { type: 'sendgrid', name: 'SendGrid', icon: Mail, color: 'cyan', desc: 'Trigger transactional emails on signup' },
  { type: 'slack', name: 'Slack', icon: MessageCircle, color: 'violet', desc: 'Post signup notifications to a channel' },
  { type: 'discord', name: 'Discord', icon: MessageCircle, color: 'violet', desc: 'Webhook notifications to Discord' },
  { type: 'hubspot', name: 'HubSpot', icon: Globe, color: 'magenta', desc: 'Create contacts and deals in HubSpot' },
  { type: 'zapier', name: 'Zapier', icon: Zap, color: 'amber', desc: 'Connect to 5,000+ apps with zero code' },
  { type: 'google_sheets', name: 'Google Sheets', icon: Database, color: 'emerald', desc: 'Append rows to a spreadsheet on signup' },
  { type: 'segment', name: 'Segment', icon: Database, color: 'emerald', desc: 'Send identify + track events to Segment' },
  { type: 'supabase', name: 'Supabase', icon: Database, color: 'emerald', desc: 'Insert rows into your own Postgres DB' },
]

const eventTypes = [
  { id: 'waitlist.signup.created', label: 'New Signup', desc: 'Fires when a subscriber is added' },
  { id: 'waitlist.signup.verified', label: 'Email Verified', desc: 'Fires when double opt-in is confirmed' },
  { id: 'waitlist.signup.referred', label: 'Referral Made', desc: 'Fires when a subscriber refers someone' },
  { id: 'waitlist.signup.milestone', label: 'Tier Milestone', desc: 'Fires when a referral tier is reached' },
  { id: 'waitlist.signup.deleted', label: 'Subscriber Removed', desc: 'Fires on unsubscribe or deletion' },
]

const colorMap: Record<string, string> = {
  cyan: 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20',
  amber: 'bg-amber-glow/10 text-amber-glow border-amber-glow/20',
  violet: 'bg-violet-glow/10 text-violet-glow border-violet-glow/20',
  magenta: 'bg-magenta-glow/10 text-magenta-glow border-magenta-glow/20',
  emerald: 'bg-emerald-glow/10 text-emerald-glow border-emerald-glow/20',
}

interface FormIntegration {
  id: string
  type: string
  displayName: string
  enabled: boolean
  events: string[]
  lastTriggered: string
  failureCount: number
  config: Record<string, string | undefined>
}

const initialIntegrations: FormIntegration[] = [
  { id: 'int-001', type: 'slack', displayName: 'Growth Team Alerts', enabled: true, events: ['waitlist.signup.created', 'waitlist.signup.milestone'], lastTriggered: '2 min ago', failureCount: 0, config: { channel: '#growth-alerts' } },
  { id: 'int-002', type: 'webhook', displayName: 'CRM Sync Webhook', enabled: true, events: ['waitlist.signup.created', 'waitlist.signup.verified'], lastTriggered: '15 min ago', failureCount: 0, config: { url: 'https://api.internal.acme.com/waitlist-hook' } },
  { id: 'int-003', type: 'mailchimp', displayName: 'Marketing List Sync', enabled: false, events: ['waitlist.signup.verified'], lastTriggered: '3 days ago', failureCount: 2, config: { audience: 'Launch Subscribers' } },
]

export default function FormIntegrations() {
  const [integrations, setIntegrations] = useState<FormIntegration[]>(initialIntegrations)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [testSent, setTestSent] = useState<string | null>(null)
  const nextIdRef = useRef(0)

  const toggleEnabled = (id: string) => {
    setIntegrations(ints => ints.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i))
  }

  const removeIntegration = (id: string) => {
    setIntegrations(ints => ints.filter(i => i.id !== id))
  }

  const sendTest = (id: string) => {
    setTestSent(id)
    setTimeout(() => setTestSent(null), 2000)
  }

  const addIntegration = (type: string) => {
    const def = integrationDefs.find(d => d.type === type)
    if (!def) return
    nextIdRef.current += 1
    const newInt: FormIntegration = {
      id: `int-${nextIdRef.current}`,
      type,
      displayName: def.name,
      enabled: true,
      events: ['waitlist.signup.created'],
      lastTriggered: 'Never',
      failureCount: 0,
      config: {},
    }
    setIntegrations(ints => [...ints, newInt])
    setShowAdd(false)
    setExpandedId(newInt.id)
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Link to="/dashboard" className="no-underline inline-flex items-center gap-1.5 text-sm text-nexus-500 hover:text-cyan-glow transition-colors mb-5">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Form Integrations</h1>
          <p className="text-sm text-nexus-400 mt-1">
            Configure where signup data is sent when a form is submitted.
            <span className="text-cyan-glow font-mono ml-2">{integrations.filter(i => i.enabled).length} active</span>
          </p>
        </div>
        <button type="button" onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Integration
        </button>
      </div>

      {showAdd && (
        <div className="card-surface p-5 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Choose Integration</h2>
            <button type="button" onClick={() => setShowAdd(false)} className="text-nexus-500 hover:text-nexus-300"><X size={16} /></button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {integrationDefs.map(def => {
              const Icon = def.icon
              return (
                <button
                  key={def.type}
                  type="button"
                  onClick={() => addIntegration(def.type)}
                  className="text-left p-4 rounded-xl border border-nexus-700/20 bg-nexus-700/10 hover:border-cyan-glow/20 hover:bg-cyan-glow/[0.03] transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorMap[def.color]}`}>
                      <Icon size={14} />
                    </div>
                    <span className="font-display text-xs font-bold text-nexus-100 tracking-wider">{def.name}</span>
                  </div>
                  <p className="text-[11px] text-nexus-500 leading-relaxed">{def.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="card-surface p-5 mb-6">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Event Flow</h2>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="px-3 py-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
            <span className="text-xs font-mono text-cyan-glow">Form Submit</span>
          </div>
          <ArrowRight size={16} className="text-nexus-600" />
          <div className="px-3 py-2 rounded-lg bg-violet-glow/10 border border-violet-glow/20">
            <span className="text-xs font-mono text-violet-glow">Validation + Bot Check</span>
          </div>
          <ArrowRight size={16} className="text-nexus-600" />
          <div className="px-3 py-2 rounded-lg bg-emerald-glow/10 border border-emerald-glow/20">
            <span className="text-xs font-mono text-emerald-glow">Event Bus</span>
          </div>
          <ArrowRight size={16} className="text-nexus-600" />
          <div className="px-3 py-2 rounded-lg bg-amber-glow/10 border border-amber-glow/20">
            <span className="text-xs font-mono text-amber-glow">{integrations.filter(i => i.enabled).length} Integrations</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {integrations.length === 0 && (
          <div className="card-surface p-12 text-center">
            <Webhook size={32} className="text-nexus-600 mx-auto mb-3" />
            <p className="text-nexus-400">No integrations configured yet.</p>
            <button type="button" onClick={() => setShowAdd(true)} className="btn-secondary mt-4 text-xs">Add Your First Integration</button>
          </div>
        )}

        {integrations.map(int => {
          const def = integrationDefs.find(d => d.type === int.type) ?? integrationDefs[0]
          const isExpanded = expandedId === int.id
          const DefIcon = def.icon
          return (
            <div key={int.id} className={`card-surface overflow-hidden transition-all ${int.enabled ? 'border-cyan-glow/8' : 'opacity-60'}`}>
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : int.id)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setExpandedId(isExpanded ? null : int.id)}>
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[def.color]}`}>
                  <DefIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-nexus-100 text-sm truncate">{int.displayName}</span>
                    <span className="text-[9px] font-mono text-nexus-600 uppercase tracking-wider">{def.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-nexus-500">
                      <Clock size={9} /> {int.lastTriggered}
                    </span>
                    {int.failureCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-glow">
                        <AlertTriangle size={9} /> {int.failureCount} failures
                      </span>
                    )}
                    <span className="text-[10px] text-nexus-600">{int.events.length} events</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleEnabled(int.id) }}
                    className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${int.enabled ? 'bg-cyan-glow' : 'bg-nexus-600'}`}
                    style={{ width: 40, height: 20 }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white absolute top-[2px] transition-transform" style={{ width: 16, height: 16, transform: int.enabled ? 'translateX(22px)' : 'translateX(2px)' }} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-nexus-500" /> : <ChevronDown size={16} className="text-nexus-500" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-cyan-glow/[0.06] p-5 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Display Name</label>
                    <input type="text" defaultValue={int.displayName} className="input-field text-sm" />
                  </div>

                  {int.type === 'webhook' && (
                    <>
                      <div>
                        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Webhook URL</label>
                        <input type="url" defaultValue={int.config.url ?? ''} className="input-field text-sm font-mono" placeholder="https://api.yoursite.com/webhook" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">HMAC Secret</label>
                        <input type="password" defaultValue="whsec_••••••••" className="input-field text-sm font-mono" />
                        <p className="text-[10px] text-nexus-600 mt-1">Used to sign the X-NexusWait-Signature header for payload verification.</p>
                      </div>
                    </>
                  )}

                  {int.type === 'slack' && (
                    <div>
                      <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Channel</label>
                      <input type="text" defaultValue={int.config.channel ?? ''} className="input-field text-sm" placeholder="#your-channel" />
                    </div>
                  )}

                  {int.type === 'mailchimp' && (
                    <div>
                      <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Audience / List</label>
                      <input type="text" defaultValue={int.config.audience ?? ''} className="input-field text-sm" placeholder="Select audience..." />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-2">Trigger Events</label>
                    <div className="space-y-2">
                      {eventTypes.map(evt => {
                        const active = int.events.includes(evt.id)
                        return (
                          <label key={evt.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-nexus-700/15 cursor-pointer transition-all">
                            <input type="checkbox" defaultChecked={active} className="w-3.5 h-3.5 rounded accent-cyan-glow" />
                            <div>
                              <span className="text-sm text-nexus-200 font-semibold">{evt.label}</span>
                              <span className="text-[10px] text-nexus-600 ml-2">{evt.desc}</span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-2">Field Mapping</label>
                    <div className="card-surface p-3 space-y-2">
                      {[['email', 'email_address'], ['name', 'full_name'], ['company', 'company_name']].map(([from, to]) => (
                        <div key={from} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-nexus-300 bg-nexus-700/30 px-2 py-0.5 rounded">{from}</span>
                          <ArrowRight size={10} className="text-nexus-600" />
                          <span className="text-xs font-mono text-cyan-glow/70 bg-cyan-glow/5 px-2 py-0.5 rounded">{to}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => sendTest(int.id)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                        {testSent === int.id ? <><Check size={12} /> Sent!</> : <><Play size={12} /> Send Test</>}
                      </button>
                      <button type="button" className="btn-ghost text-xs flex items-center gap-1.5"><RefreshCw size={12} /> Retry Failed</button>
                    </div>
                    <button type="button" onClick={() => removeIntegration(int.id)} className="btn-ghost text-xs text-magenta-glow/70 hover:text-magenta-glow flex items-center gap-1.5">
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
