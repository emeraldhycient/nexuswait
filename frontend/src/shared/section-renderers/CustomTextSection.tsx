import type { CustomTextContent, ResolvedTheme } from '../hosted-page-types'

interface CustomTextSectionProps {
  content: CustomTextContent
  theme: ResolvedTheme
}

export function CustomTextSection({ content, theme }: CustomTextSectionProps) {
  if (!content.heading && !content.body) return null

  return (
    <section className="py-16 px-6">
      <div className="max-w-2xl mx-auto">
        {content.heading && (
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {content.heading}
          </h2>
        )}
        {content.body && (
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.mutedColor }}
          >
            {content.body}
          </div>
        )}
      </div>
    </section>
  )
}
