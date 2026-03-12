import { useParams, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePublicPage, usePublicSubscriberCount } from '../api/hooks'
import { resolveTheme, buildGoogleFontsUrl } from '../shared/theme-config'
import { GoogleFontsLoader } from '../shared/GoogleFontsLoader'
import { SeoHead } from '../shared/SeoHead'
import { SectionRenderer } from '../shared/section-renderers'
import { WaitlistSignupForm } from '../shared/WaitlistSignupForm'
import type { PublicPageResponse, Section, FormConfig, SuccessConfig, ThemeOverrides, CustomFieldDefinition } from '../shared/hosted-page-types'

export default function PublicWaitlistPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref') ?? undefined

  const { data: rawPage, isLoading, error } = usePublicPage(slug)
  const page = rawPage as PublicPageResponse | undefined

  const projectId = page?.projectId
  const { data: countData } = usePublicSubscriberCount(projectId)
  const subscriberCount =
    typeof countData === 'number'
      ? countData
      : (countData as { count?: number })?.count ?? undefined

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <Loader2 size={28} className="animate-spin text-cyan-400" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a14] text-white px-6">
        <h1 className="text-4xl font-black mb-3" style={{ fontFamily: "'Orbitron', sans-serif" }}>404</h1>
        <p className="text-white/50 text-sm">This page doesn't exist or isn't published yet.</p>
      </div>
    )
  }

  const sections = (page.sections ?? []) as Section[]
  const formConfig = (page.formConfig ?? { ctaText: 'Join the Waitlist' }) as FormConfig
  const successConfig = (page.successConfig ?? { message: "You're on the list!" }) as SuccessConfig
  const themeOverrides = page.themeOverrides as ThemeOverrides | undefined
  const theme = resolveTheme(page.themeId ?? 'nexus-dark', themeOverrides)
  const fontsUrl = buildGoogleFontsUrl([theme.headingFont, theme.bodyFont])

  // Filter custom field definitions to only those enabled in formConfig
  const allCustomFields = (page.customFields ?? []) as CustomFieldDefinition[]
  const enabledFieldIds = formConfig.customFields ?? []
  const activeCustomFieldDefs = enabledFieldIds.length > 0
    ? enabledFieldIds
        .map((id) => allCustomFields.find((f) => f.id === id))
        .filter((f): f is CustomFieldDefinition => !!f)
    : []

  const signupForm = (
    <WaitlistSignupForm
      formConfig={formConfig}
      successConfig={successConfig}
      projectId={projectId!}
      theme={theme}
      referralCode={ref}
      subscriberCount={subscriberCount}
      customFieldDefs={activeCustomFieldDefs}
    />
  )

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
        fontFamily: `'${theme.bodyFont}', sans-serif`,
      }}
    >
      <GoogleFontsLoader url={fontsUrl} />
      <SeoHead
        title={page.title ?? 'Waitlist'}
        description={page.metaDescription}
        ogImage={page.ogImageUrl}
        slug={slug}
      />

      <div className="max-w-5xl mx-auto">
        {sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            theme={theme}
            heroChildren={section.type === 'hero' ? signupForm : undefined}
          />
        ))}

        {/* If no hero section exists, show a standalone signup form */}
        {!sections.some((s) => s.type === 'hero' && s.enabled) && (
          <div className="py-20 px-6 max-w-md mx-auto">
            {signupForm}
          </div>
        )}
      </div>

      <footer className="py-8 text-center">
        <span className="text-[10px] tracking-widest uppercase" style={{ color: theme.mutedColor }}>
          Powered by NexusWait
        </span>
      </footer>
    </div>
  )
}
