import { Outlet, Link, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { to: '/pricing', label: 'Pricing' },
  { to: '/resources', label: 'Resources' },
]

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none z-[100]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, color-mix(in srgb, var(--color-cyan-glow) 0.8%, transparent) 2px, color-mix(in srgb, var(--color-cyan-glow) 0.8%, transparent) 4px)',
        }}
      />

      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-nexus-900/80 backdrop-blur-xl border-b border-cyan-glow/[0.06]" />
        <nav className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`font-body font-semibold text-sm tracking-wide no-underline transition-colors duration-200 ${
                  location.pathname === l.to
                    ? 'text-cyan-glow'
                    : 'text-nexus-300 hover:text-nexus-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle compact />
            <Link to="/login" className="btn-ghost no-underline">Log in</Link>
            <Link to="/signup" className="btn-primary no-underline inline-block">Get Started</Link>
          </div>

          <button
            className="md:hidden text-nexus-200 p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="md:hidden relative bg-nexus-800/95 backdrop-blur-xl border-b border-cyan-glow/[0.06] px-6 py-6 space-y-4 animate-fade-in">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="block font-body font-semibold text-nexus-200 no-underline py-2"
              >
                {l.label}
              </Link>
            ))}
            <ThemeToggle />
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="btn-ghost no-underline" onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link to="/signup" className="btn-primary no-underline" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <footer className="border-t border-cyan-glow/[0.06] bg-nexus-900/50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <Logo size="small" />
              <p className="mt-4 text-sm text-nexus-400 leading-relaxed max-w-xs">
                The futuristic waitlist platform that converts anticipation into explosive launches.
              </p>
            </div>
            {[
              { title: 'Product', links: [{ label: 'Features', to: '/#features' }, { label: 'Pricing', to: '/pricing' }, { label: 'Integrations', to: '/dashboard/integrations' }, { label: 'Changelog', to: '/changelog' }] },
              { title: 'Resources', links: [{ label: 'Documentation', to: '/resources' }, { label: 'API Reference', to: '/resources' }, { label: 'Blog', to: '/resources' }, { label: 'Community', to: '/contact' }] },
              { title: 'Company', links: [{ label: 'About', to: '/about' }, { label: 'Careers', to: '/contact' }, { label: 'Contact', to: '/contact' }, { label: 'Legal', to: '/legal' }] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-display text-xs tracking-[0.2em] text-nexus-300 uppercase mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <Link to={link.to} className="text-sm text-nexus-400 hover:text-cyan-glow transition-colors no-underline">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-14 pt-8 border-t border-nexus-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-nexus-500 font-mono">&copy; 2026 NexusWait. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-xs text-nexus-500 hover:text-cyan-glow transition-colors no-underline">Twitter</a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-xs text-nexus-500 hover:text-cyan-glow transition-colors no-underline">Discord</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs text-nexus-500 hover:text-cyan-glow transition-colors no-underline">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
