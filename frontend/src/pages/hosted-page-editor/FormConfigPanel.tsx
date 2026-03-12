import type { FormConfig, CustomFieldDefinition } from '../../shared/hosted-page-types'

interface FormConfigPanelProps {
  config: FormConfig
  onChange: (config: FormConfig) => void
  projectCustomFields?: CustomFieldDefinition[]
}

export function FormConfigPanel({ config, onChange, projectCustomFields = [] }: FormConfigPanelProps) {
  const update = <K extends keyof FormConfig>(key: K, value: FormConfig[K]) =>
    onChange({ ...config, [key]: value })

  const enabledFieldIds = config.customFields ?? []

  const toggleCustomField = (fieldId: string) => {
    const current = config.customFields ?? []
    const next = current.includes(fieldId)
      ? current.filter((id) => id !== fieldId)
      : [...current, fieldId]
    update('customFields', next)
  }

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

      {/* Custom fields section */}
      {projectCustomFields.length > 0 && (
        <div className="pt-3 border-t border-nexus-700/30">
          <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-2">
            Custom Fields
          </label>
          <p className="text-[10px] text-nexus-600 mb-3">
            Enable project-level custom fields on this signup form.
          </p>
          <div className="space-y-2">
            {projectCustomFields.map((field) => (
              <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledFieldIds.includes(field.id)}
                  onChange={() => toggleCustomField(field.id)}
                  className="rounded border-nexus-600"
                />
                <span className="text-xs text-nexus-300">{field.label || field.fieldKey}</span>
                <span className="text-[9px] font-mono text-nexus-600 ml-auto">{field.type}</span>
                {field.required && (
                  <span className="text-[9px] font-mono text-amber-glow">req</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {projectCustomFields.length === 0 && (
        <div className="pt-3 border-t border-nexus-700/30">
          <p className="text-[10px] text-nexus-500">
            No custom fields defined. Add them in Project Settings to collect extra data.
          </p>
        </div>
      )}
    </div>
  )
}
