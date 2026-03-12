import type { HeroContent } from '../../../shared/hosted-page-types'

interface HeroEditorProps {
  content: HeroContent
  onChange: (content: HeroContent) => void
}

export function HeroEditor({ content, onChange }: HeroEditorProps) {
  const update = <K extends keyof HeroContent>(key: K, value: HeroContent[K]) =>
    onChange({ ...content, [key]: value })

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">Headline</label>
        <input
          type="text"
          value={content.headline}
          onChange={(e) => update('headline', e.target.value)}
          className="input-field text-sm"
          placeholder="e.g. The Future of Waitlist Management"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">Subtitle</label>
        <textarea
          value={content.subtitle}
          onChange={(e) => update('subtitle', e.target.value)}
          rows={2}
          className="input-field text-sm resize-none"
          placeholder="A short description below the headline"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">CTA Button Text</label>
        <input
          type="text"
          value={content.ctaText}
          onChange={(e) => update('ctaText', e.target.value)}
          className="input-field text-sm"
          placeholder="Join the Waitlist"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">Badge Text</label>
        <input
          type="text"
          value={content.badgeText ?? ''}
          onChange={(e) => update('badgeText', e.target.value)}
          className="input-field text-sm"
          placeholder="NOW ACCEPTING SIGNUPS"
        />
      </div>
    </div>
  )
}
