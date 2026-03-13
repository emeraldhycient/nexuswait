import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Bell, LogOut, ChevronDown, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function UserAccountDropdown() {
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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

  const initials = user
    ? `${(user.firstName?.[0] ?? '').toUpperCase()}${(user.lastName?.[0] ?? '').toUpperCase()}` || user.email?.[0]?.toUpperCase() || '?'
    : '?'

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User'
    : 'User'

  const planLabel = user?.account?.plan ?? 'free'

  function handleNavigate(path: string) {
    setOpen(false)
    navigate(path)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-nexus-700/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-glow/30 to-violet-glow/30 border border-cyan-glow/20 flex items-center justify-center">
          <span className="text-[11px] font-display font-bold text-cyan-glow">{initials}</span>
        </div>
        <ChevronDown size={12} className={`text-nexus-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-[260px] bg-nexus-800 border border-cyan-glow/10 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-fade-in"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-cyan-glow/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-glow/30 to-violet-glow/30 border border-cyan-glow/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-display font-bold text-cyan-glow">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-nexus-100 truncate">{displayName}</p>
                <p className="text-[11px] text-nexus-500 font-mono truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                planLabel === 'pro' ? 'bg-violet-glow/10 text-violet-glow'
                : planLabel === 'enterprise' ? 'bg-amber-glow/10 text-amber-glow'
                : 'bg-nexus-600/20 text-nexus-500'
              }`}>
                {planLabel}
              </span>
              {isAdmin && (
                <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-magenta-glow/10 text-magenta-glow">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => handleNavigate('/dashboard/settings')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-nexus-300 hover:text-nexus-100 hover:bg-nexus-700/30 transition-colors"
            >
              <Settings size={15} />
              <span className="text-sm">Account Settings</span>
            </button>
            <button
              onClick={() => handleNavigate('/dashboard/notification-preferences')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-nexus-300 hover:text-nexus-100 hover:bg-nexus-700/30 transition-colors"
            >
              <Bell size={15} />
              <span className="text-sm">Notification Preferences</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => handleNavigate('/admin')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-nexus-300 hover:text-magenta-glow hover:bg-magenta-glow/[0.05] transition-colors"
              >
                <Shield size={15} />
                <span className="text-sm">Admin Panel</span>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-cyan-glow/[0.06] py-1">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-nexus-400 hover:text-magenta-glow hover:bg-magenta-glow/[0.05] transition-colors"
            >
              <LogOut size={15} />
              <span className="text-sm">Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
