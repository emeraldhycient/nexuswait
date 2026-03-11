import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Globe, Eye, Palette, Type, Layout, Monitor, Tablet, Smartphone,
  ArrowLeft, Copy, Check, Sparkles,
  Plus, GripVertical, Trash2
} from 'lucide-react'

const themes = [
  { id: 'nexus-dark', name: 'Nexus Dark', preview: 'bg-gradient-to-br from-[#0a0a14] to-[#1a1a2e]' },
  { id: 'aurora', name: 'Aurora', preview: 'bg-gradient-to-br from-[#0f172a] to-[#1e3a5f]' },
  { id: 'ember', name: 'Ember', preview: 'bg-gradient-to-br from-[#1a0a0a] to-[#2e1a1a]' },
  { id: 'frost', name: 'Frost', preview: 'bg-gradient-to-br from-[#f0f4f8] to-[#d9e2ec]' },
  { id: 'minimal-light', name: 'Minimal Light', preview: 'bg-gradient-to-br from-white to-[#f5f5f5]' },
  { id: 'midnight', name: 'Midnight', preview: 'bg-gradient-to-br from-[#0d0d1a] to-[#1a1a3e]' },
]

const defaultSections = [
  { id: 's1', type: 'hero', label: 'Hero Section', enabled: true },
  { id: 's2', type: 'features', label: 'Features Grid', enabled: true },
  { id: 's3', type: 'social-proof', label: 'Social Proof', enabled: false },
  { id: 's4', type: 'countdown', label: 'Countdown Timer', enabled: false },
]

interface PageConfig {
  title: string
  subtitle: string
  ctaText: string
  slug: string
  customDomain: string
  metaDescription: string
  ogImage: string
  primaryColor: string
  headingFont: string
  bodyFont: string
}

type HostedTabId = 'design' | 'content' | 'sections' | 'seo'
type PreviewMode = 'desktop' | 'tablet' | 'mobile'

const tabs: { id: HostedTabId; label: string; icon: LucideIcon }[] = [
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'content', label: 'Content', icon: Type },
  { id: 'sections', label: 'Sections', icon: Layout },
  { id: 'seo', label: 'SEO & Domain', icon: Globe },
]

const previewIcons: { mode: PreviewMode; icon: LucideIcon; w: string }[] = [
  { mode: 'desktop', icon: Monitor, w: '100%' },
  { mode: 'tablet', icon: Tablet, w: '768px' },
  { mode: 'mobile', icon: Smartphone, w: '375px' },
]

