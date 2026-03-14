import { useState } from 'react'
import { Database, Layers, Clock, Globe, Save, Loader2 } from 'lucide-react'
import {
  useAdminSystemHealth,
  useAdminPlatformConfig,
  useUpdatePlatformConfig,
  getMutationErrorMessage,
} from '../../api/hooks'

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default function AdminSystem() {
  const { data, isLoading, error } = useAdminSystemHealth()
  const { data: configData } = useAdminPlatformConfig()
  const updateConfig = useUpdatePlatformConfig()

  // ─── Platform Settings form state ─────────────────────
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [cdnBaseUrl, setCdnBaseUrl] = useState('')
  const [configLoaded, setConfigLoaded] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  if (configData && !configLoaded) {
    setApiBaseUrl(configData.apiBaseUrl ?? '')
    setCdnBaseUrl(configData.cdnBaseUrl ?? '')
    setConfigLoaded(true)
  }

  const saveConfig = () => {
    updateConfig.mutate(
      { apiBaseUrl, cdnBaseUrl },
      {
        onSuccess: () => {
          setConfigSaved(true)
          setTimeout(() => setConfigSaved(false), 2000)
        },
      },
    )
  }

  if (isLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (error) return <div className="p-6 text-magenta-glow">Failed to load system health.</div>

  const system = data as Record<string, unknown> | undefined
  const dbLatencyMs = (system?.dbLatencyMs as number) ?? 0
  const notificationQueueDepth = (system?.notificationQueueDepth as number) ?? 0
  const uptimeSeconds = (system?.uptimeSeconds as number) ?? 0

  const dbHealthy = dbLatencyMs < 100
  const dbWarning = dbLatencyMs >= 100 && dbLatencyMs < 500

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">System Health</h1>
        <p className="text-sm text-nexus-400 mt-1">Infrastructure and service health status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* DB Latency */}
        <div className="card-surface p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-glow/10 text-cyan-glow">
              <Database size={15} />
            </div>
            <span className={`w-2 h-2 rounded-full ${dbHealthy ? 'bg-emerald-glow' : dbWarning ? 'bg-amber-glow' : 'bg-magenta-glow'}`} />
          </div>
          <div className={`font-display text-2xl font-black ${dbHealthy ? 'text-emerald-glow' : dbWarning ? 'text-amber-glow' : 'text-magenta-glow'}`}>
            {dbLatencyMs.toFixed(0)}ms
          </div>
          <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mt-1">DB Latency</div>
          <div className="mt-3 h-1.5 bg-nexus-700/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${dbHealthy ? 'bg-emerald-glow/60' : dbWarning ? 'bg-amber-glow/60' : 'bg-magenta-glow/60'}`}
              style={{ width: `${Math.min(100, (dbLatencyMs / 500) * 100)}%` }}
            />
          </div>
        </div>

        {/* Queue Depth */}
        <div className="card-surface p-5 animate-slide-up" style={{ animationDelay: '0.06s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-glow/10 text-violet-glow">
              <Layers size={15} />
            </div>
            <span className={`w-2 h-2 rounded-full ${notificationQueueDepth < 100 ? 'bg-emerald-glow' : notificationQueueDepth < 1000 ? 'bg-amber-glow' : 'bg-magenta-glow'}`} />
          </div>
          <div className="font-display text-2xl font-black text-nexus-50">{notificationQueueDepth.toLocaleString()}</div>
          <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mt-1">Queue Depth</div>
          <div className="mt-3 h-1.5 bg-nexus-700/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${notificationQueueDepth < 100 ? 'bg-emerald-glow/60' : notificationQueueDepth < 1000 ? 'bg-amber-glow/60' : 'bg-magenta-glow/60'}`}
              style={{ width: `${Math.min(100, (notificationQueueDepth / 1000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Uptime */}
        <div className="card-surface p-5 animate-slide-up" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-glow/10 text-emerald-glow">
              <Clock size={15} />
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-glow" />
          </div>
          <div className="font-display text-2xl font-black text-emerald-glow">{formatUptime(uptimeSeconds)}</div>
          <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mt-1">Uptime</div>
          <div className="mt-3 text-xs font-mono text-nexus-600">
            {Math.floor(uptimeSeconds / 3600).toLocaleString()} hours total
          </div>
        </div>
      </div>

      {/* Platform Settings */}
      <div className="card-surface p-6 animate-slide-up" style={{ animationDelay: '0.18s' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-glow/10 text-cyan-glow">
            <Globe size={15} />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Platform Settings</h2>
            <p className="text-xs text-nexus-500 mt-0.5">Configure base URLs shown in embed snippets and API docs.</p>
          </div>
        </div>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">API Base URL</label>
            <input
              type="url"
              value={apiBaseUrl}
              onChange={e => setApiBaseUrl(e.target.value)}
              className="input-field"
              placeholder="https://api.nexuswait.com"
            />
            <p className="text-[10px] text-nexus-600 mt-1">Used in cURL examples, fetch snippets, and API documentation.</p>
          </div>
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">CDN Base URL</label>
            <input
              type="url"
              value={cdnBaseUrl}
              onChange={e => setCdnBaseUrl(e.target.value)}
              className="input-field"
              placeholder="https://cdn.nexuswait.com"
            />
            <p className="text-[10px] text-nexus-600 mt-1">Used in the embed widget script tag.</p>
          </div>
          {updateConfig.isError && (
            <p className="text-magenta-glow text-xs">{getMutationErrorMessage(updateConfig.error)}</p>
          )}
          <button
            type="button"
            onClick={saveConfig}
            disabled={updateConfig.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {updateConfig.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {configSaved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
