import type { SuccessConfig } from '../../shared/hosted-page-types'

interface SuccessConfigPanelProps {
  config: SuccessConfig
  onChange: (config: SuccessConfig) => void
}

export function SuccessConfigPanel({ config, onChange }: SuccessConfigPanelProps) {
  const update = <K extends keyof SuccessConfig>(key: K, value: SuccessConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Success Message</label>
        <input
          type="text"
          value={config.message}
          onChange={(e) => update('message', e.target.value)}
          className="input-field text-sm"
          placeholder="You're on the list!"
        />
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showPosition ?? true}
            onChange={(e) => update('showPosition', e.target.checked)}
            className="rounded border-nexus-600"
          />
          <span className="text-xs text-nexus-300">Show waitlist position</span>
        </label>
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showReferralLink ?? true}
            onChange={(e) => update('showReferralLink', e.target.checked)}
            className="rounded border-nexus-600"
          />
          <span className="text-xs text-nexus-300">Show referral share link</span>
        </label>
      </div>
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Redirect URL</label>
        <input
          type="url"
          value={config.redirectUrl ?? ''}
          onChange={(e) => update('redirectUrl', e.target.value)}
          className="input-field text-sm"
          placeholder="https://yoursite.com/thank-you (optional)"
        />
        <p className="text-[10px] text-nexus-600 mt-1">Leave empty to stay on the page after signup.</p>
      </div>
      {config.redirectUrl && (
        <div>
          <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Redirect Delay (seconds)</label>
          <input
            type="number"
            value={config.redirectDelay ?? 5}
            onChange={(e) => update('redirectDelay', parseInt(e.target.value, 10) || 5)}
            min={0}
            max={30}
            className="input-field text-sm w-24"
          />
        </div>
      )}
    </div>
  )
}
