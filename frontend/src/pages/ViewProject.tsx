import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft, Users, TrendingUp, Share2, Eye, Copy,
  Download, Filter, Pause, Play, Code, Globe, ArrowUpRight, Loader2, Save, Trash2, X, Check, Terminal, FileCode, Zap
} from 'lucide-react'
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useSubscribers,
  useAnalyticsOverview,
  useAnalyticsTimeseries,
  useAnalyticsSources,
  useReferralLeaderboard,
  usePlatformConfig,
  getMutationErrorMessage,
} from '../api/hooks'
import { CustomFieldsBuilder } from './CustomFieldsBuilder'
import type { CustomFieldDefinition } from '../shared/hosted-page-types'

const tabsList = ['Overview', 'Subscribers', 'Referrals', 'Settings'] as const
type Tab = (typeof tabsList)[number]

const sourceColors: Record<string, string> = {
  referral: 'bg-emerald-glow/10 text-emerald-glow',
  direct: 'bg-cyan-glow/10 text-cyan-glow',
  twitter: 'bg-violet-glow/10 text-violet-glow',
  producthunt: 'bg-amber-glow/10 text-amber-glow',
}

const barColorMap: Record<string, string> = {
  direct: 'bg-cyan-glow',
  referral: 'bg-emerald-glow',
  twitter: 'bg-violet-glow',
  producthunt: 'bg-amber-glow',
}

