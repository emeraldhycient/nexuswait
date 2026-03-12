import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Globe, Eye, Palette, Layout, Monitor, Tablet, Smartphone,
  ArrowLeft, Copy, Check, Save, Loader2, GripVertical, Trash2,
  ChevronDown, ChevronRight, FileText, CheckCircle,
} from 'lucide-react'
import {
  useProjects,
  useHostedPage,
  useUpsertHostedPage,
  usePublishHostedPage,
  useUnpublishHostedPage,
  getMutationErrorMessage,
} from '../api/hooks'

import type { Section, FormConfig, SuccessConfig } from '../shared/hosted-page-types'
import { defaultFormConfig, defaultSuccessConfig, defaultContentForType } from '../shared/hosted-page-types'
import { THEMES, HEADING_FONTS, BODY_FONTS, resolveTheme } from '../shared/theme-config'

import { SectionContentEditor } from './hosted-page-editor/SectionContentEditor'
import { SectionPicker } from './hosted-page-editor/SectionPicker'
import { FormConfigPanel } from './hosted-page-editor/FormConfigPanel'
import { SuccessConfigPanel } from './hosted-page-editor/SuccessConfigPanel'
import { EditorPreview } from './hosted-page-editor/EditorPreview'

type HostedTabId = 'design' | 'sections' | 'form' | 'success' | 'seo'
type PreviewMode = 'desktop' | 'tablet' | 'mobile'

const tabDefs: { id: HostedTabId; label: string; icon: LucideIcon }[] = [
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'sections', label: 'Sections', icon: Layout },
  { id: 'form', label: 'Form', icon: FileText },
  { id: 'success', label: 'Success', icon: CheckCircle },
  { id: 'seo', label: 'SEO', icon: Globe },
]

const previewIcons: { mode: PreviewMode; icon: LucideIcon; w: string }[] = [
  { mode: 'desktop', icon: Monitor, w: '100%' },
  { mode: 'tablet', icon: Tablet, w: '768px' },
  { mode: 'mobile', icon: Smartphone, w: '375px' },
]

