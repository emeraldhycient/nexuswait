import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, FolderPlus, Plug, Settings, LogOut, ChevronLeft,
  ChevronRight, Globe, Webhook, Code, FileCode2, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from '../components/NotificationBell'
import GlobalSearch from '../components/GlobalSearch'
import UserAccountDropdown from '../components/UserAccountDropdown'
import ThemeToggle from '../components/ThemeToggle'

const sidebarItems: { to: string; icon: LucideIcon; label: string }[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/create', icon: FolderPlus, label: 'New Project' },
  { to: '/dashboard/hosted-page', icon: Globe, label: 'Hosted Page' },
  { to: '/dashboard/form-integrations', icon: Webhook, label: 'Form Integrations' },
  { to: '/dashboard/embed', icon: FileCode2, label: 'Embed Forms' },
  { to: '/dashboard/api', icon: Code, label: 'API & BYOUI' },
  { to: '/dashboard/integrations', icon: Plug, label: 'Browse Integrations' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { token, loading, logout, isAdmin } = useAuth()

  useEffect(() => {
    if (!loading && !token) navigate('/login')
  }, [loading, token, navigate])

  return (
    <div className="min-h-screen flex bg-nexus-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-cyan-glow focus:text-nexus-900 focus:rounded-lg focus:font-display focus:font-bold"
      >
        Skip to content
      </a>
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col border-r border-cyan-glow/[0.06] bg-nexus-800/60 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}>
        <div className={`h-16 flex items-center border-b border-cyan-glow/[0.06] ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-glow to-magenta-glow flex items-center justify-center">
              <span className="font-display font-black text-nexus-900 text-xs">N</span>
            </div>
          ) : (
            <Logo size="small" />
          )}
        </div>

        <nav aria-label="Sidebar navigation" className="flex-1 py-4 px-2 space-y-1">
          {sidebarItems.map(item => {
            const active = location.pathname === item.to
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 no-underline rounded-lg transition-all duration-200 ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                } ${
                  active
                    ? 'bg-cyan-glow/[0.08] text-cyan-glow'
                    : 'text-nexus-400 hover:text-nexus-100 hover:bg-nexus-700/40'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                {!collapsed && (
                  <span className="text-sm font-semibold">{item.label}</span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-glow" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-cyan-glow/[0.06]">
          {isAdmin && (
            <Link
              to="/admin"
              className={`w-full flex items-center gap-3 no-underline mb-1 py-2.5 rounded-lg text-nexus-400 hover:text-magenta-glow hover:bg-magenta-glow/[0.05] transition-all ${collapsed ? 'justify-center px-2' : 'px-3'}`}
              title={collapsed ? 'Admin' : undefined}
            >
              <ShieldCheck size={18} />
              {!collapsed && <span className="text-sm font-semibold">Admin</span>}
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 text-nexus-500 hover:text-nexus-200 transition-colors rounded-lg hover:bg-nexus-700/30"
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
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-cyan-glow/[0.06] bg-nexus-900/80 backdrop-blur-xl">
          <GlobalSearch />
          <div className="flex items-center gap-4">
            <ThemeToggle compact />
            <NotificationBell />
            <UserAccountDropdown />
          </div>
        </header>

        <main id="main-content" className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
