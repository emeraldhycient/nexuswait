import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })

  // Calculate position above the button
  const updatePosition = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [])

  // Open handler: compute position then open
  const handleToggle = () => {
    if (!open) updatePosition()
    setOpen(!open)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

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

  // Compute the height of the dropdown to position it above the button
  const dropdownHeight = SECTION_TYPES.length * 52 + 16 // rough estimate

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] card-surface p-2 rounded-lg shadow-xl border border-cyan-glow/10 animate-fade-in"
          style={{
            top: Math.max(8, pos.top - dropdownHeight - 8),
            left: pos.left,
            width: pos.width,
          }}
        >
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
        </div>,
        document.body,
      )
    : null

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-nexus-600 text-xs text-nexus-500 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all"
      >
        <Plus size={13} /> Add Section
      </button>
      {dropdown}
    </div>
  )
}
