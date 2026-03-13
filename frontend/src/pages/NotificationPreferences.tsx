import {
  Bell, Mail, MessageCircle, Webhook, Loader2,
  CheckCircle, Settings,
} from 'lucide-react'
import {
  useNotificationPreferences,
  useUpsertNotificationPreference,
} from '../api/hooks'
import type { NotificationPreference } from '../api/hooks'

const CHANNELS = [
  { id: 'in_app', label: 'In-App', icon: Bell, color: 'text-cyan-glow' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-amber-glow' },
  { id: 'slack', label: 'Slack', icon: MessageCircle, color: 'text-violet-glow' },
  { id: 'webhook', label: 'Webhook', icon: Webhook, color: 'text-emerald-glow' },
]

export default function NotificationPreferences() {
  const { data: preferences, isLoading: loadingPrefs } = useNotificationPreferences()
  const upsertPref = useUpsertNotificationPreference()

  function toggleChannel(pref: NotificationPreference, channelId: string) {
    const channels = pref.channels.includes(channelId)
      ? pref.channels.filter((c) => c !== channelId)
      : [...pref.channels, channelId]
    upsertPref.mutate({ event: pref.event, channels, enabled: pref.enabled })
  }

  function toggleEnabled(pref: NotificationPreference) {
    upsertPref.mutate({ event: pref.event, channels: pref.channels, enabled: !pref.enabled })
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider flex items-center gap-3">
          <Settings size={22} className="text-cyan-glow" />
          Notification Settings
        </h1>
        <p className="text-sm text-nexus-400 mt-1">
          Control when and how you receive notifications.
        </p>
      </div>

      {/* Preferences Section */}
      <section className="mb-10">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-wider mb-4 uppercase">
          Event Preferences
        </h2>
        {loadingPrefs ? (
          <div className="flex items-center gap-2 text-nexus-500 py-8 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading preferences...
          </div>
        ) : (
          <div className="space-y-3">
            {(preferences ?? []).map((pref) => (
              <div key={pref.event} className="card-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.enabled}
                        onChange={() => toggleEnabled(pref)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-nexus-700 rounded-full peer peer-checked:bg-cyan-glow/30 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-nexus-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-cyan-glow" />
                    </label>
                    <div>
                      <p className="text-sm font-semibold text-nexus-100">{pref.label}</p>
                      <p className="text-[10px] font-mono text-nexus-600">{pref.event}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {CHANNELS.map((ch) => {
                    const active = pref.channels.includes(ch.id)
                    const Icon = ch.icon
                    return (
                      <button
                        key={ch.id}
                        onClick={() => toggleChannel(pref, ch.id)}
                        disabled={!pref.enabled}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider border transition-all ${
                          active
                            ? `bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20`
                            : 'text-nexus-500 border-nexus-700/30 hover:border-nexus-600/50'
                        } ${!pref.enabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <Icon size={12} />
                        {ch.label}
                        {active && <CheckCircle size={10} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
