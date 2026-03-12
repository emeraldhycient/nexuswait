import type { FormConfig } from '../../shared/hosted-page-types'

interface FormConfigPanelProps {
  config: FormConfig
  onChange: (config: FormConfig) => void
}

export function FormConfigPanel({ config, onChange }: FormConfigPanelProps) {
  const update = <K extends keyof FormConfig>(key: K, value: FormConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">CTA Button Text</label>
        <input
          type="text"
          value={config.ctaText}
          onChange={(e) => update('ctaText', e.target.value)}
          className="input-field text-sm"
          placeholder="Join the Waitlist"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Email Placeholder</label>
        <input
          type="text"
          value={config.placeholder ?? ''}
          onChange={(e) => update('placeholder', e.target.value)}
          className="input-field text-sm"
          placeholder="you@email.com"
        />
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showNameField ?? false}
            onChange={(e) => update('showNameField', e.target.checked)}
            className="rounded border-nexus-600"
          />
          <span className="text-xs text-nexus-300">Show name field</span>
        </label>
      </div>
      {config.showNameField && (
        <div>
          <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Name Placeholder</label>
          <input
            type="text"
            value={config.namePlaceholder ?? ''}
            onChange={(e) => update('namePlaceholder', e.target.value)}
            className="input-field text-sm"
            placeholder="Your name"
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Consent Text</label>
        <textarea
          value={config.consentText ?? ''}
          onChange={(e) => update('consentText', e.target.value)}
          rows={2}
          className="input-field text-sm resize-none"
          placeholder="I agree to receive updates... (leave empty to hide)"
        />
        <p className="text-[10px] text-nexus-600 mt-1">Leave empty to hide the consent checkbox.</p>
      </div>
    </div>
  )
}
