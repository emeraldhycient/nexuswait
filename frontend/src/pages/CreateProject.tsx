import { useState } from 'react'
import {
  ArrowRight, ArrowLeft, Share2,
  Sparkles, Check, Code, Timer, Zap, Settings2
} from 'lucide-react'
import { useCreateProject, getMutationErrorMessage } from '../api/hooks'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { CustomFieldDefinition, CustomFieldType } from '../shared/hosted-page-types'

// ─── Field presets: quick-add fields that become CustomFieldDefinitions ───
const FIELD_PRESETS: Record<string, { label: string; fieldKey: string; placeholder: string; type: CustomFieldType }> = {
  company:  { label: 'Company',  fieldKey: 'company', placeholder: 'Your company',      type: 'text'  },
  role:     { label: 'Role',     fieldKey: 'role',    placeholder: 'Your role',          type: 'text'  },
  phone:    { label: 'Phone',    fieldKey: 'phone',   placeholder: 'Your phone number',  type: 'phone' },
  website:  { label: 'Website',  fieldKey: 'website', placeholder: 'https://yoursite.com', type: 'url' },
}

// ─── Template definitions with preset configuration ─────────────────────
const templates = [
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Clean email-only form',
    icon: Zap,
    color: 'from-cyan-glow/20 to-cyan-glow/5',
    fields: ['email'],
    enableReferral: false,
  },
  {
    id: 'referral',
    name: 'Referral',
    desc: 'With viral share loop',
    icon: Share2,
    color: 'from-magenta-glow/20 to-magenta-glow/5',
    fields: ['email', 'name'],
    enableReferral: true,
  },
  {
    id: 'countdown',
    name: 'Countdown',
    desc: 'Urgency-driven launch',
    icon: Timer,
    color: 'from-violet-glow/20 to-violet-glow/5',
    fields: ['email', 'name'],
    enableReferral: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    desc: 'Start from scratch',
    icon: Settings2,
    color: 'from-amber-glow/20 to-amber-glow/5',
    fields: null, // null = keep current selection
    enableReferral: true,
  },
]

let fieldIdCounter = 0
function generateFieldId(): string {
  return 'cf_create_' + (++fieldIdCounter) + '_' + Math.random().toString(36).slice(2, 8)
}

/** Convert selected field names into CustomFieldDefinition[] for the backend */
function buildCustomFields(fields: string[]): CustomFieldDefinition[] {
  return fields
    .filter((f) => f !== 'email' && f !== 'name') // email is built-in, name uses showNameField
    .map((f) => {
      const preset = FIELD_PRESETS[f]
      if (!preset) return null
      return {
        id: generateFieldId(),
        label: preset.label,
        fieldKey: preset.fieldKey,
        placeholder: preset.placeholder,
        type: preset.type,
        required: false,
      } satisfies CustomFieldDefinition
    })
    .filter(Boolean) as CustomFieldDefinition[]
}

interface CreateProjectForm {
  name: string
  domain: string
  template: string
  fields: string[]
  enableReferral: boolean
  brandColor: string
  redirectUrl: string
  webhookUrl: string
}

