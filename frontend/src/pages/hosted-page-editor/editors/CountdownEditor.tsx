import type { CountdownContent } from '../../../shared/hosted-page-types'

interface CountdownEditorProps {
  content: CountdownContent
  onChange: (content: CountdownContent) => void
}

export function CountdownEditor({ content, onChange }: CountdownEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">Section Heading</label>
        <input
          type="text"
          value={content.heading ?? ''}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          className="input-field text-sm"
          placeholder="Launching Soon"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">Target Date & Time</label>
        <input
          type="datetime-local"
          value={content.targetDate ? content.targetDate.slice(0, 16) : ''}
          onChange={(e) => onChange({ ...content, targetDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
          className="input-field text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">Expired Message</label>
        <input
          type="text"
          value={content.expiredMessage ?? ''}
          onChange={(e) => onChange({ ...content, expiredMessage: e.target.value })}
          className="input-field text-sm"
          placeholder="We have launched!"
        />
      </div>
    </div>
  )
}
