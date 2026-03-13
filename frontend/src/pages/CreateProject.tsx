import { useState } from 'react'
import {
  ArrowRight, ArrowLeft, Share2,
  Sparkles, Check, Code
} from 'lucide-react'
import { useCreateProject, getMutationErrorMessage } from '../api/hooks'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const templates = [
  { id: 'minimal', name: 'Minimal', desc: 'Clean single-field form', color: 'from-cyan-glow/20 to-cyan-glow/5' },
  { id: 'referral', name: 'Referral', desc: 'With viral share loop', color: 'from-magenta-glow/20 to-magenta-glow/5' },
  { id: 'countdown', name: 'Countdown', desc: 'Urgency-driven launch', color: 'from-violet-glow/20 to-violet-glow/5' },
  { id: 'custom', name: 'Custom', desc: 'Start from scratch', color: 'from-amber-glow/20 to-amber-glow/5' },
]

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
    enableReferral: true,
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

  const steps = [
    { num: 1, label: 'Basics' },
    { num: 2, label: 'Template' },
    { num: 3, label: 'Configure' },
    { num: 4, label: 'Launch' },
  ]

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
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update('template', t.id)}
                  className={`p-5 rounded-xl text-left transition-all border ${
                    form.template === t.id
                      ? 'border-cyan-glow/30 bg-cyan-glow/[0.04]'
                      : 'border-nexus-700/30 hover:border-nexus-600/50 bg-nexus-800/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center mb-3`}>
                    <Sparkles size={16} className="text-nexus-200" />
                  </div>
                  <div className="font-display text-sm font-bold text-nexus-100 tracking-wider">{t.name}</div>
                  <div className="text-xs text-nexus-500 mt-0.5">{t.desc}</div>
                  {form.template === t.id && (
                    <div className="mt-2">
                      <Check size={14} className="text-cyan-glow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
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

            <div className="mt-6 card-surface p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Quick Integration</span>
              </div>
              <p className="text-xs text-nexus-400 mb-3">
                After deploying, you'll find the embed code and API snippets on your project page via the <Code size={11} className="inline text-cyan-glow" /> <span className="text-cyan-glow font-semibold">Embed</span> button.
              </p>
              <div className="flex items-center gap-2 text-xs text-nexus-500">
                <span className="w-5 h-5 rounded-full bg-cyan-glow/10 flex items-center justify-center text-cyan-glow font-bold text-[10px]">1</span>
                <span>Deploy your project</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-nexus-500 mt-2">
                <span className="w-5 h-5 rounded-full bg-cyan-glow/10 flex items-center justify-center text-cyan-glow font-bold text-[10px]">2</span>
                <span>Click <strong className="text-nexus-300">Embed</strong> to get your snippet</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-nexus-500 mt-2">
                <span className="w-5 h-5 rounded-full bg-cyan-glow/10 flex items-center justify-center text-cyan-glow font-bold text-[10px]">3</span>
                <span>Paste into your site or use the API</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => createProject.mutate({
                name: form.name || 'Untitled Project',
                redirectUrl: form.redirectUrl || undefined,
                webhookUrl: form.webhookUrl || undefined,
              })}
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
          <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary flex items-center gap-2">
            Continue <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
