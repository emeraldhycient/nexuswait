import { Plus, Trash2 } from 'lucide-react'
import type { SocialProofContent, TestimonialItem } from '../../../shared/hosted-page-types'

interface SocialProofEditorProps {
  content: SocialProofContent
  onChange: (content: SocialProofContent) => void
}

export function SocialProofEditor({ content, onChange }: SocialProofEditorProps) {
  const updateItem = (id: string, patch: Partial<TestimonialItem>) => {
    onChange({
      ...content,
      items: content.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })
  }

  const addItem = () => {
    onChange({
      ...content,
      items: [
        ...content.items,
        { id: `test-${Date.now()}`, quote: '', author: '', role: '' },
      ],
    })
  }

  const removeItem = (id: string) => {
    onChange({ ...content, items: content.items.filter((item) => item.id !== id) })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1">Section Heading</label>
        <input
          type="text"
          value={content.heading ?? ''}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          className="input-field text-sm"
          placeholder="What People Say"
        />
      </div>

      {content.items.map((item, idx) => (
        <div key={item.id} className="p-3 rounded-lg bg-nexus-700/15 border border-nexus-700/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-nexus-500">Testimonial {idx + 1}</span>
            <button type="button" onClick={() => removeItem(item.id)} className="text-nexus-600 hover:text-magenta-glow">
              <Trash2 size={12} />
            </button>
          </div>
          <textarea
            value={item.quote}
            onChange={(e) => updateItem(item.id, { quote: e.target.value })}
            rows={2}
            className="input-field text-xs resize-none"
            placeholder="What they said..."
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={item.author}
              onChange={(e) => updateItem(item.id, { author: e.target.value })}
              className="input-field text-xs"
              placeholder="Name"
            />
            <input
              type="text"
              value={item.role ?? ''}
              onChange={(e) => updateItem(item.id, { role: e.target.value })}
              className="input-field text-xs"
              placeholder="Role / Company"
            />
          </div>
          <input
            type="url"
            value={item.avatarUrl ?? ''}
            onChange={(e) => updateItem(item.id, { avatarUrl: e.target.value })}
            className="input-field text-xs"
            placeholder="Avatar URL (optional)"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-nexus-600 text-xs text-nexus-500 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all"
      >
        <Plus size={12} /> Add Testimonial
      </button>
    </div>
  )
}
