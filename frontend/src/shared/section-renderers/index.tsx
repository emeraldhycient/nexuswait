import type { Section, ResolvedTheme } from '../hosted-page-types'
import { HeroSection } from './HeroSection'
import { FeaturesSection } from './FeaturesSection'
import { SocialProofSection } from './SocialProofSection'
import { CountdownSection } from './CountdownSection'
import { FaqSection } from './FaqSection'
import { CustomTextSection } from './CustomTextSection'

export { HeroSection, FeaturesSection, SocialProofSection, CountdownSection, FaqSection, CustomTextSection }

// ─── Dispatcher ──────────────────────────────────────

interface SectionRendererProps {
  section: Section
  theme: ResolvedTheme
  /** Optional children injected into hero (WaitlistSignupForm) */
  heroChildren?: React.ReactNode
}

export function SectionRenderer({ section, theme, heroChildren }: SectionRendererProps) {
  if (!section.enabled) return null

  switch (section.type) {
    case 'hero':
      return <HeroSection content={section.content} theme={theme}>{heroChildren}</HeroSection>
    case 'features':
      return <FeaturesSection content={section.content} theme={theme} />
    case 'social-proof':
      return <SocialProofSection content={section.content} theme={theme} />
    case 'countdown':
      return <CountdownSection content={section.content} theme={theme} />
    case 'faq':
      return <FaqSection content={section.content} theme={theme} />
    case 'custom-text':
      return <CustomTextSection content={section.content} theme={theme} />
    default:
      return null
  }
}
