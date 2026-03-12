import { Plus, Trash2 } from 'lucide-react'
import type { FaqContent, FaqItem } from '../../../shared/hosted-page-types'

interface FaqEditorProps {
  content: FaqContent
  onChange: (content: FaqContent) => void
}

export function FaqEditor({ content, onChange }: FaqEditorProps) {
  const updateItem = (id: string, patch: Partial<FaqItem>) => {
    onChange({
      ...content,
      items: content.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })
  }

  const addItem = () => {
    onChange({
      ...content,
      items: [...content.items, { id: `faq-${Date.now()}`, question: '', answer: '' }],
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
          placeholder="Frequently Asked Questions"
        />
      </div>

      {content.items.map((item, idx) => (
        <div key={item.id} className="p-3 rounded-lg bg-nexus-700/15 border border-nexus-700/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-nexus-500">Q{idx + 1}</span>
            <button type="button" onClick={() => removeItem(item.id)} className="text-nexus-600 hover:text-magenta-glow">
              <Trash2 size={12} />
            </button>
          </div>
          <input
            type="text"
            value={item.question}
            onChange={(e) => updateItem(item.id, { question: e.target.value })}
            className="input-field text-xs"
            placeholder="Question"
          />
          <textarea
            value={item.answer}
            onChange={(e) => updateItem(item.id, { answer: e.target.value })}
            rows={2}
            className="input-field text-xs resize-none"
            placeholder="Answer"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-nexus-600 text-xs text-nexus-500 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all"
      >
        <Plus size={12} /> Add Question
      </button>
    </div>
  )
}
