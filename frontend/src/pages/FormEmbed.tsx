import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Copy, Check, Code, FileCode2, Paintbrush, Eye,
  ExternalLink, Info, Zap,
} from 'lucide-react'
import { useProjects } from '../api/hooks'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/v1'
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

type Tab = 'widget' | 'basic' | 'full' | 'styled'

export default function FormEmbed() {
  const { data: projectsList, isLoading } = useProjects()
  const projects = projectsList ?? []
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<Tab>('widget')
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const slug = selectedProject?.slug || 'your-project-slug'
  const projectId = selectedProject?.id || 'YOUR_PROJECT_ID'
  const actionUrl = `${API_BASE}/s/${slug}`

  const snippets: Record<Tab, string> = {
    widget: `<!-- NexusWait Widget -->
<script src="${APP_URL}/embed.js"></script>
<div data-nexuswait-id="${projectId}"></div>`,
    basic: `<form action="${actionUrl}" method="POST">
  <input name="email" type="email" placeholder="your@email.com" required>
  <button type="submit">Join Waitlist</button>
</form>`,
    full: `<form action="${actionUrl}" method="POST">
  <input name="name" type="text" placeholder="Your name">
  <input name="email" type="email" placeholder="your@email.com" required>
  <!-- Honeypot field — hidden from users, catches bots -->
  <input name="_hp" type="text" style="display:none" tabindex="-1" autocomplete="off">
  <button type="submit">Join Waitlist</button>
</form>`,
    styled: `<form action="${actionUrl}" method="POST" style="max-width:400px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="margin-bottom:12px">
    <input name="name" type="text" placeholder="Your name"
      style="width:100%;padding:10px 14px;border:1px solid #333;border-radius:8px;background:#0e0e18;color:#ddddf0;font-size:14px;outline:none">
  </div>
  <div style="margin-bottom:12px">
    <input name="email" type="email" placeholder="your@email.com" required
      style="width:100%;padding:10px 14px;border:1px solid #333;border-radius:8px;background:#0e0e18;color:#ddddf0;font-size:14px;outline:none">
  </div>
  <input name="_hp" type="text" style="display:none" tabindex="-1" autocomplete="off">
  <button type="submit"
    style="width:100%;padding:10px 14px;border:none;border-radius:8px;background:linear-gradient(135deg,#00e8ff,#0099b3);color:#fff;font-size:14px;font-weight:600;cursor:pointer">
    Join Waitlist
  </button>
</form>`,
  }

  const widgetFullExample = `<!-- NexusWait Widget — all options -->
<script src="${APP_URL}/embed.js"></script>
<div
  data-nexuswait-id="${projectId}"
  data-nexuswait-name="true"
  data-nexuswait-button-text="Get Early Access"
  data-nexuswait-theme="dark"
  data-nexuswait-accent="#00e8ff"
  data-nexuswait-show-count="true"
  data-nexuswait-fields="true"
  data-nexuswait-api="${API_BASE}"
></div>`

  const copyToClipboard = async (text: string, type: 'snippet' | 'url') => {
    await navigator.clipboard.writeText(text)
    if (type === 'snippet') {
      setCopiedSnippet(true)
      setTimeout(() => setCopiedSnippet(false), 2000)
    } else {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Code }[] = [
    { id: 'widget', label: 'Widget', icon: Zap },
    { id: 'basic', label: 'Basic', icon: Code },
    { id: 'full', label: 'Full', icon: FileCode2 },
    { id: 'styled', label: 'Styled', icon: Paintbrush },
  ]

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Link to="/dashboard" className="no-underline inline-flex items-center gap-1.5 text-sm text-nexus-500 hover:text-cyan-glow transition-colors mb-5">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Embed Forms</h1>
          <p className="text-sm text-nexus-400 mt-1">
            Add a signup form to any website with a simple HTML snippet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-xs text-nexus-500">Loading...</span>
          ) : (
            <select
              value={selectedProjectId ?? ''}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="input-field text-xs py-1.5 w-40"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {projects.length === 0 && <option value="">No projects</option>}
            </select>
          )}
        </div>
      </div>

      {/* Action URL */}
      <div className="card-surface p-5 mb-6">
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-2">Form Action URL</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-4 py-2.5 rounded-lg bg-nexus-700/30 border border-nexus-700/20 text-cyan-glow font-mono text-sm break-all">
            {actionUrl}
          </code>
          <button
            type="button"
            onClick={() => copyToClipboard(actionUrl, 'url')}
            className="btn-secondary text-xs py-2.5 px-3 flex items-center gap-1.5 shrink-0"
          >
            {copiedUrl ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <p className="text-[11px] text-nexus-500 mt-2">
          Use this URL as the <code className="text-nexus-300">action</code> attribute on any HTML <code className="text-nexus-300">&lt;form&gt;</code> element.
        </p>
      </div>

      {/* Code Snippets */}
      <div className="card-surface mb-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-cyan-glow/[0.06]">
          <div className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold transition-all border-b-2 ${
                    active
                      ? 'border-cyan-glow text-cyan-glow'
                      : 'border-transparent text-nexus-500 hover:text-nexus-300'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 pr-4">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="btn-ghost text-xs flex items-center gap-1.5"
            >
              <Eye size={13} /> {showPreview ? 'Hide' : 'Show'} Preview
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(snippets[activeTab], 'snippet')}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              {copiedSnippet ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Code</>}
            </button>
          </div>
        </div>

        <div className="p-5">
          <pre className="text-xs font-mono text-nexus-200 bg-nexus-700/20 rounded-lg p-4 overflow-x-auto leading-relaxed">
            {snippets[activeTab]}
          </pre>

          {activeTab === 'widget' && (
            <>
              {/* Configuration options reference */}
              <div className="mt-5 mb-4">
                <h4 className="text-xs font-mono text-nexus-400 tracking-wider uppercase mb-3">Configuration Options</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-nexus-700/30">
                        <th className="text-left py-2 pr-4 text-nexus-400 font-mono font-normal">Attribute</th>
                        <th className="text-left py-2 pr-4 text-nexus-400 font-mono font-normal">Default</th>
                        <th className="text-left py-2 text-nexus-400 font-mono font-normal">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-nexus-300">
                      {[
                        ['data-nexuswait-id', '(required)', 'Your project ID'],
                        ['data-nexuswait-name', '"false"', 'Show name input field'],
                        ['data-nexuswait-button-text', '"Join Waitlist"', 'Submit button label'],
                        ['data-nexuswait-theme', '"dark"', '"dark" or "light"'],
                        ['data-nexuswait-accent', '"#00e8ff"', 'Accent color (hex)'],
                        ['data-nexuswait-show-count', '"false"', 'Display subscriber count'],
                        ['data-nexuswait-fields', '"true"', 'Show project custom fields'],
                        ['data-nexuswait-api', `"${API_BASE}"`, 'API base URL override'],
                      ].map(([attr, def, desc]) => (
                        <tr key={attr} className="border-b border-nexus-700/15">
                          <td className="py-2 pr-4 font-mono text-cyan-glow whitespace-nowrap">{attr}</td>
                          <td className="py-2 pr-4 text-nexus-500 whitespace-nowrap">{def}</td>
                          <td className="py-2 text-nexus-400">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Full example */}
              <div>
                <h4 className="text-xs font-mono text-nexus-400 tracking-wider uppercase mb-2">Full Example (all options)</h4>
                <pre className="text-xs font-mono text-nexus-200 bg-nexus-700/20 rounded-lg p-4 overflow-x-auto leading-relaxed">
                  {widgetFullExample}
                </pre>
              </div>
            </>
          )}
        </div>

        {showPreview && activeTab !== 'widget' && (
          <div className="border-t border-cyan-glow/[0.06] p-6">
            <p className="text-xs font-mono text-nexus-500 uppercase tracking-wider mb-4">Live Preview</p>
            <div className="max-w-md mx-auto p-6 rounded-xl bg-nexus-700/15 border border-nexus-700/20">
              <div dangerouslySetInnerHTML={{ __html: snippets[activeTab].replace(`action="${actionUrl}"`, 'onsubmit="event.preventDefault();alert(\'Form submitted! (Preview mode)\')"') }} />
            </div>
          </div>
        )}
      </div>

      {/* Redirect URL Info */}
      <div className="card-surface p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20 flex items-center justify-center shrink-0 mt-0.5">
            <ExternalLink size={14} className="text-cyan-glow" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-nexus-100 tracking-wider mb-1">Redirect URL</h3>
            <p className="text-xs text-nexus-400 leading-relaxed">
              After form submission, users are redirected to your project's <strong className="text-nexus-200">Redirect URL</strong> with query parameters: <code className="text-cyan-glow">?status=success&amp;email=...&amp;ref_code=...</code>.
              If no redirect URL is configured, users see a default NexusWait success page.
            </p>
            <Link
              to="/dashboard/settings"
              className="inline-flex items-center gap-1 text-xs text-cyan-glow hover:text-cyan-glow/80 no-underline mt-2 font-semibold"
            >
              Configure in Project Settings <ArrowLeft size={10} className="rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="card-surface p-5 mb-6">
        <h3 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">How It Works</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Paste the snippet', desc: 'Add the HTML form to your website, landing page, or email template.' },
            { step: '2', title: 'User submits', desc: 'The form POSTs to NexusWait. The subscriber is created and all integrations fire.' },
            { step: '3', title: 'Redirect', desc: 'The user is redirected to your success page with their referral code.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-cyan-glow/10 border border-cyan-glow/20 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-mono font-bold text-cyan-glow">{s.step}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-nexus-100">{s.title}</p>
                <p className="text-[11px] text-nexus-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Fields Info */}
      <div className="card-surface p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20 flex items-center justify-center shrink-0 mt-0.5">
            <Zap size={14} className="text-cyan-glow" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-nexus-100 tracking-wider mb-1">Custom Fields</h3>
            <p className="text-xs text-nexus-400 leading-relaxed">
              The <strong className="text-nexus-200">Widget</strong> embed automatically fetches and renders your project's custom fields (text, number, url, phone, textarea, select, checkbox). Set <code className="text-nexus-300">data-nexuswait-fields="false"</code> to disable them.
            </p>
            <p className="text-xs text-nexus-400 leading-relaxed mt-2">
              For <strong className="text-nexus-200">HTML form</strong> snippets (Basic / Full / Styled), add extra <code className="text-nexus-300">&lt;input&gt;</code> fields using the custom field key as the <code className="text-nexus-300">name</code> attribute. Any field names other than <code className="text-nexus-300">email</code>, <code className="text-nexus-300">name</code>, and <code className="text-nexus-300">_hp</code> are automatically packed into subscriber metadata.
            </p>
          </div>
        </div>
      </div>

      {/* Honeypot Info */}
      <div className="card-surface p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-glow/10 border border-violet-glow/20 flex items-center justify-center shrink-0 mt-0.5">
            <Info size={14} className="text-violet-glow" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-nexus-100 tracking-wider mb-1">Anti-Spam (Honeypot)</h3>
            <p className="text-xs text-nexus-400 leading-relaxed">
              The "Full" and "Styled" snippets include a hidden <code className="text-nexus-300">_hp</code> field. Bots that auto-fill all fields will populate this hidden input, causing the submission to be silently rejected. Real users never see or interact with it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