export default function HostedPage() {
  const [activeTab, setActiveTab] = useState<HostedTabId>('design')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [selectedTheme, setSelectedTheme] = useState('nexus-dark')
  const [sections, setSections] = useState(defaultSections)
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    title: 'SynthOS \u2014 The Future of Operating Systems',
    subtitle: 'Join the waitlist for early access to the next generation of computing.',
    ctaText: 'Join the Waitlist',
    slug: 'synthos-launch',
    customDomain: '',
    metaDescription: 'Be the first to experience SynthOS. Sign up for early access.',
    ogImage: '',
    primaryColor: '#00e8ff',
    headingFont: 'Orbitron',
    bodyFont: 'Rajdhani',
  })
  const [published, setPublished] = useState(false)
  const [copied, setCopied] = useState(false)

  const update = <K extends keyof PageConfig>(key: K, val: PageConfig[K]) =>
    setPageConfig(c => ({ ...c, [key]: val }))

  const toggleSection = (id: string) => {
    setSections(s => s.map(sec => sec.id === id ? { ...sec, enabled: !sec.enabled } : sec))
  }

  const removeSection = (id: string) => {
    setSections(s => s.filter(sec => sec.id !== id))
  }

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-fade-in">
      <Link to="/dashboard" className="no-underline inline-flex items-center gap-1.5 text-sm text-nexus-500 hover:text-cyan-glow transition-colors mb-5">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Hosted Page Editor</h1>
          <p className="text-sm text-nexus-400 mt-1">Design and publish your waitlist landing page.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-nexus-700/30 bg-nexus-800/30">
            {previewIcons.map(p => {
              const Icon = p.icon
              return (
                <button
                  key={p.mode}
                  type="button"
                  onClick={() => setPreviewMode(p.mode)}
                  className={`p-1.5 rounded transition-all ${previewMode === p.mode ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-nexus-500 hover:text-nexus-300'}`}
                >
                  <Icon size={15} />
                </button>
              )
            })}
          </div>
          <button type="button" className="btn-ghost flex items-center gap-1.5 text-xs">
            <Eye size={13} /> Preview
          </button>
          <button
            type="button"
            onClick={() => setPublished(!published)}
            className={`flex items-center gap-1.5 text-xs font-display font-bold tracking-wider px-4 py-2 rounded-lg transition-all ${
              published ? 'bg-emerald-glow/10 text-emerald-glow border border-emerald-glow/20' : 'btn-primary'
            }`}
          >
            {published ? <><Check size={13} /> Published</> : <><Globe size={13} /> Publish</>}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="flex gap-1 p-0.5 rounded-lg border border-cyan-glow/[0.06] bg-nexus-800/30">
            {tabs.map(tab => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                    activeTab === tab.id ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-nexus-500 hover:text-nexus-300'
                  }`}
                >
                  <TabIcon size={13} /> {tab.label}
                </button>
              )
            })}
          </div>

          <div className="card-surface p-5 max-h-[calc(100vh-280px)] overflow-y-auto">
            {activeTab === 'design' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {themes.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTheme(t.id)}
                        className={`rounded-lg overflow-hidden border transition-all ${
                          selectedTheme === t.id ? 'border-cyan-glow/40 ring-1 ring-cyan-glow/20' : 'border-nexus-700/30'
                        }`}
                      >
                        <div className={`h-12 ${t.preview}`} />
                        <div className="p-1.5 bg-nexus-800/50">
                          <span className="text-[9px] text-nexus-400 font-mono">{t.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={pageConfig.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border border-nexus-600 bg-transparent" />
                    <input type="text" value={pageConfig.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="input-field font-mono text-xs flex-1" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Heading Font</label>
                  <select value={pageConfig.headingFont} onChange={e => update('headingFont', e.target.value)} className="input-field text-sm">
                    {['Orbitron', 'Inter', 'Poppins', 'Space Grotesk', 'DM Sans', 'Montserrat', 'Playfair Display'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Body Font</label>
                  <select value={pageConfig.bodyFont} onChange={e => update('bodyFont', e.target.value)} className="input-field text-sm">
                    {['Rajdhani', 'Inter', 'DM Sans', 'Source Sans Pro', 'Nunito', 'Lato'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Headline</label>
                  <input type="text" value={pageConfig.title} onChange={e => update('title', e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Subtitle</label>
                  <textarea value={pageConfig.subtitle} onChange={e => update('subtitle', e.target.value)} rows={3} className="input-field text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">CTA Button Text</label>
                  <input type="text" value={pageConfig.ctaText} onChange={e => update('ctaText', e.target.value)} className="input-field text-sm" />
                </div>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs text-nexus-500 mb-2">Drag to reorder. Toggle visibility per section.</p>
                {sections.map(sec => (
                  <div key={sec.id} className="flex items-center gap-2 p-3 rounded-lg bg-nexus-700/15 border border-nexus-700/20">
                    <GripVertical size={14} className="text-nexus-600 cursor-grab" />
                    <span className="flex-1 text-sm text-nexus-200 font-semibold">{sec.label}</span>
                    <button type="button" onClick={() => toggleSection(sec.id)} className={`w-8 h-4.5 rounded-full transition-all relative ${sec.enabled ? 'bg-cyan-glow' : 'bg-nexus-600'}`} style={{ width: 32, height: 18 }}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-transform" style={{ width: 14, height: 14, transform: sec.enabled ? 'translateX(16px)' : 'translateX(2px)' }} />
                    </button>
                    <button type="button" onClick={() => removeSection(sec.id)} className="text-nexus-600 hover:text-magenta-glow transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button type="button" className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-nexus-600 text-xs text-nexus-500 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all">
                  <Plus size={13} /> Add Section
                </button>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Page Slug</label>
                  <div className="flex items-center">
                    <span className="text-xs text-nexus-500 font-mono pr-1">nexuswait.io/</span>
                    <input type="text" value={pageConfig.slug} onChange={e => update('slug', e.target.value)} className="input-field text-sm font-mono flex-1" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Custom Domain</label>
                  <input type="text" value={pageConfig.customDomain} onChange={e => update('customDomain', e.target.value)} className="input-field text-sm" placeholder="waitlist.yoursite.com" />
                  <p className="text-[10px] text-nexus-600 mt-1">Add a CNAME record pointing to pages.nexuswait.io</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Meta Description</label>
                  <textarea value={pageConfig.metaDescription} onChange={e => update('metaDescription', e.target.value)} rows={2} className="input-field text-sm resize-none" />
                  <p className="text-[10px] text-nexus-600 mt-1">{pageConfig.metaDescription.length}/160 characters</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">OG Image URL</label>
                  <input type="url" value={pageConfig.ogImage} onChange={e => update('ogImage', e.target.value)} className="input-field text-sm" placeholder="https://..." />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-glow/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-magenta-glow/60" />
              <div className="w-2 h-2 rounded-full bg-amber-glow/60" />
              <div className="w-2 h-2 rounded-full bg-emerald-glow/60" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-nexus-900/50 border border-nexus-700/30">
              <Globe size={10} className="text-nexus-500" />
              <span className="font-mono text-[10px] text-nexus-400">{pageConfig.customDomain || `nexuswait.io/${pageConfig.slug}`}</span>
            </div>
            <button type="button" onClick={handleCopy} className="text-nexus-500 hover:text-cyan-glow transition-colors">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>

          <div className="flex justify-center p-4 bg-nexus-900/30 min-h-[500px]">
            <div style={{ width: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px', maxWidth: '100%' }} className="transition-all duration-300">
              <div className={`rounded-lg overflow-hidden ${themes.find(t => t.id === selectedTheme)?.preview ?? ''}`} style={{ minHeight: 460 }}>
                <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
                    <Sparkles size={10} className="text-cyan-glow" />
                    <span className="font-mono text-[10px] tracking-wider" style={{ color: pageConfig.primaryColor }}>NOW ACCEPTING SIGNUPS</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4 max-w-lg" style={{ fontFamily: pageConfig.headingFont }}>
                    {pageConfig.title || 'Your Headline Here'}
                  </h2>
                  <p className="text-sm text-white/60 max-w-md mb-8" style={{ fontFamily: pageConfig.bodyFont }}>
                    {pageConfig.subtitle || 'Your subtitle goes here'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-sm">
                    <div className="flex-1 w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 flex items-center">
                      <span className="text-xs text-white/30" style={{ fontFamily: pageConfig.bodyFont }}>you@email.com</span>
                    </div>
                    <div className="h-10 px-6 rounded-lg flex items-center justify-center text-xs font-bold tracking-wider text-nexus-900" style={{ background: pageConfig.primaryColor, fontFamily: pageConfig.headingFont }}>
                      {pageConfig.ctaText || 'Submit'}
                    </div>
                  </div>
                  <p className="text-[10px] text-white/30 mt-4 font-mono">1,247 people already on the waitlist</p>
                  {sections.filter(s => s.enabled).length > 1 && (
                    <div className="mt-10 pt-6 border-t border-white/5 w-full">
                      <div className="flex items-center justify-center gap-4 flex-wrap">
                        {sections.filter(s => s.enabled).map(sec => (
                          <span key={sec.id} className="text-[9px] font-mono text-white/20 px-2 py-1 border border-white/5 rounded">{sec.label}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
