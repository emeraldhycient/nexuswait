import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FaqContent, ResolvedTheme } from '../hosted-page-types'

interface FaqSectionProps {
  content: FaqContent
  theme: ResolvedTheme
}

export function FaqSection({ content, theme }: FaqSectionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  if (!content.items || content.items.length === 0) return null

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="py-16 px-6">
      {content.heading && (
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-10"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
        >
          {content.heading}
        </h2>
      )}

      <div className="max-w-2xl mx-auto space-y-3">
        {content.items.map((item) => {
          const isOpen = openIds.has(item.id)
          return (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden"
              style={{ background: theme.surfaceColor, border: `1px solid ${theme.borderColor}` }}
            >
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
                style={{ color: theme.textColor }}
              >
                <span
                  className="text-sm font-semibold pr-4"
                  style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
                >
                  {item.question}
                </span>
                <ChevronDown
                  size={16}
                  className="shrink-0 transition-transform duration-200"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: theme.mutedColor }}
                />
              </button>
              {isOpen && (
                <div
                  className="px-5 pb-4 text-sm leading-relaxed"
                  style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.mutedColor }}
                >
                  {item.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
