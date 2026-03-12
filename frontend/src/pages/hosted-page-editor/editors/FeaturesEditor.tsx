import { Plus, Trash2 } from 'lucide-react'
import type { FeaturesContent, FeatureItem } from '../../../shared/hosted-page-types'

const ICON_OPTIONS = ['zap', 'shield', 'rocket', 'chart', 'globe', 'heart', 'star', 'award', 'layers', 'lock']

interface FeaturesEditorProps {
  content: FeaturesContent
  onChange: (content: FeaturesContent) => void
}

export function FeaturesEditor({ content, onChange }: FeaturesEditorProps) {
  const updateItem = (id: string, patch: Partial<FeatureItem>) => {
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
        { id: `feat-${Date.now()}`, title: '', description: '', icon: 'zap' },
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
          placeholder="Why Join?"
        />
      </div>

      {content.items.map((item, idx) => (
        <div key={item.id} className="p-3 rounded-lg bg-nexus-700/15 border border-nexus-700/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-nexus-500">Feature {idx + 1}</span>
            <button type="button" onClick={() => removeItem(item.id)} className="text-nexus-600 hover:text-magenta-glow">
              <Trash2 size={12} />
            </button>
          </div>
          <input
            type="text"
            value={item.title}
            onChange={(e) => updateItem(item.id, { title: e.target.value })}
            className="input-field text-xs"
            placeholder="Feature title"
          />
          <input
            type="text"
            value={item.description}
            onChange={(e) => updateItem(item.id, { description: e.target.value })}
            className="input-field text-xs"
            placeholder="Short description"
          />
          <select
            value={item.icon}
            onChange={(e) => updateItem(item.id, { icon: e.target.value })}
            className="input-field text-xs"
          >
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-nexus-600 text-xs text-nexus-500 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all"
      >
        <Plus size={12} /> Add Feature
      </button>
    </div>
  )
}
