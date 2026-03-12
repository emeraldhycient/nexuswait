import { useState, useRef, useEffect } from 'react'
import { Plus, Zap, BarChart3, MessageSquare, Timer, HelpCircle, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SectionType, Section } from '../../shared/hosted-page-types'
import { defaultContentForType } from '../../shared/hosted-page-types'

const SECTION_TYPES: { type: SectionType; label: string; icon: LucideIcon; description: string }[] = [
  { type: 'hero', label: 'Hero', icon: Zap, description: 'Headline, subtitle & signup form' },
  { type: 'features', label: 'Features', icon: BarChart3, description: 'Feature cards grid' },
  { type: 'social-proof', label: 'Social Proof', icon: MessageSquare, description: 'Testimonials & quotes' },
  { type: 'countdown', label: 'Countdown', icon: Timer, description: 'Launch countdown timer' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Questions & answers' },
  { type: 'custom-text', label: 'Custom Text', icon: FileText, description: 'Free-form text block' },
]

interface SectionPickerProps {
  existingSections: Section[]
  onAdd: (section: Section) => void
}

export function SectionPicker({ existingSections, onAdd }: SectionPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const hasHero = existingSections.some((s) => s.type === 'hero')

  function handleSelect(type: SectionType) {
    const newSection: Section = {
      id: `sec-${Date.now()}`,
      type,
      label: SECTION_TYPES.find((t) => t.type === type)?.label ?? type,
      enabled: true,
      content: defaultContentForType(type),
    } as Section
    onAdd(newSection)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-nexus-600 text-xs text-nexus-500 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all"
      >
        <Plus size={13} /> Add Section
      </button>

      {open && (
        <div className="absolute z-20 bottom-full mb-2 left-0 right-0 card-surface p-2 rounded-lg shadow-xl border border-cyan-glow/10 animate-fade-in">
          {SECTION_TYPES.map(({ type, label, icon: Icon, description }) => {
            const disabled = type === 'hero' && hasHero
            return (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(type)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-md text-left transition-all ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-cyan-glow/5'
                }`}
              >
                <Icon size={14} className="text-cyan-glow shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-nexus-200">{label}</div>
                  <div className="text-[10px] text-nexus-500">{description}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
