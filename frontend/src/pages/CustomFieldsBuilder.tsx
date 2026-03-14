import { useState } from 'react'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'
import type { CustomFieldDefinition, CustomFieldType } from '../shared/hosted-page-types'

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'url', label: 'URL' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
]

function generateId(): string {
  return 'cf_' + Math.random().toString(36).slice(2, 10)
}

function labelToFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 64)
}

interface CustomFieldsBuilderProps {
  fields: CustomFieldDefinition[]
  onChange: (fields: CustomFieldDefinition[]) => void
}

export function CustomFieldsBuilder({ fields, onChange }: CustomFieldsBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const addField = () => {
    const newField: CustomFieldDefinition = {
      id: generateId(),
      label: '',
      fieldKey: '',
      placeholder: '',
      type: 'text',
      required: false,
    }
    onChange([...fields, newField])
    setExpandedId(newField.id)
  }

  const updateField = (id: string, patch: Partial<CustomFieldDefinition>) => {
    onChange(
      fields.map((f) => {
        if (f.id !== id) return f
        const updated = { ...f, ...patch }
        // Auto-derive fieldKey when label changes
        if (patch.label !== undefined) {
          updated.fieldKey = labelToFieldKey(patch.label)
        }
        return updated
      }),
    )
  }

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const reordered = [...fields]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    onChange(reordered)
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono text-nexus-400 tracking-wider uppercase">Custom Fields</h4>
        <span className="text-[10px] font-mono text-nexus-600">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-nexus-500">No custom fields defined. Add fields to collect additional data from subscribers.</p>
      )}

      <div className="space-y-2">
        {fields.map((field, idx) => {
          const isExpanded = expandedId === field.id
          return (
            <div
              key={field.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`rounded-lg border transition-all ${
                isExpanded
                  ? 'border-cyan-glow/20 bg-nexus-800/40'
                  : 'border-nexus-700/30 bg-nexus-800/20 hover:border-nexus-600/40'
              }`}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : field.id)}
              >
                <GripVertical size={13} className="text-nexus-600 shrink-0 cursor-grab" />
                {isExpanded ? <ChevronDown size={13} className="text-nexus-500" /> : <ChevronRight size={13} className="text-nexus-500" />}
                <span className="text-sm text-nexus-200 flex-1 truncate">{field.label || 'Untitled field'}</span>
                <span className="text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-nexus-700/40 text-nexus-400">
                  {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
                </span>
                {field.required && (
                  <span className="text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-glow/10 text-amber-glow">
                    Required
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeField(field.id)
                  }}
                  className="text-nexus-600 hover:text-magenta-glow transition-colors p-0.5"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Expanded editor */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-nexus-700/20 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Label</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="input-field text-sm"
                        placeholder="e.g. Company Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Field Key</label>
                      <input
                        type="text"
                        value={field.fieldKey}
                        readOnly
                        className="input-field text-sm font-mono text-nexus-500 bg-nexus-900/30"
                        placeholder="auto-generated"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={field.placeholder}
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                        className="input-field text-sm"
                        placeholder="Enter placeholder text"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value as CustomFieldType })}
                        className="input-field text-sm"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div>
                      <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">
                        Options <span className="text-nexus-600">(one per line)</span>
                      </label>
                      <textarea
                        value={(field.options ?? []).join('\n')}
                        onChange={(e) =>
                          updateField(field.id, {
                            options: e.target.value.split('\n'),
                          })
                        }
                        onBlur={() => {
                          // Clean up empty lines when the user leaves the field
                          const cleaned = (field.options ?? []).filter((o) => o.trim())
                          updateField(field.id, { options: cleaned })
                        }}
                        rows={3}
                        className="input-field text-sm resize-none font-mono"
                        placeholder={'Option 1\nOption 2\nOption 3'}
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="rounded border-nexus-600"
                    />
                    <span className="text-xs text-nexus-300">Required field</span>
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addField}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-nexus-400 hover:text-cyan-glow py-2.5 rounded-lg border border-dashed border-nexus-700/40 hover:border-cyan-glow/30 transition-all"
      >
        <Plus size={13} /> Add Custom Field
      </button>
    </div>
  )
}
