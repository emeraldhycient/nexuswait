import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, X, Info, AlertTriangle, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import {
  useNotificationInbox,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../api/hooks'
import type { InAppNotification } from '../api/hooks'

const typeConfig: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: 'text-cyan-glow' },
  success: { icon: Sparkles, color: 'text-emerald-glow' },
  warning: { icon: AlertTriangle, color: 'text-amber-glow' },
  error: { icon: AlertCircle, color: 'text-magenta-glow' },
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { data: inbox, isLoading } = useNotificationInbox()
  const { data: unreadData } = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotif = useDeleteNotification()

  const unreadCount = unreadData?.count ?? 0
  const notifications = inbox ?? []

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleNotificationClick(n: InAppNotification) {
    if (!n.readAt) markRead.mutate(n.id)
    if (n.actionUrl) {
      setOpen(false)
      navigate(n.actionUrl)
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 text-nexus-400 hover:text-nexus-100 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-mono font-bold bg-magenta-glow text-white rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] flex flex-col bg-nexus-800 border border-cyan-glow/10 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-glow/[0.06]">
            <h3 className="font-display text-sm font-bold text-nexus-100 tracking-wider">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-[10px] font-mono text-cyan-glow hover:text-cyan-glow/80 transition-colors"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/dashboard/notification-preferences')
                }}
                className="text-[10px] font-mono text-nexus-500 hover:text-nexus-300 transition-colors"
              >
                Settings
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-nexus-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-nexus-500">
                <Bell size={28} className="mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = typeConfig[n.type] ?? typeConfig.info
                const Icon = cfg.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group flex gap-3 px-4 py-3 border-b border-cyan-glow/[0.04] cursor-pointer transition-colors hover:bg-nexus-700/30 ${
                      !n.readAt ? 'bg-cyan-glow/[0.03]' : ''
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold truncate ${!n.readAt ? 'text-nexus-100' : 'text-nexus-400'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] font-mono text-nexus-600 flex-shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-nexus-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!n.readAt && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id) }}
                          className="p-1 text-nexus-500 hover:text-cyan-glow rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id) }}
                        className="p-1 text-nexus-500 hover:text-magenta-glow rounded transition-colors"
                        title="Dismiss"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-cyan-glow/[0.06] text-center">
              <span className="text-[10px] font-mono text-nexus-600">
                Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