export default function CreateProject() {
  useDocumentTitle('New Project')
  const createProject = useCreateProject()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<CreateProjectForm>({
    name: '',
    domain: '',
    template: 'minimal',
    fields: ['email'],
    enableReferral: false,
    brandColor: '#00e8ff',
    redirectUrl: '',
    webhookUrl: '',
  })

  const update = <K extends keyof CreateProjectForm>(key: K, val: CreateProjectForm[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  const toggleField = (field: string) => {
    const fields = form.fields.includes(field)
      ? form.fields.filter(f => f !== field)
      : [...form.fields, field]
    update('fields', fields)
  }

  /** Apply a template preset — updates fields and referral toggle */
  const applyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId)
    if (!tpl) return
    const updates: Partial<CreateProjectForm> = { template: templateId }
    if (tpl.fields !== null) {
      updates.fields = tpl.fields
    }
    updates.enableReferral = tpl.enableReferral
    setForm((f) => ({ ...f, ...updates }))
  }

  /** Build the deploy payload */
  const handleDeploy = () => {
    const customFields = buildCustomFields(form.fields)
    createProject.mutate({
      name: form.name || 'Untitled Project',
      redirectUrl: form.redirectUrl || undefined,
      webhookUrl: form.webhookUrl || undefined,
      ...(customFields.length > 0 && { customFields }),
    })
  }

  const steps = [
    { num: 1, label: 'Basics' },
    { num: 2, label: 'Template' },
    { num: 3, label: 'Configure' },
    { num: 4, label: 'Launch' },
  ]

  // Derive display summary for Step 4
  const selectedTemplate = templates.find((t) => t.id === form.template)
  const customFieldNames = form.fields.filter((f) => f !== 'email' && f !== 'name' && FIELD_PRESETS[f])
  const hasNameField = form.fields.includes('name')

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Create Project</h1>
        <p className="text-sm text-nexus-400 mt-1">Set up a new waitlist in a few steps.</p>
      </div>

      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold transition-all ${
              step >= s.num
                ? 'bg-cyan-glow text-nexus-900'
                : 'bg-nexus-700/50 text-nexus-500'
            }`}>
              {step > s.num ? <Check size={14} /> : s.num}
            </div>
            <span className={`hidden sm:block text-xs font-mono tracking-wider ${step >= s.num ? 'text-cyan-glow' : 'text-nexus-600'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px ${step > s.num ? 'bg-cyan-glow/30' : 'bg-nexus-700/30'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card-surface p-7">
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Project Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className="input-field"
                placeholder="My Awesome Product"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Custom Domain (optional)</label>
              <div className="flex items-center">
                <span className="text-sm text-nexus-500 pr-2 font-mono">https://</span>
                <input
                  type="text"
                  value={form.domain}
                  onChange={e => update('domain', e.target.value)}
                  className="input-field"
                  placeholder="waitlist.yoursite.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-2">Form Fields</label>
              <p className="text-[11px] text-nexus-500 mb-2">Select which fields to collect from subscribers. You can add more custom fields later.</p>
              <div className="flex flex-wrap gap-2">
                {['email', 'name', 'company', 'role', 'phone', 'website'].map(field => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => field !== 'email' && toggleField(field)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider capitalize transition-all ${
                      form.fields.includes(field)
                        ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20'
                        : 'bg-nexus-700/30 text-nexus-500 border border-transparent hover:border-nexus-600'
                    } ${field === 'email' ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
                  >
                    {field === 'email' ? 'email (required)' : field}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <p className="text-sm text-nexus-400 mb-5">Choose a starting template for your waitlist page.</p>
            <div className="grid grid-cols-2 gap-3">
              {templates.map(t => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    className={`p-5 rounded-xl text-left transition-all border ${
                      form.template === t.id
                        ? 'border-cyan-glow/30 bg-cyan-glow/[0.04]'
                        : 'border-nexus-700/30 hover:border-nexus-600/50 bg-nexus-800/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center mb-3`}>
                      <Icon size={16} className="text-nexus-200" />
                    </div>
                    <div className="font-display text-sm font-bold text-nexus-100 tracking-wider">{t.name}</div>
                    <div className="text-xs text-nexus-500 mt-0.5">{t.desc}</div>
                    {t.fields !== null && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.fields.map(f => (
                          <span key={f} className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-nexus-700/40 text-nexus-400 capitalize">{f}</span>
                        ))}
                        {t.enableReferral && (
                          <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-magenta-glow/10 text-magenta-glow">referral</span>
                        )}
                      </div>
                    )}
                    {form.template === t.id && (
                      <div className="mt-2">
                        <Check size={14} className="text-cyan-glow" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-nexus-500 mt-3">
              Selecting a template pre-configures your form fields and settings. Choose <strong className="text-nexus-300">Custom</strong> to keep your current selection.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between p-4 rounded-xl bg-nexus-700/20 border border-nexus-700/30">
              <div className="flex items-center gap-3">
                <Share2 size={18} className="text-magenta-glow" />
                <div>
                  <div className="text-sm font-semibold text-nexus-200">Referral Engine</div>
                  <div className="text-xs text-nexus-500">Let signups share for priority access</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => update('enableReferral', !form.enableReferral)}
                className={`w-11 h-6 rounded-full transition-all relative ${form.enableReferral ? 'bg-cyan-glow' : 'bg-nexus-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${form.enableReferral ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={e => update('brandColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-nexus-600 bg-transparent"
                />
                <input
                  type="text"
                  value={form.brandColor}
                  onChange={e => update('brandColor', e.target.value)}
                  className="input-field font-mono flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Redirect URL (after signup)</label>
              <input
                type="url"
                value={form.redirectUrl}
                onChange={e => update('redirectUrl', e.target.value)}
                className="input-field"
                placeholder="https://yoursite.com/thank-you"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Webhook URL (optional)</label>
              <input
                type="url"
                value={form.webhookUrl}
                onChange={e => update('webhookUrl', e.target.value)}
                className="input-field"
                placeholder="https://api.yoursite.com/webhook"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center animate-fade-in py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-glow/20 to-emerald-glow/20 flex items-center justify-center mx-auto mb-5">
              <Sparkles size={28} className="text-cyan-glow" />
            </div>
            <h2 className="font-display text-xl font-bold text-nexus-50 tracking-wider">Ready to Launch!</h2>
            <p className="text-sm text-nexus-400 mt-2 max-w-md mx-auto">
              Your waitlist <span className="text-cyan-glow font-semibold">{form.name || 'Untitled'}</span> is configured.
              Hit deploy to go live.
            </p>

            {/* Configuration summary */}
            <div className="mt-6 card-surface p-4 text-left space-y-3">
              <span className="text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Configuration Summary</span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-nexus-500">Template</span>
                  <div className="text-nexus-200 font-semibold mt-0.5">{selectedTemplate?.name ?? 'Minimal'}</div>
                </div>
                <div>
                  <span className="text-nexus-500">Referral</span>
                  <div className={`font-semibold mt-0.5 ${form.enableReferral ? 'text-emerald-glow' : 'text-nexus-500'}`}>
                    {form.enableReferral ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div>
                  <span className="text-nexus-500">Form Fields</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-nexus-700/40 text-nexus-300">email</span>
                    {hasNameField && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-nexus-700/40 text-nexus-300">name</span>}
                    {customFieldNames.map(f => (
                      <span key={f} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-glow/10 text-cyan-glow">{f}</span>
                    ))}
                  </div>
                </div>
                {form.redirectUrl && (
                  <div>
                    <span className="text-nexus-500">Redirect</span>
                    <div className="text-nexus-300 font-mono text-[10px] mt-0.5 truncate">{form.redirectUrl}</div>
                  </div>
                )}
              </div>

              <div className="border-t border-nexus-700/30 pt-3 mt-3">
                <span className="text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Quick Integration</span>
                <p className="text-xs text-nexus-400 mt-1 mb-2">
                  After deploying, find the embed code on your project page via the <Code size={11} className="inline text-cyan-glow" /> <span className="text-cyan-glow font-semibold">Embed</span> button.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-nexus-500">
                    <span className="w-5 h-5 rounded-full bg-cyan-glow/10 flex items-center justify-center text-cyan-glow font-bold text-[10px]">1</span>
                    <span>Deploy your project</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-nexus-500">
                    <span className="w-5 h-5 rounded-full bg-cyan-glow/10 flex items-center justify-center text-cyan-glow font-bold text-[10px]">2</span>
                    <span>Click <strong className="text-nexus-300">Embed</strong> to get your snippet</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-nexus-500">
                    <span className="w-5 h-5 rounded-full bg-cyan-glow/10 flex items-center justify-center text-cyan-glow font-bold text-[10px]">3</span>
                    <span>Paste into your site or use the API</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeploy}
              disabled={createProject.isPending}
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              {createProject.isPending ? 'Creating...' : 'Deploy & Go Live'} <ArrowRight size={14} />
            </button>
            {createProject.error && (
              <p className="text-xs text-magenta-glow mt-2">{getMutationErrorMessage(createProject.error)}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(s => s - 1)} className="btn-ghost flex items-center gap-2">
            <ArrowLeft size={14} /> Back
          </button>
        ) : <div />}
        {step < 4 && (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && !form.name.trim()}
            className="btn-primary flex items-center gap-2"
          >
            Continue <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
