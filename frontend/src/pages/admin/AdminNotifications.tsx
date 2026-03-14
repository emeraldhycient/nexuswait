import { useState } from 'react'
import {
  Bell, Clock, XCircle, Skull, FileText, Plus, ChevronDown, ChevronUp,
  Trash2, Mail, Loader2,
} from 'lucide-react'
import {
  useAdminNotificationQueue,
  useAdminNotificationTemplates,
  useCreateNotificationTemplate,
  useDeleteNotificationTemplate,
  useAdminFailedNotifications,
  type NotificationTemplate,
} from '../../api/hooks'
import PaginationFooter from '../../components/PaginationFooter'

export default function AdminNotifications() {
  const { data: queueData, isLoading: queueLoading, error: queueError } = useAdminNotificationQueue()
  const { data: templatesData, isLoading: templatesLoading } = useAdminNotificationTemplates()
  const createTemplate = useCreateNotificationTemplate()
  const deleteTemplate = useDeleteNotificationTemplate()

  const [showCreate, setShowCreate] = useState(false)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', channel: 'email', subject: '', body: '' })

  // Paginated failed notifications
  const [failedPage, setFailedPage] = useState(1)
  const failedLimit = 20
  const { data: failedData, isLoading: failedLoading } = useAdminFailedNotifications({ page: failedPage, limit: failedLimit })
  const failedNotifications: Record<string, unknown>[] = (failedData as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
  const failedTotal: number = ((failedData as Record<string, unknown>)?.total as number) ?? 0
  const failedTotalPages = Math.max(1, Math.ceil(failedTotal / failedLimit))

  if (queueLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (queueError) return <div className="p-6 text-magenta-glow">Failed to load notification data.</div>

  const queue = queueData as Record<string, unknown> | undefined

  // Queue data uses the shape from getNotificationQueue()
  const pending = (queue?.pending as number) ?? 0
  const sent = (queue?.sent as number) ?? 0
  const failed = (queue?.failed as number) ?? 0
  const deadLetter = (queue?.deadLetter as number) ?? 0

  const templates: (NotificationTemplate & { _count?: { notifications: number } })[] =
    (templatesData as (NotificationTemplate & { _count?: { notifications: number } })[]) ?? []

  const statusCards: { label: string; value: number; icon: typeof Clock; color: string }[] = [
    { label: 'Pending', value: pending, icon: Clock, color: 'text-cyan-glow bg-cyan-glow/10' },
    { label: 'Sent', value: sent, icon: Mail, color: 'text-emerald-glow bg-emerald-glow/10' },
    { label: 'Failed', value: failed, icon: XCircle, color: 'text-magenta-glow bg-magenta-glow/10' },
    { label: 'Dead Letter', value: deadLetter, icon: Skull, color: 'text-amber-glow bg-amber-glow/10' },
  ]

  function handleCreateTemplate() {
    if (!form.name.trim() || !form.body.trim()) return
    createTemplate.mutate(
      { name: form.name, channel: form.channel, subject: form.subject || undefined, body: form.body },
      {
        onSuccess: () => {
          setForm({ name: '', channel: 'email', subject: '', body: '' })
          setShowCreate(false)
        },
      },
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Notifications</h1>
        <p className="text-sm text-nexus-400 mt-1">Queue status, templates, and email management.</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="card-surface p-5 animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon size={15} />
                </div>
              </div>
              <div className="font-display text-2xl font-black text-nexus-50">{card.value.toLocaleString()}</div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mt-1">{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Notification Templates */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-violet-glow" />
            <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">
              Notification Templates
            </h2>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-glow hover:text-cyan-glow/80 transition-colors"
          >
            <Plus size={14} /> New Template
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="px-6 pb-4 border-b border-cyan-glow/[0.06]">
            <div className="bg-nexus-700/20 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Welcome Email"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">
                    Channel
                  </label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="email">Email</option>
                    <option value="in_app">In-App</option>
                    <option value="slack">Slack</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
              </div>
              {form.channel === 'email' && (
                <div>
                  <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="input-field text-sm"
                    placeholder="You're on the waitlist!"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">
                  Body
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={4}
                  className="input-field text-sm resize-none font-mono"
                  placeholder="Hello {{name}}, you've been added to the waitlist..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-xs font-mono text-nexus-400 hover:text-nexus-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={createTemplate.isPending || !form.name.trim() || !form.body.trim()}
                  className="px-4 py-1.5 text-xs font-mono font-bold bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20 rounded-lg transition-colors disabled:opacity-40"
                >
                  {createTemplate.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates list */}
        {templatesLoading ? (
          <div className="px-6 pb-5 flex justify-center py-8">
            <Loader2 size={18} className="animate-spin text-nexus-500" />
          </div>
        ) : templates.length === 0 ? (
          <div className="px-6 pb-5 text-sm text-nexus-500">No notification templates configured.</div>
        ) : (
          <div>
            {templates.map((tpl) => (
              <div key={tpl.id} className="border-b border-cyan-glow/[0.04] last:border-none">
                <button
                  onClick={() => setExpandedTemplate(expandedTemplate === tpl.id ? null : tpl.id)}
                  className="w-full flex items-center gap-3 px-6 py-3 hover:bg-nexus-700/20 transition-colors text-left"
                >
                  <Mail size={14} className="text-violet-glow flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-nexus-200">{tpl.name}</span>
                    <span className="ml-2 text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-glow/10 text-cyan-glow">
                      {tpl.channel}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-nexus-500 flex-shrink-0">
                    {(tpl as unknown as Record<string, unknown>)._count
                      ? `${((tpl as unknown as Record<string, unknown>)._count as Record<string, number>).notifications ?? 0} sent`
                      : '0 sent'}
                  </span>
                  {expandedTemplate === tpl.id ? (
                    <ChevronUp size={14} className="text-nexus-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-nexus-500 flex-shrink-0" />
                  )}
                </button>
                {expandedTemplate === tpl.id && (
                  <div className="px-6 pb-4 animate-fade-in">
                    <div className="bg-nexus-700/20 rounded-lg p-4 space-y-2">
                      {tpl.subject && (
                        <div>
                          <span className="text-[10px] font-mono text-nexus-500 tracking-wider uppercase">Subject: </span>
                          <span className="text-sm text-nexus-300">{tpl.subject}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono text-nexus-500 tracking-wider uppercase block mb-1">Body:</span>
                        <pre className="text-xs text-nexus-400 font-mono bg-nexus-800/50 rounded p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {tpl.body}
                        </pre>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-mono text-nexus-600">
                          Created {new Date(tpl.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => deleteTemplate.mutate(tpl.id)}
                          className="flex items-center gap-1 text-[10px] font-mono text-magenta-glow hover:text-magenta-glow/80 transition-colors"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Failed Notifications Table */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center gap-2">
          <Bell size={15} className="text-magenta-glow" />
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">
            Failed Notifications
          </h2>
          {failedTotal > 0 && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-magenta-glow/10 text-magenta-glow">
              {failedTotal}
            </span>
          )}
        </div>
        {failedLoading ? (
          <div className="px-6 pb-5 flex justify-center py-8">
            <Loader2 size={18} className="animate-spin text-nexus-500" />
          </div>
        ) : failedNotifications.length === 0 ? (
          <div className="px-6 pb-5 text-sm text-nexus-500">No failed notifications. Queue is healthy.</div>
        ) : (
          <div className="space-y-4 pb-5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-magenta-glow/[0.06]">
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Template</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Recipient</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Error</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Attempts</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {failedNotifications.map((failure, i) => (
                    <tr key={(failure.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[150px]">
                        {(failure.templateId as string) ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-nexus-200 font-mono truncate max-w-[200px]">
                        {(failure.recipient as string) ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          (failure.status as string) === 'dead_letter'
                            ? 'bg-amber-glow/10 text-amber-glow'
                            : 'bg-magenta-glow/10 text-magenta-glow'
                        }`}>
                          {(failure.status as string) ?? 'failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-magenta-glow font-mono truncate max-w-[200px]">
                        {(failure.lastError as string) ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-nexus-300 font-mono">{(failure.attempts as number) ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-nexus-500 font-mono">
                        {failure.createdAt ? new Date(failure.createdAt as string).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationFooter page={failedPage} totalPages={failedTotalPages} total={failedTotal} onPageChange={setFailedPage} className="px-6" />
          </div>
        )}
      </div>
    </div>
  )
}
