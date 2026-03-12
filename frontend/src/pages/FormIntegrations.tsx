import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft, Plus, Webhook, Mail, MessageCircle, Database,
  Zap, Globe, Check, X, ChevronDown, ChevronUp,
  Play, AlertTriangle, Clock, ArrowRight, RefreshCw, Trash2, Loader2
} from 'lucide-react'
import {
  useProjects,
  useIntegrations,
  useCreateIntegration,
  useUpdateIntegration,
  useDeleteIntegration,
  useTestIntegration,
  getMutationErrorMessage,
} from '../api/hooks'

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

interface ApiIntegration {
  id: string
  type: string
  displayName?: string
  name?: string
  enabled: boolean
  events?: string[]
  lastTriggeredAt?: string
  failureCount?: number
  config?: Record<string, string | undefined>
}

export default function FormIntegrations() {
  // ─── Project selector ──────────────────────────────
  const { data: projectsList, isLoading: projectsLoading } = useProjects()
  const projects = projectsList ?? []
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  // ─── Integrations data ─────────────────────────────
  const { data: integrationsData, isLoading: intLoading } = useIntegrations(selectedProjectId)
  const integrations = (
    Array.isArray(integrationsData)
      ? integrationsData
      : (integrationsData as { data?: unknown[] })?.data ?? []
  ) as ApiIntegration[]

  const createIntegration = useCreateIntegration(selectedProjectId)

  // ─── Local UI state ────────────────────────────────
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [testSentId, setTestSentId] = useState<string | null>(null)

  const addIntegration = (type: string) => {
    const def = integrationDefs.find(d => d.type === type)
    if (!def) return
    createIntegration.mutate(
      { type, displayName: def.name, enabled: true, events: ['waitlist.signup.created'] },
      {
        onSuccess: (data: unknown) => {
          setShowAdd(false)
          const created = data as { id?: string }
          if (created?.id) setExpandedId(created.id)
        },
      },
    )
  }

  const enabledCount = integrations.filter(i => i.enabled).length

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
            <span className="text-cyan-glow font-mono ml-2">{enabledCount} active</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Project selector */}
          {projectsLoading ? (
            <span className="text-xs text-nexus-500">Loading...</span>
          ) : (
            <select
              value={selectedProjectId ?? ''}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="input-field text-xs py-1.5 w-40"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {projects.length === 0 && <option value="">No projects</option>}
            </select>
          )}
          <button type="button" onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Integration
          </button>
        </div>
      </div>

      {(createIntegration.isError) && (
        <p className="text-magenta-glow text-xs mb-4">{getMutationErrorMessage(createIntegration.error)}</p>
      )}

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
                  disabled={createIntegration.isPending}
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
            <span className="text-xs font-mono text-amber-glow">{enabledCount} Integrations</span>
          </div>
        </div>
      </div>

      {intLoading && <p className="text-nexus-500 text-sm mb-4">Loading integrations...</p>}

      <div className="space-y-3">
        {!intLoading && integrations.length === 0 && (
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
          const displayName = int.displayName ?? int.name ?? def.name
          const events = int.events ?? []
          const lastTriggered = int.lastTriggeredAt ? getTimeAgo(int.lastTriggeredAt) : 'Never'

          return (
            <IntegrationRow
              key={int.id}
              int={int}
              def={def}
              DefIcon={DefIcon}
              displayName={displayName}
              events={events}
              lastTriggered={lastTriggered}
              isExpanded={isExpanded}
              projectId={selectedProjectId}
              testSentId={testSentId}
              setTestSentId={setTestSentId}
              onToggleExpand={() => setExpandedId(isExpanded ? null : int.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Integration row component (needs its own hooks for per-integration mutations) ──
function IntegrationRow({
  int,
  def,
  DefIcon,
  displayName,
  events,
  lastTriggered,
  isExpanded,
  projectId,
  testSentId,
  setTestSentId,
  onToggleExpand,
}: {
  int: ApiIntegration
  def: IntegrationDef
  DefIcon: LucideIcon
  displayName: string
  events: string[]
  lastTriggered: string
  isExpanded: boolean
  projectId: string | undefined
  testSentId: string | null
  setTestSentId: (id: string | null) => void
  onToggleExpand: () => void
}) {
  const updateInt = useUpdateIntegration(projectId, int.id)
  const deleteInt = useDeleteIntegration(projectId, int.id)
  const testInt = useTestIntegration(projectId, int.id)

  const toggleEnabled = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateInt.mutate({ enabled: !int.enabled })
  }

  const sendTest = () => {
    testInt.mutate(undefined, {
      onSuccess: () => {
        setTestSentId(int.id)
        setTimeout(() => setTestSentId(null), 2000)
      },
    })
  }

  const remove = () => {
    deleteInt.mutate()
  }

  return (
    <div className={`card-surface overflow-hidden transition-all ${int.enabled ? 'border-cyan-glow/8' : 'opacity-60'}`}>
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={onToggleExpand} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onToggleExpand()}>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[def.color]}`}>
          <DefIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-nexus-100 text-sm truncate">{displayName}</span>
            <span className="text-[9px] font-mono text-nexus-600 uppercase tracking-wider">{def.name}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-[10px] text-nexus-500">
              <Clock size={9} /> {lastTriggered}
            </span>
            {(int.failureCount ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-amber-glow">
                <AlertTriangle size={9} /> {int.failureCount} failures
              </span>
            )}
            <span className="text-[10px] text-nexus-600">{events.length} events</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleEnabled}
            disabled={updateInt.isPending}
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
            <input type="text" defaultValue={displayName} className="input-field text-sm" />
          </div>

          {int.type === 'webhook' && (
            <>
              <div>
                <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Webhook URL</label>
                <input type="url" defaultValue={int.config?.url ?? ''} className="input-field text-sm font-mono" placeholder="https://api.yoursite.com/webhook" />
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
              <input type="text" defaultValue={int.config?.channel ?? ''} className="input-field text-sm" placeholder="#your-channel" />
            </div>
          )}

          {int.type === 'mailchimp' && (
            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Audience / List</label>
              <input type="text" defaultValue={int.config?.audience ?? ''} className="input-field text-sm" placeholder="Select audience..." />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-2">Trigger Events</label>
            <div className="space-y-2">
              {eventTypes.map(evt => {
                const active = events.includes(evt.id)
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

          {(updateInt.isError || deleteInt.isError || testInt.isError) && (
            <p className="text-magenta-glow text-xs">
              {getMutationErrorMessage(updateInt.error ?? deleteInt.error ?? testInt.error)}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={sendTest}
                disabled={testInt.isPending}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                {testInt.isPending
                  ? <><Loader2 size={12} className="animate-spin" /> Testing...</>
                  : testSentId === int.id
                    ? <><Check size={12} /> Sent!</>
                    : <><Play size={12} /> Send Test</>}
              </button>
              <button type="button" className="btn-ghost text-xs flex items-center gap-1.5"><RefreshCw size={12} /> Retry Failed</button>
            </div>
            <button
              type="button"
              onClick={remove}
              disabled={deleteInt.isPending}
              className="btn-ghost text-xs text-magenta-glow/70 hover:text-magenta-glow flex items-center gap-1.5"
            >
              {deleteInt.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Remove
            </button>
          </div>
        </div>
      )}
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
