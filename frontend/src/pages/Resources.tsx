import { Link } from 'react-router-dom'
import {
  BookOpen, Code, Video, MessageCircle, FileText, Zap,
  ArrowRight, ExternalLink, Search, Terminal, Braces,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { usePlatformConfig } from '../api/hooks'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/* ─── Article type ──────────────────────────────────────────────────── */

interface Article {
  label: string
  to: string
}

/* ─── Documentation categories with real routes ─────────────────────── */

const categories: {
  icon: LucideIcon
  title: string
  desc: string
  articles: Article[]
}[] = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    desc: 'Set up your first waitlist in minutes.',
    articles: [
      { label: 'Quickstart Guide', to: '/signup' },
      { label: 'Creating Your First Project', to: '/dashboard/create' },
      { label: 'Embedding Waitlist Forms', to: '/dashboard/embed' },
      { label: 'Customizing Your Landing Page', to: '/dashboard/hosted-page' },
    ],
  },
  {
    icon: Braces,
    title: 'API Reference',
    desc: 'Full REST API documentation.',
    articles: [
      { label: 'Authentication & API Keys', to: '/dashboard/api' },
      { label: 'Waitlist Endpoints', to: '/dashboard/api' },
      { label: 'Subscriber Management', to: '/dashboard/api' },
      { label: 'Webhook Events', to: '/dashboard/integrations' },
    ],
  },
  {
    icon: Zap,
    title: 'Integrations',
    desc: 'Connect NexusWait to your stack.',
    articles: [
      { label: 'Zapier Integration', to: '/dashboard/form-integrations' },
      { label: 'Slack Notifications', to: '/dashboard/integrations' },
      { label: 'Mailchimp Sync', to: '/dashboard/form-integrations' },
      { label: 'Custom Webhooks', to: '/dashboard/integrations' },
    ],
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    desc: 'Learn visually with step-by-step walkthroughs.',
    articles: [
      { label: 'Platform Overview (5 min)', to: '/about' },
      { label: 'Building a Referral Waitlist', to: '/dashboard/create' },
      { label: 'Analytics Deep Dive', to: '/dashboard' },
      { label: 'API Quickstart', to: '/dashboard/api' },
    ],
  },
]

/* ─── Quick links ───────────────────────────────────────────────────── */

const quickLinks: { icon: LucideIcon; label: string; desc: string; to: string }[] = [
  { icon: Terminal, label: 'API Docs', desc: 'REST API reference', to: '/dashboard/api' },
  { icon: Code, label: 'Embed Widget', desc: 'JavaScript embed', to: '/dashboard/embed' },
  { icon: MessageCircle, label: 'Community', desc: 'Get in touch', to: '/contact' },
]

/* ─── Featured guides ───────────────────────────────────────────────── */

const guides: { title: string; tag: string; time: string; color: 'cyan' | 'magenta' | 'violet' | 'emerald'; to: string }[] = [
  { title: 'The Ultimate Pre-Launch Playbook', tag: 'Guide', time: '12 min read', color: 'cyan', to: '/about' },
  { title: 'Referral Loops That 10x Your Signups', tag: 'Strategy', time: '8 min read', color: 'magenta', to: '/dashboard/create' },
  { title: 'Building a Waitlist with Next.js + NexusWait', tag: 'Tutorial', time: '15 min read', color: 'violet', to: '/dashboard/embed' },
  { title: 'Advanced Segmentation Techniques', tag: 'Advanced', time: '10 min read', color: 'emerald', to: '/dashboard/api' },
]

const tagColors: Record<string, string> = {
  cyan: 'bg-cyan-glow/10 text-cyan-glow',
  magenta: 'bg-magenta-glow/10 text-magenta-glow',
  violet: 'bg-violet-glow/10 text-violet-glow',
  emerald: 'bg-emerald-glow/10 text-emerald-glow',
}

/* ─── Component ─────────────────────────────────────────────────────── */