export default function ViewProject() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [period, setPeriod] = useState('7d')
  const [showEmbed, setShowEmbed] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  // ─── Data hooks ────────────────────────────────────
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id)
  const updateProject = useUpdateProject(id)
  const deleteProject = useDeleteProject(id)

  const { data: overview } = useAnalyticsOverview(id)
  const { data: timeseries } = useAnalyticsTimeseries(id, period)
  const { data: sourcesData } = useAnalyticsSources(id)
  const { data: subscribersData, isLoading: subsLoading } = useSubscribers(id)
  const { data: referralData } = useReferralLeaderboard(id)
  const { data: platformConfig } = usePlatformConfig()
  const apiUrl = platformConfig?.apiBaseUrl ?? 'https://api.nexuswait.io'
  const cdnUrl = platformConfig?.cdnBaseUrl ?? 'https://cdn.nexuswait.io'

  // ─── Settings tab state ────────────────────────────
  const [settingsName, setSettingsName] = useState('')
  const [settingsRedirect, setSettingsRedirect] = useState('')
  const [settingsWebhook, setSettingsWebhook] = useState('')
  const [settingsCustomFields, setSettingsCustomFields] = useState<CustomFieldDefinition[]>([])
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Populate settings inputs when project loads
  if (project && !settingsLoaded) {
    setSettingsName(project.name ?? '')
    setSettingsRedirect((project.redirectUrl as string) ?? '')
    setSettingsWebhook((project.webhookUrl as string) ?? '')
    setSettingsCustomFields(((project as Record<string, unknown>).customFields as CustomFieldDefinition[]) ?? [])
    setSettingsLoaded(true)
  }

  // Project-level custom field definitions (for subscriber detail display)
  const projectCustomFields = ((project as Record<string, unknown> | undefined)?.customFields as CustomFieldDefinition[] | undefined) ?? []

  // ─── Derived analytics ─────────────────────────────
  const ov = overview as
    | { totalSignups?: number; pageViews?: number; referralRate?: number; avgDaily?: number; signupChange?: string; viewsChange?: string; referralChange?: string; dailyChange?: string }
    | undefined

  const stats: { label: string; value: string; icon: LucideIcon; change: string }[] = [
    { label: 'Total Signups', value: (ov?.totalSignups ?? 0).toLocaleString(), icon: Users, change: ov?.signupChange ?? '' },
    { label: 'Page Views', value: (ov?.pageViews ?? 0).toLocaleString(), icon: Eye, change: ov?.viewsChange ?? '' },
    { label: 'Referral Rate', value: ov?.referralRate != null ? `${ov.referralRate}%` : '0%', icon: Share2, change: ov?.referralChange ?? '' },
    { label: 'Avg. Daily', value: (ov?.avgDaily ?? 0).toLocaleString(), icon: TrendingUp, change: ov?.dailyChange ?? '' },
  ]

  const tsPoints = (Array.isArray(timeseries) ? timeseries : (timeseries as { data?: unknown[] })?.data ?? []) as { date?: string; count?: number }[]
  const maxCount = Math.max(...tsPoints.map(p => p.count ?? 0), 1)

  const sources = (Array.isArray(sourcesData) ? sourcesData : (sourcesData as { data?: unknown[] })?.data ?? []) as { source?: string; count?: number; pct?: number }[]

  const subscribers = (Array.isArray(subscribersData) ? subscribersData : (subscribersData as { data?: unknown[] })?.data ?? []) as {
    id?: string; email?: string; name?: string; source?: string; referrals?: number; position?: number; createdAt?: string
    referralCode?: string; referrer?: { id?: string; email?: string; referralCode?: string } | null
    metadata?: Record<string, unknown> | null; verifiedAt?: string | null
    _count?: { referred?: number }
  }[]

  // ─── Subscriber detail modal state ───────────────────
  const [selectedSub, setSelectedSub] = useState<(typeof subscribers)[number] | null>(null)

  const leaderboard = (Array.isArray(referralData) ? referralData : (referralData as { data?: unknown[] })?.data ?? []) as {
    tier?: string; count?: number; reward?: string; name?: string; email?: string; referrals?: number
  }[]

  const isPaused = project?.status === 'paused'

  // ─── Actions ───────────────────────────────────────
  const togglePause = () => {
    updateProject.mutate({ status: isPaused ? 'active' : 'paused' })
  }

  const saveSettings = () => {
    updateProject.mutate(
      { name: settingsName, redirectUrl: settingsRedirect, webhookUrl: settingsWebhook, customFields: settingsCustomFields as unknown as Record<string, unknown>[] },
      {
        onSuccess: () => {
          setSettingsSaved(true)
          setTimeout(() => setSettingsSaved(false), 2000)
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    deleteProject.mutate(undefined, {
      onSuccess: () => navigate('/dashboard'),
    })
  }

  // ─── Loading / Error ───────────────────────────────
  if (projectLoading) {
    return (
      <div className="animate-fade-in flex items-center gap-2 text-nexus-400 p-8">
        <Loader2 size={16} className="animate-spin" /> Loading project...
      </div>
    )
  }

  if (projectError || !project) {
    return (
      <div className="animate-fade-in p-8">
        <Link to="/dashboard" className="no-underline inline-flex items-center gap-1.5 text-sm text-nexus-500 hover:text-cyan-glow transition-colors mb-5">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <p className="text-magenta-glow text-sm">Failed to load project.</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Link to="/dashboard" className="no-underline inline-flex items-center gap-1.5 text-sm text-nexus-500 hover:text-cyan-glow transition-colors mb-5">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-glow/15 to-violet-glow/15 border border-cyan-glow/10 flex items-center justify-center">
            <span className="font-display text-sm font-bold text-cyan-glow">{(project.name || 'P').charAt(0)}</span>
          </div>
          <div>
            <h1 className="font-display text-xl font-black text-nexus-50 tracking-wider">{project.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Globe size={11} className="text-nexus-500" />
              <span className="text-xs font-mono text-nexus-500">{project.slug ?? id}</span>
              <button type="button" className="text-nexus-600 hover:text-cyan-glow"><Copy size={10} /></button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePause}
            disabled={updateProject.isPending}
            className={`btn-ghost flex items-center gap-1.5 text-xs ${isPaused ? 'text-emerald-glow' : 'text-amber-glow'}`}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={() => setShowEmbed(true)} className="btn-ghost flex items-center gap-1.5 text-xs">
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
                {s.change && (
                  <span className="flex items-center gap-0.5 text-xs font-mono text-emerald-glow">
                    <ArrowUpRight size={10} /> {s.change}
                  </span>
                )}
              </div>
              <div className="font-display text-xl font-black text-nexus-50">{s.value}</div>
              <div className="text-[10px] font-mono text-nexus-500 tracking-wider uppercase mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-cyan-glow/[0.06]">
        {tabsList.map(tab => (
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
                {['7d', '30d', '90d'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`text-[10px] font-mono px-2 py-1 rounded transition-all ${
                      period === p ? 'text-cyan-glow bg-cyan-glow/10' : 'text-nexus-500 hover:text-cyan-glow bg-nexus-700/30 hover:bg-cyan-glow/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 flex items-end gap-[3px]">
              {tsPoints.length > 0
                ? tsPoints.map((point, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-colors cursor-pointer bg-gradient-to-t from-cyan-glow/25 to-cyan-glow/5 hover:from-cyan-glow/50 hover:to-cyan-glow/15"
                      style={{ height: `${Math.max(((point.count ?? 0) / maxCount) * 100, 2)}%` }}
                      title={`${point.date ?? ''}: ${point.count ?? 0}`}
                    />
                  ))
                : (
                  <p className="text-xs text-nexus-500 m-auto">No data for this period.</p>
                )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card-surface p-6">
              <h3 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Traffic Sources</h3>
              {sources.length > 0
                ? sources.map((s, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-nexus-300">{s.source ?? 'Unknown'}</span>
                        <span className="text-xs font-mono text-nexus-500">{s.pct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 bg-nexus-700/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColorMap[(s.source ?? '').toLowerCase()] ?? 'bg-nexus-500'} opacity-60`}
                          style={{ width: `${s.pct ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ))
                : <p className="text-xs text-nexus-500">No source data yet.</p>}
            </div>

            <div className="card-surface p-6">
              <h3 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Top Locations</h3>
              <p className="text-xs text-nexus-500">Location data will appear here as signups grow.</p>
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
            <span className="text-xs font-mono text-nexus-500">{subscribers.length.toLocaleString()} subscribers</span>
          </div>

          {subsLoading && <p className="text-nexus-500 text-sm">Loading subscribers...</p>}

          {!subsLoading && (
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
                    {subscribers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-nexus-500">No subscribers yet.</td>
                      </tr>
                    )}
                    {subscribers.map((s, i) => {
                      const displayName = s.name ?? s.email ?? ''
                      const initials = displayName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                      const refCount = s._count?.referred ?? s.referrals ?? 0
                      return (
                        <tr
                          key={s.id ?? i}
                          className="border-b border-cyan-glow/[0.03] hover:bg-cyan-glow/[0.02] transition-colors cursor-pointer"
                          onClick={() => setSelectedSub(s)}
                        >
                          <td className="px-4 py-3 text-xs font-mono text-nexus-600">{s.position ?? i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-glow/15 to-magenta-glow/15 flex items-center justify-center">
                                <span className="text-[9px] font-display font-bold text-cyan-glow">{initials}</span>
                              </div>
                              <span className="text-sm text-nexus-200 font-semibold">{s.name ?? '--'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-nexus-400">{s.email ?? '--'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${sourceColors[s.source ?? ''] ?? 'bg-nexus-600/10 text-nexus-400'}`}>{s.source ?? 'direct'}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-nexus-400">{refCount}</td>
                          <td className="px-4 py-3 text-xs text-nexus-500">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '--'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Referrals' && (
        <div className="animate-fade-in space-y-6">
          <div className="card-surface p-6">
            <h3 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Referral Leaderboard</h3>
            {leaderboard.length === 0 && <p className="text-xs text-nexus-500">No referral data yet.</p>}
            <div className="space-y-4">
              {leaderboard.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-nexus-700/15 border border-nexus-700/20">
                  <div>
                    <div className="text-sm font-semibold text-nexus-200">{r.name ?? r.tier ?? `#${i + 1}`}</div>
                    {r.email && <div className="text-xs text-nexus-500 mt-0.5">{r.email}</div>}
                    {r.reward && <div className="text-xs text-nexus-500 mt-0.5">Reward: {r.reward}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold text-cyan-glow">{(r.referrals ?? r.count ?? 0).toLocaleString()}</div>
                    <div className="text-[10px] font-mono text-nexus-600">referrals</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="animate-fade-in space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Project Name</label>
            <input type="text" value={settingsName} onChange={e => setSettingsName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Redirect URL</label>
            <input type="url" value={settingsRedirect} onChange={e => setSettingsRedirect(e.target.value)} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Webhook URL</label>
            <input type="url" value={settingsWebhook} onChange={e => setSettingsWebhook(e.target.value)} className="input-field" placeholder="https://..." />
          </div>
          <div className="pt-5 border-t border-nexus-700/30">
            <CustomFieldsBuilder fields={settingsCustomFields} onChange={setSettingsCustomFields} />
            <p className="text-[10px] text-nexus-600 mt-2">
              Custom field values are stored in each subscriber&apos;s metadata. Use them in hosted pages, embeds, or API integrations.
            </p>
          </div>
          {updateProject.isError && (
            <p className="text-magenta-glow text-xs">{getMutationErrorMessage(updateProject.error)}</p>
          )}
          <div className="pt-4 border-t border-nexus-700/30">
            <button
              type="button"
              onClick={saveSettings}
              disabled={updateProject.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {updateProject.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {settingsSaved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
          <div className="pt-6 border-t border-nexus-700/30">
            <h3 className="font-display text-sm font-bold text-magenta-glow tracking-wider mb-2">Danger Zone</h3>
            <p className="text-xs text-nexus-500 mb-3">Delete this project and all associated data permanently.</p>
            {deleteProject.isError && (
              <p className="text-magenta-glow text-xs mb-2">{getMutationErrorMessage(deleteProject.error)}</p>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="px-4 py-2 rounded-lg border border-magenta-glow/30 text-magenta-glow text-xs font-display font-bold tracking-wider hover:bg-magenta-glow/10 transition-all flex items-center gap-2"
            >
              <Trash2 size={13} />
              {deleteConfirm ? 'Confirm Delete' : 'Delete Project'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Subscriber Detail Modal ──────────────────────── */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexus-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedSub(null)}>
          <div className="w-full max-w-md mx-4 card-surface p-6 relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setSelectedSub(null)} className="absolute top-4 right-4 text-nexus-500 hover:text-nexus-200 transition-colors">
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-glow/15 to-magenta-glow/15 flex items-center justify-center">
                <span className="text-sm font-display font-bold text-cyan-glow">
                  {(selectedSub.name ?? selectedSub.email ?? '?')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-nexus-50 tracking-wider">{selectedSub.name ?? 'Unnamed'}</h2>
                <p className="text-xs font-mono text-nexus-400">{selectedSub.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-nexus-900/50 border border-nexus-700/30 rounded-lg p-3 text-center">
                <div className="font-display text-lg font-bold text-cyan-glow">#{selectedSub.position ?? '—'}</div>
                <div className="text-[9px] font-mono text-nexus-500 tracking-wider uppercase mt-0.5">Position</div>
              </div>
              <div className="bg-nexus-900/50 border border-nexus-700/30 rounded-lg p-3 text-center">
                <div className="font-display text-lg font-bold text-emerald-glow">{selectedSub._count?.referred ?? selectedSub.referrals ?? 0}</div>
                <div className="text-[9px] font-mono text-nexus-500 tracking-wider uppercase mt-0.5">Referrals</div>
              </div>
              <div className="bg-nexus-900/50 border border-nexus-700/30 rounded-lg p-3 text-center">
                <div className="font-display text-lg font-bold text-violet-glow">{selectedSub.verifiedAt ? 'Yes' : 'No'}</div>
                <div className="text-[9px] font-mono text-nexus-500 tracking-wider uppercase mt-0.5">Verified</div>
              </div>
            </div>

            <div className="space-y-3">
              <DetailRow label="ID" value={selectedSub.id ?? '—'} mono />
              <DetailRow label="Source" value={selectedSub.source ?? 'direct'} />
              <DetailRow label="Referral Code" value={selectedSub.referralCode ?? '—'} mono />
              {selectedSub.referrer && (
                <DetailRow label="Referred By" value={selectedSub.referrer.email ?? selectedSub.referrer.referralCode ?? '—'} />
              )}
              <DetailRow label="Signed Up" value={selectedSub.createdAt ? new Date(selectedSub.createdAt).toLocaleString() : '—'} />
              {selectedSub.metadata && Object.keys(selectedSub.metadata).length > 0 && (() => {
                const meta = selectedSub.metadata as Record<string, unknown>
                const fieldKeyMap = new Map(projectCustomFields.map((f) => [f.fieldKey, f.label]))
                const knownKeys = new Set(projectCustomFields.map((f) => f.fieldKey))
                const unknownEntries = Object.entries(meta).filter(([k]) => !knownKeys.has(k))
                return (
                  <div className="space-y-2">
                    {projectCustomFields.length > 0 && (
                      <div className="text-[10px] font-mono text-nexus-500 tracking-wider uppercase">Custom Fields</div>
                    )}
                    {projectCustomFields.map((f) => {
                      const val = meta[f.fieldKey]
                      if (val === undefined || val === null || val === '') return null
                      return <DetailRow key={f.fieldKey} label={fieldKeyMap.get(f.fieldKey) ?? f.fieldKey} value={String(val)} />
                    })}
                    {unknownEntries.length > 0 && (
                      <div>
                        <div className="text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Other Metadata</div>
                        <pre className="text-xs font-mono text-nexus-300 bg-nexus-900/50 border border-nexus-700/30 rounded-lg p-3 overflow-x-auto">
                          {JSON.stringify(Object.fromEntries(unknownEntries), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── Embed / Integrate Modal ──────────────────────── */}
      {showEmbed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexus-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowEmbed(false)}>
          <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto card-surface p-6 relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEmbed(false)} className="absolute top-4 right-4 text-nexus-500 hover:text-nexus-200 transition-colors">
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-glow/15 to-violet-glow/15 border border-cyan-glow/10 flex items-center justify-center">
                <Code size={18} className="text-cyan-glow" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-nexus-50 tracking-wider">Integrate Your Waitlist</h2>
                <p className="text-xs text-nexus-500">Add signups from your website, app, or anywhere.</p>
              </div>
            </div>

            {/* Embed Widget */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <FileCode size={14} className="text-cyan-glow" />
                <h3 className="text-sm font-display font-bold text-nexus-200 tracking-wider">Embed Widget</h3>
              </div>
              <p className="text-xs text-nexus-500 mb-3">Drop this snippet into your HTML to show a signup form.</p>
              <SnippetBlock
                label="HTML"
                code={`<script src="${cdnUrl}/v1.js"></script>\n<div id="nexuswait" data-project-id="${id}"></div>`}
                copied={copiedSnippet}
                onCopy={setCopiedSnippet}
              />
            </div>

            {/* API Endpoint */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Terminal size={14} className="text-emerald-glow" />
                <h3 className="text-sm font-display font-bold text-nexus-200 tracking-wider">API Endpoint</h3>
              </div>
              <p className="text-xs text-nexus-500 mb-3">Submit signups from your own form using a simple POST request.</p>
              <SnippetBlock
                label="cURL"
                code={`curl -X POST ${apiUrl}/v1/projects/${id}/subscribers \\\n  -H "Content-Type: application/json" \\\n  -d '{"email": "user@example.com", "name": "Jane Doe"${projectCustomFields.length > 0 ? `,\n       "metadata": { ${projectCustomFields.slice(0, 2).map((f) => `"${f.fieldKey}": "..."` ).join(', ')} }` : ''}'`}
                copied={copiedSnippet}
                onCopy={setCopiedSnippet}
              />
            </div>

            {/* Fetch / JS */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-violet-glow" />
                <h3 className="text-sm font-display font-bold text-nexus-200 tracking-wider">JavaScript (fetch)</h3>
              </div>
              <p className="text-xs text-nexus-500 mb-3">Use this in your form&apos;s submit handler.</p>
              <SnippetBlock
                label="JavaScript"
                code={`const res = await fetch("${apiUrl}/v1/projects/${id}/subscribers", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    email: formData.email,\n    name: formData.name,   // optional\n    source: "website",     // optional${projectCustomFields.length > 0 ? `\n    metadata: {            // custom fields\n${projectCustomFields.slice(0, 3).map((f) => `      ${f.fieldKey}: "..."`).join(',\n')}\n    }` : ''}\n  }),\n});\nconst subscriber = await res.json();\nconsole.log("Position:", subscriber.position);`}
                copied={copiedSnippet}
                onCopy={setCopiedSnippet}
              />
            </div>

            {/* React example */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-magenta-glow" />
                <h3 className="text-sm font-display font-bold text-nexus-200 tracking-wider">React Example</h3>
              </div>
              <p className="text-xs text-nexus-500 mb-3">Quick copy-paste form component.</p>
              <SnippetBlock
                label="React"
                code={`async function handleSubmit(e) {\n  e.preventDefault();\n  const res = await fetch(\n    "${apiUrl}/v1/projects/${id}/subscribers",\n    {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify({ email, name }),\n    }\n  );\n  const data = await res.json();\n  alert(\`You're #\${data.position} on the waitlist!\`);\n}`}
                copied={copiedSnippet}
                onCopy={setCopiedSnippet}
              />
            </div>

            <div className="mt-5 pt-4 border-t border-nexus-700/30 flex items-center justify-between">
              <p className="text-[10px] text-nexus-600 font-mono">
                Signup endpoint is public — no API key required for <code className="text-nexus-500">POST</code> signups.
              </p>
              <Link to="/dashboard/api" onClick={() => setShowEmbed(false)} className="text-xs text-cyan-glow hover:underline font-display font-bold tracking-wider">
                Full API Docs →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Snippet Block Component ──────────────────────────── */
function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-0.5">{label}</div>
      <div className={`text-sm text-nexus-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
    </div>
  )
}

function SnippetBlock({
  label,
  code,
  copied,
  onCopy,
}: {
  label: string
  code: string
  copied: string | null
  onCopy: (id: string | null) => void
}) {
  const snippetId = `${label}-${code.slice(0, 20)}`
  const isCopied = copied === snippetId

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    onCopy(snippetId)
    setTimeout(() => onCopy(null), 2000)
  }

  return (
    <div className="rounded-xl bg-nexus-900/60 border border-nexus-700/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-nexus-700/20 bg-nexus-800/30">
        <span className="text-[10px] font-mono text-nexus-500 tracking-widest uppercase">{label}</span>
        <button type="button" onClick={handleCopy} className="flex items-center gap-1 text-[10px] font-mono text-nexus-500 hover:text-cyan-glow transition-colors">
          {isCopied ? <><Check size={10} className="text-emerald-glow" /> Copied!</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>
      <pre className="font-mono text-xs text-cyan-glow/70 p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">{code}</pre>
    </div>
  )
}
