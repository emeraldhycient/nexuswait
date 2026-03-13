import { Link } from 'react-router-dom'
import {
  BookOpen, Code, Video, MessageCircle, FileText, Zap,
  ArrowRight, ExternalLink, Search, Terminal, Braces
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { usePlatformConfig } from '../api/hooks'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const categories: {
  icon: LucideIcon
  title: string
  desc: string
  articles: string[]
}[] = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    desc: 'Set up your first waitlist in minutes.',
    articles: [
      'Quickstart Guide',
      'Creating Your First Project',
      'Embedding Waitlist Forms',
      'Customizing Your Landing Page',
    ],
  },
  {
    icon: Braces,
    title: 'API Reference',
    desc: 'Full REST API documentation.',
    articles: [
      'Authentication & API Keys',
      'Waitlist Endpoints',
      'Subscriber Management',
      'Webhook Events',
    ],
  },
  {
    icon: Zap,
    title: 'Integrations',
    desc: 'Connect NexusWait to your stack.',
    articles: [
      'Zapier Integration',
      'Slack Notifications',
      'Mailchimp Sync',
      'Custom Webhooks',
    ],
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    desc: 'Learn visually with step-by-step walkthroughs.',
    articles: [
      'Platform Overview (5 min)',
      'Building a Referral Waitlist',
      'Analytics Deep Dive',
      'API Quickstart',
    ],
  },
]

const guides = [
  { title: 'The Ultimate Pre-Launch Playbook', tag: 'Guide', time: '12 min read', color: 'cyan' as const },
  { title: 'Referral Loops That 10x Your Signups', tag: 'Strategy', time: '8 min read', color: 'magenta' as const },
  { title: 'Building a Waitlist with Next.js + NexusWait', tag: 'Tutorial', time: '15 min read', color: 'violet' as const },
  { title: 'Advanced Segmentation Techniques', tag: 'Advanced', time: '10 min read', color: 'emerald' as const },
]

const tagColors: Record<string, string> = {
  cyan: 'bg-cyan-glow/10 text-cyan-glow',
  magenta: 'bg-magenta-glow/10 text-magenta-glow',
  violet: 'bg-violet-glow/10 text-violet-glow',
  emerald: 'bg-emerald-glow/10 text-emerald-glow',
}

export default function Resources() {
  useDocumentTitle('Resources')
  const [search, setSearch] = useState('')
  const { data: platformConfig } = usePlatformConfig()
  const apiUrl = platformConfig?.apiBaseUrl ?? 'https://api.nexuswait.io'

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
          {[
            { icon: Terminal, label: 'API Docs', desc: 'REST API reference' },
            { icon: Code, label: 'SDK', desc: 'JavaScript & Python' },
            { icon: MessageCircle, label: 'Community', desc: 'Discord & Forum' },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={i}
                to={item.label === 'Community' ? '/contact' : '/resources'}
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
        <div className="mb-20">
          <h2 className="font-display text-xl font-bold text-nexus-100 tracking-wider mb-8">Documentation</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {categories.map((cat, i) => {
              const Icon = cat.icon
              return (
                <div
                  key={i}
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
                    {cat.articles.map((article, j) => (
                      <li key={j}>
                        <Link to="/resources" className="no-underline flex items-center gap-2 text-sm text-nexus-300 hover:text-cyan-glow transition-colors group py-1">
                          <FileText size={13} className="text-nexus-600 group-hover:text-cyan-glow/60" />
                          {article}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        {/* Featured Guides */}
        <div>
          <h2 className="font-display text-xl font-bold text-nexus-100 tracking-wider mb-8">Featured Guides</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {guides.map((guide, i) => (
              <Link
                key={i}
                to="/resources"
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

        {/* API Preview */}
        <div className="mt-20 animate-slide-up">
          <div className="card-surface overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-cyan-glow/[0.06]">
              <div className="w-2 h-2 rounded-full bg-magenta-glow/60" />
              <div className="w-2 h-2 rounded-full bg-amber-glow/60" />
              <div className="w-2 h-2 rounded-full bg-emerald-glow/60" />
              <span className="ml-3 font-mono text-[11px] text-nexus-500">API Example — Create Waitlist</span>
            </div>
            <pre className="p-6 font-mono text-sm text-nexus-300 overflow-x-auto leading-relaxed">
              <code>{`curl -X POST ${apiUrl}/v1/waitlists \\
  -H "Authorization: Bearer nw_sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Product Launch",
    "referral_enabled": true,
    "redirect_url": "https://myapp.com/thanks",
    "fields": ["email", "name", "company"]
  }'`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
