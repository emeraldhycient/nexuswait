import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import Logo from '../components/Logo'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, FolderOpen, UserPlus, Plug, Bell, Server,
  LogOut, ChevronLeft, ChevronRight, Search, User, ArrowLeft,
  CreditCard, FileText, Loader2, X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAdminGlobalSearch } from '../api/hooks'
import ThemeToggle from '../components/ThemeToggle'
import NotificationBell from '../components/NotificationBell'
import UserAccountDropdown from '../components/UserAccountDropdown'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { token, loading, isAdmin, logout } = useAuth()

  const { data: searchResults, isLoading: searchLoading } = useAdminGlobalSearch(debouncedQuery)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [location.pathname])

  const results = searchResults as Record<string, unknown[]> | undefined
  const hasResults = results && (
    (results.users?.length ?? 0) > 0 ||
    (results.projects?.length ?? 0) > 0 ||
    (results.subscribers?.length ?? 0) > 0 ||
    (results.integrations?.length ?? 0) > 0
  )

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
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-8 border-b border-magenta-glow/[0.06] bg-nexus-900/80 backdrop-blur-xl">
          <div ref={searchRef} className="relative flex items-center gap-3 flex-1 max-w-lg">
            {searchLoading ? (
              <Loader2 size={18} className="text-nexus-500 animate-spin" />
            ) : (
              <Search size={18} className="text-nexus-500" />
            )}
            <input
              type="text"
              aria-label="Search accounts and projects"
              placeholder="Search users, projects, subscribers..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              onFocus={() => { if (searchQuery.length >= 2) setSearchOpen(true) }}
              className="bg-transparent border-none outline-none text-[15px] text-nexus-200 placeholder:text-nexus-500 flex-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchOpen(false) }}
                className="text-nexus-500 hover:text-nexus-200 transition-colors"
              >
                <X size={16} />
              </button>
            )}

            {/* Search results dropdown */}
            {searchOpen && debouncedQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 card-surface border border-cyan-glow/10 rounded-xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto z-50">
                {!hasResults && !searchLoading && (
                  <div className="px-4 py-6 text-center text-sm text-nexus-500">No results found.</div>
                )}

                {/* Users */}
                {(results?.users?.length ?? 0) > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-mono text-nexus-500 tracking-widest uppercase bg-nexus-800/50">Users</div>
                    {results!.users!.slice(0, 5).map((u: unknown) => {
                      const user = u as Record<string, unknown>
                      return (
                        <Link
                          key={user.id as string}
                          to={`/admin/users/${user.id}`}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-nexus-700/30 transition-colors no-underline"
                        >
                          <User size={15} className="text-magenta-glow shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm text-nexus-200 truncate">{(user.email as string) ?? '—'}</div>
                            <div className="text-xs text-nexus-500 truncate">
                              {[(user.firstName as string), (user.lastName as string)].filter(Boolean).join(' ') || 'No name'}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Projects */}
                {(results?.projects?.length ?? 0) > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-mono text-nexus-500 tracking-widest uppercase bg-nexus-800/50">Projects</div>
                    {results!.projects!.slice(0, 5).map((p: unknown) => {
                      const project = p as Record<string, unknown>
                      return (
                        <Link
                          key={project.id as string}
                          to={`/admin/projects`}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-nexus-700/30 transition-colors no-underline"
                        >
                          <FolderOpen size={15} className="text-violet-glow shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm text-nexus-200 truncate">{(project.name as string) ?? '—'}</div>
                            <div className="text-xs text-nexus-500">{(project.status as string) ?? 'unknown'}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Subscribers */}
                {(results?.subscribers?.length ?? 0) > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-mono text-nexus-500 tracking-widest uppercase bg-nexus-800/50">Subscribers</div>
                    {results!.subscribers!.slice(0, 5).map((s: unknown) => {
                      const sub = s as Record<string, unknown>
                      return (
                        <div
                          key={sub.id as string}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-nexus-700/30 transition-colors"
                        >
                          <UserPlus size={15} className="text-cyan-glow shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm text-nexus-200 truncate">{(sub.email as string) ?? '—'}</div>
                            <div className="text-xs text-nexus-500 truncate">{(sub.name as string) || 'No name'}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Integrations */}
                {(results?.integrations?.length ?? 0) > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-mono text-nexus-500 tracking-widest uppercase bg-nexus-800/50">Integrations</div>
                    {results!.integrations!.slice(0, 5).map((int: unknown) => {
                      const integration = int as Record<string, unknown>
                      return (
                        <Link
                          key={integration.id as string}
                          to={`/admin/integrations`}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-nexus-700/30 transition-colors no-underline"
                        >
                          <Plug size={15} className="text-emerald-glow shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm text-nexus-200 truncate">{(integration.displayName as string) ?? '—'}</div>
                            <div className="text-xs text-nexus-500">{(integration.type as string) ?? 'webhook'}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-5">
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
