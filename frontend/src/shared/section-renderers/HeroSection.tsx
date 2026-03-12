import type { HeroContent, ResolvedTheme } from '../hosted-page-types'

interface HeroSectionProps {
  content: HeroContent
  theme: ResolvedTheme
  children?: React.ReactNode          // Slot for WaitlistSignupForm
}

export function HeroSection({ content, theme, children }: HeroSectionProps) {
  return (
    <section className="relative py-20 px-6 text-center">
      {content.badgeText && (
        <div
          className="inline-block text-xs font-bold tracking-[0.25em] uppercase px-4 py-1.5 rounded-full mb-6"
          style={{
            background: `${theme.primaryColor}15`,
            color: theme.primaryColor,
            border: `1px solid ${theme.primaryColor}30`,
          }}
        >
          {content.badgeText}
        </div>
      )}

      <h1
        className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight max-w-3xl mx-auto"
        style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
      >
        {content.headline || 'Your Headline Here'}
      </h1>

      {content.subtitle && (
        <p
          className="mt-4 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.mutedColor }}
        >
          {content.subtitle}
        </p>
      )}

      {children && <div className="mt-8 max-w-md mx-auto">{children}</div>}
    </section>
  )
}
