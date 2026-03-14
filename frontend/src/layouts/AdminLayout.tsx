import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, FolderOpen, UserPlus, Plug, Bell, Server,
  LogOut, ChevronLeft, ChevronRight, Search, User, ArrowLeft,
  CreditCard, FileText,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

const sidebarItems: { to: string; icon: LucideIcon; label: string }[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/accounts', icon: Users, label: 'Accounts' },
  { to: '/admin/users', icon: User, label: 'Users' },
  { to: '/admin/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/admin/subscribers', icon: UserPlus, label: 'Subscribers' },
  { to: '/admin/integrations', icon: Plug, label: 'Integrations' },
  { to: '/admin/plans', icon: CreditCard, label: 'Plans' },
  { to: '/admin/webhook-logs', icon: FileText, label: 'Webhook Logs' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/system', icon: Server, label: 'System' },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { token, loading, isAdmin, logout } = useAuth()

  useEffect(() => {
    if (!loading && !token) navigate('/login')
  }, [loading, token, navigate])

  useEffect(() => {
    if (!loading && token && !isAdmin) navigate('/dashboard')
  }, [loading, token, isAdmin, navigate])

  // Show spinner while auth state is resolving OR while waiting for redirect
  if (loading || !token || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nexus-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-magenta-glow/30 border-t-magenta-glow rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-nexus-500 font-mono">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-nexus-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-cyan-glow focus:text-nexus-900 focus:rounded-lg focus:font-display focus:font-bold"
      >
        Skip to content
      </a>
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col border-r border-magenta-glow/[0.06] bg-nexus-800/60 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}>
        <div className={`h-16 flex items-center border-b border-magenta-glow/[0.06] ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-magenta-glow to-violet-glow flex items-center justify-center">
              <span className="font-display font-black text-nexus-900 text-xs">A</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Logo size="small" />
              <span className="text-[9px] font-mono font-bold tracking-widest bg-magenta-glow/15 text-magenta-glow px-1.5 py-0.5 rounded">ADMIN</span>
            </div>
          )}
        </div>

        <nav aria-label="Admin navigation" className="flex-1 py-4 px-2 space-y-1">
          {sidebarItems.map(item => {
            const active = item.to === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 no-underline rounded-lg transition-all duration-200 ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                } ${
                  active
                    ? 'bg-magenta-glow/[0.08] text-magenta-glow'
                    : 'text-nexus-400 hover:text-nexus-100 hover:bg-nexus-700/40'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                {!collapsed && (
                  <span className="text-sm font-semibold">{item.label}</span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-magenta-glow" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-magenta-glow/[0.06]">
          <Link
            to="/dashboard"
            className={`w-full flex items-center gap-3 no-underline py-2.5 rounded-lg text-nexus-400 hover:text-cyan-glow hover:bg-cyan-glow/[0.05] transition-all ${collapsed ? 'justify-center px-2' : 'px-3'}`}
            title={collapsed ? 'Back to Dashboard' : undefined}
          >
            <ArrowLeft size={18} />
            {!collapsed && <span className="text-sm font-semibold">Back to Dashboard</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 mt-1 text-nexus-500 hover:text-nexus-200 transition-colors rounded-lg hover:bg-nexus-700/30"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span className="text-xs font-mono">Collapse</span>}
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className={`w-full flex items-center gap-3 mt-1 py-2.5 rounded-lg text-nexus-500 hover:text-magenta-glow hover:bg-magenta-glow/[0.05] transition-all ${collapsed ? 'justify-center px-2' : 'px-3'}`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm font-semibold">Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[240px]'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-magenta-glow/[0.06] bg-nexus-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search size={16} className="text-nexus-500" />
            <input
              type="text"
              aria-label="Search accounts and projects"
              placeholder="Search accounts, projects..."
              className="bg-transparent border-none outline-none text-sm text-nexus-200 placeholder:text-nexus-500 flex-1"
            />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle compact />
            <button aria-label="Notifications" className="relative p-2 text-nexus-400 hover:text-nexus-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-magenta-glow rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-magenta-glow/30 to-violet-glow/30 border border-magenta-glow/20 flex items-center justify-center">
              <User size={14} className="text-magenta-glow" />
            </div>
          </div>
        </header>

        <main id="main-content" className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
