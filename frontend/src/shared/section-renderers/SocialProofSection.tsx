import { Quote } from 'lucide-react'
import type { SocialProofContent, ResolvedTheme } from '../hosted-page-types'

interface SocialProofSectionProps {
  content: SocialProofContent
  theme: ResolvedTheme
}

export function SocialProofSection({ content, theme }: SocialProofSectionProps) {
  if (!content.items || content.items.length === 0) return null

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {content.items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl p-6 flex flex-col"
            style={{ background: theme.surfaceColor, border: `1px solid ${theme.borderColor}` }}
          >
            <Quote size={20} style={{ color: `${theme.primaryColor}60` }} className="mb-3 shrink-0" />
            <p
              className="text-sm leading-relaxed flex-1"
              style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.textColor }}
            >
              &ldquo;{item.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${theme.borderColor}` }}>
              {item.avatarUrl ? (
                <img src={item.avatarUrl} alt={item.author} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: `${theme.primaryColor}20`, color: theme.primaryColor }}
                >
                  {item.author.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold" style={{ color: theme.textColor }}>{item.author}</div>
                {item.role && (
                  <div className="text-xs" style={{ color: theme.mutedColor }}>{item.role}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
