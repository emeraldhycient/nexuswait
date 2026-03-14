import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FileText, ArrowDownCircle, ArrowUpCircle, RefreshCw, Loader2,
  CheckCircle, XCircle, Clock, AlertTriangle,
} from 'lucide-react'
import {
  useAdminDeliveryLogs,
  useAdminRetriggerDelivery,
  useAdminWebhookEvents,
  useAdminFailedIntegrations,
} from '../../api/hooks'
import type { DeliveryLog, WebhookEvent } from '../../api/hooks'
import SortableHeader from '../../components/SortableHeader'
import PaginationFooter from '../../components/PaginationFooter'
import { useSortState } from '../../hooks/useSortState'

type Tab = 'outgoing' | 'incoming'

export default function AdminWebhookLogs() {
  const [searchParams] = useSearchParams()
  const presetIntegrationId = searchParams.get('integrationId') ?? ''
  const [tab, setTab] = useState<Tab>('outgoing')
  const [integrationId, setIntegrationId] = useState(presetIntegrationId)
  const [outPage, setOutPage] = useState(1)
  const [inPage, setInPage] = useState(1)
  const { sortBy: outSortBy, sortOrder: outSortOrder, handleSort: handleOutSort } = useSortState()
  const { sortBy: inSortBy, sortOrder: inSortOrder, handleSort: handleInSort } = useSortState()

  useEffect(() => { setOutPage(1) }, [outSortBy, outSortOrder])
  useEffect(() => { setInPage(1) }, [inSortBy, inSortOrder])

  // Outgoing
  const { data: logsData, isLoading: logsLoading } = useAdminDeliveryLogs(
    integrationId || undefined,
    outPage,
    25,
    outSortBy,
    outSortOrder,
  )
  const retrigger = useAdminRetriggerDelivery()

  // Incoming
  const { data: eventsData, isLoading: eventsLoading } = useAdminWebhookEvents(inPage, 25, inSortBy, inSortOrder)

  // Failed integrations for quick selector
  const { data: failedData } = useAdminFailedIntegrations()
  const failedIntegrations = (failedData as { id: string; displayName: string }[]) ?? []

  const deliveryLogs: DeliveryLog[] = logsData?.data ?? []
  const logsTotal = logsData?.total ?? 0
  const events: WebhookEvent[] = eventsData?.data ?? []
  const eventsTotal = eventsData?.total ?? 0
  const outLimit = 25
  const inLimit = 25
  const outTotalPages = Math.max(1, Math.ceil(logsTotal / outLimit))
  const inTotalPages = Math.max(1, Math.ceil(eventsTotal / inLimit))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Webhook Logs</h1>
        <p className="text-sm text-nexus-400 mt-1">Audit outgoing webhook deliveries and incoming Polar events.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-nexus-800/40 border border-nexus-700/20 w-fit">
        <button
          type="button"
          onClick={() => setTab('outgoing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'outgoing' ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-nexus-400 hover:text-nexus-200'
          }`}
        >
          <ArrowUpCircle size={14} /> Outgoing Deliveries
        </button>
        <button
          type="button"
          onClick={() => setTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'incoming' ? 'bg-violet-glow/10 text-violet-glow' : 'text-nexus-400 hover:text-nexus-200'
          }`}
        >
          <ArrowDownCircle size={14} /> Incoming Polar Events
        </button>
      </div>

      {/* ─── Outgoing Tab ─────────────────────── */}
      {tab === 'outgoing' && (
        <div className="space-y-4">
          {/* Integration filter */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-mono text-nexus-500 tracking-wider uppercase shrink-0">Integration ID</label>
            <input
              type="text"
              placeholder="Enter integration ID to filter..."
              value={integrationId}
              onChange={e => { setIntegrationId(e.target.value); setOutPage(1) }}
              className="input-field font-mono flex-1 max-w-lg"
            />
            {failedIntegrations.length > 0 && (
              <select
                value={integrationId}
                onChange={e => { setIntegrationId(e.target.value); setOutPage(1) }}
                className="input-field max-w-[260px]"
              >
                <option value="">Quick select...</option>
                {failedIntegrations.map(fi => (
                  <option key={fi.id} value={fi.id}>{fi.displayName}</option>
                ))}
              </select>
            )}
          </div>

          {!integrationId ? (
            <div className="card-surface p-8 text-center text-nexus-500 text-sm">
              <FileText size={32} className="mx-auto mb-3 text-nexus-600" />
              Enter an integration ID above to view delivery logs.
            </div>
          ) : logsLoading ? (
            <div className="card-surface p-8 flex justify-center">
              <Loader2 size={20} className="animate-spin text-nexus-500" />
            </div>
          ) : deliveryLogs.length === 0 ? (
            <div className="card-surface p-8 text-center text-nexus-500 text-sm">No delivery logs found for this integration.</div>
          ) : (
            <>
              <div className="card-surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-nexus-700/20">
                        <SortableHeader label="Event" sortKey="event" currentSortBy={outSortBy} currentSortOrder={outSortOrder} onSort={handleOutSort} />
                        <SortableHeader label="Status" sortKey="success" currentSortBy={outSortBy} currentSortOrder={outSortOrder} onSort={handleOutSort} />
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Response</th>
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Duration</th>
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Error</th>
                        <SortableHeader label="Time" sortKey="createdAt" currentSortBy={outSortBy} currentSortOrder={outSortOrder} onSort={handleOutSort} />
                        <th className="text-right px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryLogs.map(log => (
                        <tr key={log.id} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-glow/10 text-cyan-glow">
                              {log.event}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {log.success ? (
                              <CheckCircle size={14} className="text-emerald-glow" />
                            ) : (
                              <XCircle size={14} className="text-magenta-glow" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-nexus-300">
                            {log.responseStatus ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-nexus-400">
                            {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-magenta-glow/80 truncate max-w-[200px]" title={log.error ?? undefined}>
                            {log.error ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-nexus-500 font-mono whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!log.success && (
                              <button
                                type="button"
                                onClick={() => retrigger.mutate(log.id)}
                                disabled={retrigger.isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20 rounded-lg transition-colors disabled:opacity-40"
                              >
                                {retrigger.isPending ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                                Retrigger
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <PaginationFooter page={outPage} totalPages={outTotalPages} total={logsTotal} onPageChange={setOutPage} />
            </>
          )}
        </div>
      )}

      {/* ─── Incoming Tab ─────────────────────── */}
      {tab === 'incoming' && (
        <div className="space-y-4">
          {eventsLoading ? (
            <div className="card-surface p-8 flex justify-center">
              <Loader2 size={20} className="animate-spin text-nexus-500" />
            </div>
          ) : events.length === 0 ? (
            <div className="card-surface p-8 text-center text-nexus-500 text-sm">No incoming webhook events recorded yet.</div>
          ) : (
            <>
              <div className="card-surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-nexus-700/20">
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Event ID</th>
                        <SortableHeader label="Type" sortKey="eventType" currentSortBy={inSortBy} currentSortOrder={inSortOrder} onSort={handleInSort} />
                        <SortableHeader label="Status" sortKey="status" currentSortBy={inSortBy} currentSortOrder={inSortOrder} onSort={handleInSort} />
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Error</th>
                        <SortableHeader label="Processed At" sortKey="createdAt" currentSortBy={inSortBy} currentSortOrder={inSortOrder} onSort={handleInSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(evt => (
                        <tr key={evt.id} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-nexus-300 truncate max-w-[180px]" title={evt.eventId}>
                            {evt.eventId}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-violet-glow/10 text-violet-glow">
                              {evt.eventType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {evt.status === 'processed' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-glow">
                                <CheckCircle size={12} /> Processed
                              </span>
                            ) : evt.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-magenta-glow">
                                <AlertTriangle size={12} /> Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-nexus-500">
                                <Clock size={12} /> {evt.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-magenta-glow/80 truncate max-w-[200px]" title={evt.error ?? undefined}>
                            {evt.error ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-nexus-500 font-mono whitespace-nowrap">
                            {new Date(evt.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <PaginationFooter page={inPage} totalPages={inTotalPages} total={eventsTotal} onPageChange={setInPage} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