export default function Resources() {
  useDocumentTitle('Resources')
  const [search, setSearch] = useState('')
  const { data: platformConfig } = usePlatformConfig()
  const apiUrl = platformConfig?.apiBaseUrl ?? 'https://api.nexuswait.com'

  const needle = search.trim().toLowerCase()

  /* Filter categories by search term */
  const filteredCategories = useMemo(() => {
    if (!needle) return categories
    return categories
      .map((cat) => ({
        ...cat,
        articles: cat.articles.filter(
          (a) =>
            a.label.toLowerCase().includes(needle) ||
            cat.title.toLowerCase().includes(needle),
        ),
      }))
      .filter((cat) => cat.articles.length > 0)
  }, [needle])

  /* Filter guides by search term */
  const filteredGuides = useMemo(() => {
    if (!needle) return guides
    return guides.filter(
      (g) =>
        g.title.toLowerCase().includes(needle) ||
        g.tag.toLowerCase().includes(needle),
    )
  }, [needle])

  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-nexus-50">
            <span className="text-cyan-glow">Resources</span> & Documentation
          </h1>
          <p className="mt-4 text-nexus-400 max-w-xl mx-auto">
            Everything you need to build, launch, and scale with NexusWait.
          </p>

          <div className="mt-8 max-w-lg mx-auto relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-500" />
            <input
              type="text"
              placeholder="Search docs, guides, API..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="input-field pl-11"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="animate-slide-up stagger-1 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {quickLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                to={item.to}
                className="no-underline card-surface p-5 flex items-center gap-4 group hover:border-cyan-glow/20 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20 flex items-center justify-center">
                  <Icon size={18} className="text-cyan-glow" />
                </div>
                <div className="flex-1">
                  <div className="font-display text-sm font-bold text-nexus-100 tracking-wider">{item.label}</div>
                  <div className="text-xs text-nexus-500">{item.desc}</div>
                </div>
                <ExternalLink size={14} className="text-nexus-600 group-hover:text-cyan-glow transition-colors" />
              </Link>
            )
          })}
        </div>

        {/* Documentation Categories */}
        {filteredCategories.length > 0 && (
          <div className="mb-20">
            <h2 className="font-display text-xl font-bold text-nexus-100 tracking-wider mb-8">Documentation</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {filteredCategories.map((cat, i) => {
                const Icon = cat.icon
                return (
                  <div
                    key={cat.title}
                    className="animate-slide-up card-surface p-6"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-cyan-glow/8 border border-cyan-glow/15 flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-cyan-glow" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-nexus-100 tracking-wider">{cat.title}</h3>
                        <p className="text-xs text-nexus-500 mt-0.5">{cat.desc}</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {cat.articles.map((article) => (
                        <li key={article.label}>
                          <Link
                            to={article.to}
                            className="no-underline flex items-center gap-2 text-sm text-nexus-300 hover:text-cyan-glow transition-colors group py-1"
                          >
                            <FileText size={13} className="text-nexus-600 group-hover:text-cyan-glow/60" />
                            {article.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Featured Guides */}
        {filteredGuides.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-bold text-nexus-100 tracking-wider mb-8">Featured Guides</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {filteredGuides.map((guide, i) => (
                <Link
                  key={guide.title}
                  to={guide.to}
                  className="no-underline card-surface p-6 group hover:border-cyan-glow/20 transition-all animate-slide-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${tagColors[guide.color]}`}>
                      {guide.tag}
                    </span>
                    <span className="text-[11px] text-nexus-600 font-mono">{guide.time}</span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-nexus-100 tracking-wider group-hover:text-cyan-glow transition-colors">
                    {guide.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-1 text-xs text-nexus-500 group-hover:text-cyan-glow/60 transition-colors">
                    Read more <ArrowRight size={11} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {needle && filteredCategories.length === 0 && filteredGuides.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-nexus-400 font-mono text-sm">No results for &ldquo;{search.trim()}&rdquo;</p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-4 text-cyan-glow text-sm font-mono hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* API Preview */}
        <div className="mt-20 animate-slide-up">
          <div className="card-surface overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-cyan-glow/[0.06]">
              <div className="w-2 h-2 rounded-full bg-magenta-glow/60" />
              <div className="w-2 h-2 rounded-full bg-amber-glow/60" />
              <div className="w-2 h-2 rounded-full bg-emerald-glow/60" />
              <span className="ml-3 font-mono text-[11px] text-nexus-500">API Example — Add Subscriber</span>
            </div>
            <pre className="p-6 font-mono text-sm text-nexus-300 overflow-x-auto leading-relaxed">
              <code>{`curl -X POST ${apiUrl}/v1/projects/prj_abc123/subscribers \\
  -H "Authorization: Bearer nw_pk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "name": "Jane Doe",
    "source": "landing_page"
  }'`}</code>
            </pre>
            <div className="px-5 py-3 border-t border-cyan-glow/[0.06]">
              <Link to="/dashboard/api" className="text-xs text-cyan-glow font-mono hover:underline inline-flex items-center gap-1">
                View full API docs <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
