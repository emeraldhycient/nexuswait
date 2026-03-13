import { useState } from 'react'
import {
  Bell, Mail, MessageCircle, Webhook, Save, Loader2, Plus, Trash2,
  CheckCircle, ChevronDown, ChevronUp, Settings,
} from 'lucide-react'
import {
  useNotificationPreferences,
  useUpsertNotificationPreference,
  useNotificationTemplates,
  useCreateNotificationTemplate,
  useDeleteNotificationTemplate,
} from '../api/hooks'
import type { NotificationPreference, NotificationTemplate } from '../api/hooks'

const CHANNELS = [
  { id: 'in_app', label: 'In-App', icon: Bell, color: 'text-cyan-glow' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-amber-glow' },
  { id: 'slack', label: 'Slack', icon: MessageCircle, color: 'text-violet-glow' },
  { id: 'webhook', label: 'Webhook', icon: Webhook, color: 'text-emerald-glow' },
]

export default function NotificationPreferences() {
  const { data: preferences, isLoading: loadingPrefs } = useNotificationPreferences()
  const upsertPref = useUpsertNotificationPreference()

  const { data: templates, isLoading: loadingTemplates } = useNotificationTemplates()
  const createTemplate = useCreateNotificationTemplate()
  const deleteTemplate = useDeleteNotificationTemplate()

  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [newTemplate, setNewTemplate] = useState({ name: '', channel: 'email', subject: '', body: '' })

  function toggleChannel(pref: NotificationPreference, channelId: string) {
    const channels = pref.channels.includes(channelId)
      ? pref.channels.filter((c) => c !== channelId)
      : [...pref.channels, channelId]
    upsertPref.mutate({ event: pref.event, channels, enabled: pref.enabled })
  }

  function toggleEnabled(pref: NotificationPreference) {
    upsertPref.mutate({ event: pref.event, channels: pref.channels, enabled: !pref.enabled })
  }

  function handleCreateTemplate() {
    if (!newTemplate.name || !newTemplate.body) return
    createTemplate.mutate(
      {
        name: newTemplate.name,
        channel: newTemplate.channel,
        subject: newTemplate.subject || undefined,
        body: newTemplate.body,
      },
      {
        onSuccess: () => {
          setNewTemplate({ name: '', channel: 'email', subject: '', body: '' })
          setShowTemplateForm(false)
        },
      },
    )
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

      {/* Templates Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-wider uppercase">
            Notification Templates
          </h2>
          <button
            onClick={() => setShowTemplateForm(!showTemplateForm)}
            className="flex items-center gap-1.5 text-xs font-display font-bold tracking-wider text-cyan-glow hover:text-cyan-glow/80 transition-colors"
          >
            <Plus size={14} /> New Template
          </button>
        </div>

        {/* Create form */}
        {showTemplateForm && (
          <div className="card-surface p-5 mb-4 animate-slide-up">
            <h3 className="text-sm font-bold text-nexus-200 mb-3">Create Template</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-mono text-nexus-500 uppercase">Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g. Welcome Email"
                  className="input-field mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-nexus-500 uppercase">Channel</label>
                <select
                  value={newTemplate.channel}
                  onChange={(e) => setNewTemplate({ ...newTemplate, channel: e.target.value })}
                  className="input-field mt-1 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="in_app">In-App</option>
                  <option value="slack">Slack</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
            </div>
            {newTemplate.channel === 'email' && (
              <div className="mb-3">
                <label className="text-[10px] font-mono text-nexus-500 uppercase">Subject</label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="Email subject line"
                  className="input-field mt-1 text-sm"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="text-[10px] font-mono text-nexus-500 uppercase">
                Body <span className="text-nexus-600">(use {'{{key}}'} for variables)</span>
              </label>
              <textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                placeholder="Hello {{name}}, thanks for joining our waitlist!"
                rows={4}
                className="input-field mt-1 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateTemplate}
                disabled={createTemplate.isPending || !newTemplate.name || !newTemplate.body}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                {createTemplate.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save Template
              </button>
              <button
                onClick={() => setShowTemplateForm(false)}
                className="text-xs text-nexus-500 hover:text-nexus-300 px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Template List */}
        {loadingTemplates ? (
          <div className="flex items-center gap-2 text-nexus-500 py-8 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading templates...
          </div>
        ) : (templates ?? []).length === 0 ? (
          <div className="card-surface p-8 text-center">
            <Mail size={28} className="mx-auto text-nexus-600 mb-2" />
            <p className="text-sm text-nexus-500">No templates yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(templates ?? []).map((tpl) => {
              const expanded = expandedTemplate === tpl.id
              return (
                <div key={tpl.id} className="card-surface overflow-hidden">
                  <button
                    onClick={() => setExpandedTemplate(expanded ? null : tpl.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20 flex items-center justify-center">
                        {tpl.channel === 'email' ? <Mail size={14} className="text-cyan-glow" /> : <Bell size={14} className="text-cyan-glow" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-nexus-100">{tpl.name}</p>
                        <p className="text-[10px] font-mono text-nexus-600">{tpl.channel}{tpl.subject ? ` — ${tpl.subject}` : ''}</p>
                      </div>
                    </div>
                    {expanded ? <ChevronUp size={14} className="text-nexus-500" /> : <ChevronDown size={14} className="text-nexus-500" />}
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4 animate-slide-up">
                      <div className="bg-nexus-900/50 rounded-lg p-3 mb-3">
                        <pre className="text-xs text-nexus-400 whitespace-pre-wrap font-mono">{tpl.body}</pre>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-nexus-600">
                          Created {new Date(tpl.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => deleteTemplate.mutate(tpl.id, {
                            onSuccess: () => setExpandedTemplate(null),
                          })}
                          className="flex items-center gap-1 text-[10px] font-mono text-magenta-glow hover:text-magenta-glow/80 transition-colors"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
