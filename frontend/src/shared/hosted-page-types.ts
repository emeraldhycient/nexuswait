// ─── Section types ───────────────────────────────────

export type SectionType = 'hero' | 'features' | 'social-proof' | 'countdown' | 'faq' | 'custom-text'

export interface SectionBase {
  id: string
  type: SectionType
  label: string
  enabled: boolean
}

export interface HeroContent {
  headline: string
  subtitle: string
  ctaText: string
  badgeText?: string
}

export interface FeatureItem {
  id: string
  title: string
  description: string
  icon: string
}

export interface FeaturesContent {
  heading?: string
  items: FeatureItem[]
}

export interface TestimonialItem {
  id: string
  quote: string
  author: string
  role?: string
  avatarUrl?: string
}

export interface SocialProofContent {
  heading?: string
  items: TestimonialItem[]
}

export interface CountdownContent {
  heading?: string
  targetDate: string
  expiredMessage?: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface FaqContent {
  heading?: string
  items: FaqItem[]
}

export interface CustomTextContent {
  heading?: string
  body: string
}

// Discriminated union section
export type Section =
  | (SectionBase & { type: 'hero'; content: HeroContent })
  | (SectionBase & { type: 'features'; content: FeaturesContent })
  | (SectionBase & { type: 'social-proof'; content: SocialProofContent })
  | (SectionBase & { type: 'countdown'; content: CountdownContent })
  | (SectionBase & { type: 'faq'; content: FaqContent })
  | (SectionBase & { type: 'custom-text'; content: CustomTextContent })

// ─── Form config ─────────────────────────────────────

export interface FormConfig {
  ctaText: string
  placeholder?: string
  showNameField?: boolean
  namePlaceholder?: string
  consentText?: string
}

// ─── Success config ──────────────────────────────────

export interface SuccessConfig {
  message: string
  showPosition?: boolean
  showReferralLink?: boolean
  redirectUrl?: string
  redirectDelay?: number
}

// ─── Theme types ─────────────────────────────────────

export interface ThemeDefinition {
  id: string
  name: string
  gradientFrom: string
  gradientTo: string
  isDark: boolean
  previewClass: string
}

export interface ThemeOverrides {
  primaryColor: string
  headingFont: string
  bodyFont: string
}

export interface ResolvedTheme {
  id: string
  name: string
  gradientFrom: string
  gradientTo: string
  isDark: boolean
  primaryColor: string
  headingFont: string
  bodyFont: string
  textColor: string
  mutedColor: string
  surfaceColor: string
  borderColor: string
}

// ─── Full page config ────────────────────────────────

export interface HostedPageData {
  id: string
  slug: string
  customDomain?: string
  title: string
  metaDescription?: string
  ogImageUrl?: string
  themeId: string
  themeOverrides?: ThemeOverrides
  sections: Section[]
  formConfig: FormConfig
  successConfig: SuccessConfig
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  projectId: string
}

export interface PublicPageResponse {
  slug: string
  title: string
  metaDescription?: string
  ogImageUrl?: string
  themeId: string
  themeOverrides?: ThemeOverrides
  sections: Section[]
  formConfig: FormConfig
  successConfig: SuccessConfig
  projectId: string
}

// ─── Default content factories ───────────────────────

export function defaultHeroContent(): HeroContent {
  return { headline: '', subtitle: '', ctaText: 'Join the Waitlist', badgeText: 'NOW ACCEPTING SIGNUPS' }
}

export function defaultFeaturesContent(): FeaturesContent {
  return { heading: 'Why Join?', items: [] }
}

export function defaultSocialProofContent(): SocialProofContent {
  return { heading: 'What People Say', items: [] }
}

export function defaultCountdownContent(): CountdownContent {
  return { heading: 'Launching Soon', targetDate: '', expiredMessage: 'We have launched!' }
}

export function defaultFaqContent(): FaqContent {
  return { heading: 'Frequently Asked Questions', items: [] }
}

export function defaultCustomTextContent(): CustomTextContent {
  return { heading: '', body: '' }
}

export function defaultContentForType(type: SectionType) {
  switch (type) {
    case 'hero': return defaultHeroContent()
    case 'features': return defaultFeaturesContent()
    case 'social-proof': return defaultSocialProofContent()
    case 'countdown': return defaultCountdownContent()
    case 'faq': return defaultFaqContent()
    case 'custom-text': return defaultCustomTextContent()
  }
}

export function defaultFormConfig(): FormConfig {
  return { ctaText: 'Join the Waitlist', placeholder: 'you@email.com', showNameField: false, namePlaceholder: 'Your name' }
}

export function defaultSuccessConfig(): SuccessConfig {
  return { message: "You're on the list!", showPosition: true, showReferralLink: true }
}