export default function HostedPage() {
  // ─── Project selector ──────────────────────────────
  const { data: projectsList, isLoading: projectsLoading } = useProjects()
  const projects = projectsList ?? []
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  // ─── Page data from API ────────────────────────────
  const { data: pageData, isLoading: pageLoading } = useHostedPage(selectedProjectId)
  const upsertPage = useUpsertHostedPage(selectedProjectId)
  const publishPage = usePublishHostedPage(selectedProjectId)
  const unpublishPage = useUnpublishHostedPage(selectedProjectId)

  // ─── Local state ───────────────────────────────────
  const [activeTab, setActiveTab] = useState<HostedTabId>('design')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [selectedTheme, setSelectedTheme] = useState('nexus-dark')

  const [sections, setSections] = useState<Section[]>([
    { id: 's1', type: 'hero', label: 'Hero Section', enabled: true, content: defaultContentForType('hero') } as Section,
  ])
  const [formConfig, setFormConfig] = useState<FormConfig>(defaultFormConfig())
  const [successConfig, setSuccessConfig] = useState<SuccessConfig>(defaultSuccessConfig())

  const [slug, setSlug] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#00e8ff')
  const [headingFont, setHeadingFont] = useState('Orbitron')
  const [bodyFont, setBodyFont] = useState('Rajdhani')

  const [published, setPublished] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pageDataLoaded, setPageDataLoaded] = useState<string | undefined>(undefined)
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null)

  // Populate local state from API data
  useEffect(() => {
    if (pageData && selectedProjectId && pageDataLoaded !== selectedProjectId) {
      const p = pageData as Record<string, unknown>
      const overrides = (p.themeOverrides as Record<string, string>) ?? {}
      setPrimaryColor(overrides.primaryColor ?? '#00e8ff')
      setHeadingFont(overrides.headingFont ?? 'Orbitron')
      setBodyFont(overrides.bodyFont ?? 'Rajdhani')
      setSlug((p.slug as string) ?? '')
      setCustomDomain((p.customDomain as string) ?? '')
      setMetaDescription((p.metaDescription as string) ?? '')
      setOgImage((p.ogImageUrl as string) ?? '')
      if (p.themeId) setSelectedTheme(p.themeId as string)

      // Load sections with full content
      if (Array.isArray(p.sections) && (p.sections as unknown[]).length > 0) {
        setSections(
          (p.sections as Section[]).map((s, i) => ({
            ...s,
            id: s.id ?? `s${i}`,
            label: s.label ?? s.type ?? 'Section',
            enabled: s.enabled !== false,
            content: s.content ?? defaultContentForType(s.type),
          } as Section)),
        )
      }

      // Load form & success config
      if (p.formConfig && typeof p.formConfig === 'object') {
        setFormConfig({ ...defaultFormConfig(), ...(p.formConfig as FormConfig) })
      }
      if (p.successConfig && typeof p.successConfig === 'object') {
        setSuccessConfig({ ...defaultSuccessConfig(), ...(p.successConfig as SuccessConfig) })
      }

      // Fix: use status field instead of published boolean
      setPublished((p.status as string) === 'published')
      setPageDataLoaded(selectedProjectId)
    }
  }, [pageData, selectedProjectId, pageDataLoaded])

  useEffect(() => {
    if (selectedProjectId !== pageDataLoaded) setPageDataLoaded(undefined)
  }, [selectedProjectId, pageDataLoaded])

  // ─── Section operations ────────────────────────────
  const toggleSection = (id: string) => {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, enabled: !sec.enabled } as Section : sec)))
  }

  const removeSection = (id: string) => {
    setSections((s) => s.filter((sec) => sec.id !== id))
    if (expandedSectionId === id) setExpandedSectionId(null)
  }

  const updateSection = (updated: Section) => {
    setSections((s) => s.map((sec) => (sec.id === updated.id ? updated : sec)))
  }

  const addSection = (newSection: Section) => {
    setSections((s) => [...s, newSection])
    setExpandedSectionId(newSection.id)
  }

  // Drag-and-drop reorder
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setSections((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(dragIdx, 1)
      copy.splice(idx, 0, moved)
      return copy
    })
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  // ─── Save / Publish ────────────────────────────────
  const handleCopy = () => {
    const url = customDomain || `${window.location.origin}/w/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    upsertPage.mutate(
      {
        slug,
        title: (sections.find((s) => s.type === 'hero')?.content as { headline?: string })?.headline || slug,
        metaDescription,
        ogImageUrl: ogImage,
        themeId: selectedTheme,
        themeOverrides: { primaryColor, headingFont, bodyFont },
        sections,
        formConfig,
        successConfig,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
      },
    )
  }

  const handlePublishToggle = () => {
    if (published) {
      unpublishPage.mutate(undefined, { onSuccess: () => setPublished(false) })
    } else {
      publishPage.mutate(undefined, { onSuccess: () => setPublished(true) })
    }
  }

  const isPublishing = publishPage.isPending || unpublishPage.isPending

  // Resolved theme for preview
  const resolvedTheme = resolveTheme(selectedTheme, { primaryColor, headingFont, bodyFont })

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
          {projectsLoading ? (
            <span className="text-xs text-nexus-500">Loading projects...</span>
          ) : (
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="input-field text-xs py-1.5 w-40"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {projects.length === 0 && <option value="">No projects</option>}
            </select>
          )}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-nexus-700/30 bg-nexus-800/30">
            {previewIcons.map((p) => {
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
          {published && slug && (
            <a
              href={`/w/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost flex items-center gap-1.5 text-xs no-underline"
            >
              <Eye size={13} /> View Live
            </a>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={upsertPage.isPending || !selectedProjectId}
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            {upsertPage.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handlePublishToggle}
            disabled={isPublishing || !selectedProjectId}
            className={`flex items-center gap-1.5 text-xs font-display font-bold tracking-wider px-4 py-2 rounded-lg transition-all ${
              published ? 'bg-emerald-glow/10 text-emerald-glow border border-emerald-glow/20' : 'btn-primary'
            }`}
          >
            {isPublishing
              ? <Loader2 size={13} className="animate-spin" />
              : published ? <><Check size={13} /> Published</> : <><Globe size={13} /> Publish</>}
          </button>
        </div>
      </div>

      {(upsertPage.isError || publishPage.isError || unpublishPage.isError) && (
        <p className="text-magenta-glow text-xs mb-4">{getMutationErrorMessage(upsertPage.error ?? publishPage.error ?? unpublishPage.error)}</p>
      )}

      {pageLoading && <p className="text-nexus-500 text-sm mb-4">Loading page config...</p>}

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* ─── Left: Settings Panel ─── */}
        <div className="space-y-4">
          <div className="flex gap-1 p-0.5 rounded-lg border border-cyan-glow/[0.06] bg-nexus-800/30 flex-wrap">
            {tabDefs.map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-[10px] font-semibold transition-all min-w-0 ${
                    activeTab === tab.id ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-nexus-500 hover:text-nexus-300'
                  }`}
                >
                  <TabIcon size={12} /> {tab.label}
                </button>
              )
            })}
          </div>

          <div className="card-surface p-5 max-h-[calc(100vh-280px)] overflow-y-auto">
            {/* ──── Design Tab ──── */}
            {activeTab === 'design' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTheme(t.id)}
                        className={`rounded-lg overflow-hidden border transition-all ${
                          selectedTheme === t.id ? 'border-cyan-glow/40 ring-1 ring-cyan-glow/20' : 'border-nexus-700/30'
                        }`}
                      >
                        <div className={`h-12 ${t.previewClass}`} />
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
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border border-nexus-600 bg-transparent" />
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="input-field font-mono text-xs flex-1" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Heading Font</label>
                  <select value={headingFont} onChange={(e) => setHeadingFont(e.target.value)} className="input-field text-sm">
                    {HEADING_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Body Font</label>
                  <select value={bodyFont} onChange={(e) => setBodyFont(e.target.value)} className="input-field text-sm">
                    {BODY_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* ──── Sections Tab ──── */}
            {activeTab === 'sections' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs text-nexus-500 mb-2">Drag to reorder. Click to expand and edit content.</p>
                {sections.map((sec, idx) => {
                  const isExpanded = expandedSectionId === sec.id
                  return (
                    <div
                      key={sec.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-lg border transition-all ${
                        dragIdx === idx ? 'border-cyan-glow/30 bg-cyan-glow/5' : 'bg-nexus-700/15 border-nexus-700/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 p-3">
                        <GripVertical size={14} className="text-nexus-600 cursor-grab shrink-0" />
                        <button
                          type="button"
                          onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                          className="flex-1 flex items-center gap-2 text-left"
                        >
                          {isExpanded ? <ChevronDown size={13} className="text-cyan-glow" /> : <ChevronRight size={13} className="text-nexus-500" />}
                          <span className="text-sm text-nexus-200 font-semibold">{sec.label}</span>
                          <span className="text-[9px] font-mono text-nexus-600 ml-auto">{sec.type}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSection(sec.id)}
                          className={`w-8 rounded-full transition-all relative ${sec.enabled ? 'bg-cyan-glow' : 'bg-nexus-600'}`}
                          style={{ width: 32, height: 18 }}
                        >
                          <div
                            className="rounded-full bg-white absolute top-[2px] transition-transform"
                            style={{ width: 14, height: 14, transform: sec.enabled ? 'translateX(16px)' : 'translateX(2px)' }}
                          />
                        </button>
                        <button type="button" onClick={() => removeSection(sec.id)} className="text-nexus-600 hover:text-magenta-glow transition-colors shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-nexus-700/20 pt-3">
                          <SectionContentEditor
                            section={sec}
                            onChange={updateSection}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
                <SectionPicker existingSections={sections} onAdd={addSection} />
              </div>
            )}

            {/* ──── Form Tab ──── */}
            {activeTab === 'form' && <FormConfigPanel config={formConfig} onChange={setFormConfig} />}

            {/* ──── Success Tab ──── */}
            {activeTab === 'success' && <SuccessConfigPanel config={successConfig} onChange={setSuccessConfig} />}

            {/* ──── SEO Tab ──── */}
            {activeTab === 'seo' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Page Slug</label>
                  <div className="flex items-center">
                    <span className="text-xs text-nexus-500 font-mono pr-1">/w/</span>
                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="input-field text-sm font-mono flex-1" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Custom Domain</label>
                  <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="input-field text-sm" placeholder="waitlist.yoursite.com" />
                  <p className="text-[10px] text-nexus-600 mt-1">Add a CNAME record pointing to pages.nexuswait.io</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Meta Description</label>
                  <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className="input-field text-sm resize-none" />
                  <p className="text-[10px] text-nexus-600 mt-1">{metaDescription.length}/160 characters</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">OG Image URL</label>
                  <input type="url" value={ogImage} onChange={(e) => setOgImage(e.target.value)} className="input-field text-sm" placeholder="https://..." />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Preview ─── */}
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-glow/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-magenta-glow/60" />
              <div className="w-2 h-2 rounded-full bg-amber-glow/60" />
              <div className="w-2 h-2 rounded-full bg-emerald-glow/60" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-nexus-900/50 border border-nexus-700/30">
              <Globe size={10} className="text-nexus-500" />
              <span className="font-mono text-[10px] text-nexus-400">{customDomain || `${window.location.host}/w/${slug}`}</span>
            </div>
            <button type="button" onClick={handleCopy} className="text-nexus-500 hover:text-cyan-glow transition-colors">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>

          <div className="flex justify-center p-4 bg-nexus-900/30 min-h-[500px] overflow-auto">
            <div
              style={{ width: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px', maxWidth: '100%' }}
              className="transition-all duration-300"
            >
              <EditorPreview
                sections={sections}
                formConfig={formConfig}
                successConfig={successConfig}
                theme={resolvedTheme}
                projectId={selectedProjectId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
