import type { CustomTextContent } from '../../../shared/hosted-page-types'

interface CustomTextEditorProps {
  content: CustomTextContent
  onChange: (content: CustomTextContent) => void
}

export function CustomTextEditor({ content, onChange }: CustomTextEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">Heading</label>
        <input
          type="text"
          value={content.heading ?? ''}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          className="input-field text-sm"
          placeholder="Section heading"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">Body</label>
        <textarea
          value={content.body}
          onChange={(e) => onChange({ ...content, body: e.target.value })}
          rows={5}
          className="input-field text-sm resize-none"
          placeholder="Write your content here..."
        />
      </div>
    </div>
  )
}
