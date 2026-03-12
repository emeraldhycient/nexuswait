import type { Section, FormConfig, SuccessConfig, ResolvedTheme, CustomFieldDefinition } from '../../shared/hosted-page-types'
import { SectionRenderer } from '../../shared/section-renderers'
import { WaitlistSignupForm } from '../../shared/WaitlistSignupForm'
import { GoogleFontsLoader } from '../../shared/GoogleFontsLoader'
import { buildGoogleFontsUrl } from '../../shared/theme-config'

interface EditorPreviewProps {
  sections: Section[]
  formConfig: FormConfig
  successConfig: SuccessConfig
  theme: ResolvedTheme
  projectId?: string
  customFieldDefs?: CustomFieldDefinition[]
}

export function EditorPreview({ sections, formConfig, successConfig, theme, projectId, customFieldDefs }: EditorPreviewProps) {
  const fontsUrl = buildGoogleFontsUrl([theme.headingFont, theme.bodyFont])

  const signupForm = (
    <WaitlistSignupForm
      formConfig={formConfig}
      successConfig={successConfig}
      projectId={projectId ?? ''}
      isPreview
      theme={theme}
      customFieldDefs={customFieldDefs}
    />
  )

  const enabledSections = sections.filter((s) => s.enabled)

  return (
    <div
      className="rounded-lg overflow-hidden min-h-[460px]"
      style={{
        background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
        fontFamily: `'${theme.bodyFont}', sans-serif`,
      }}
    >
      <GoogleFontsLoader url={fontsUrl} />

      {enabledSections.length === 0 ? (
        <div className="flex items-center justify-center min-h-[460px] text-center p-8">
          <p className="text-sm" style={{ color: theme.mutedColor }}>
            Enable some sections to see a preview.
          </p>
        </div>
      ) : (
        <div>
          {enabledSections.map((section) => (
            <SectionRenderer
              key={section.id}
              section={section}
              theme={theme}
              heroChildren={section.type === 'hero' ? signupForm : undefined}
            />
          ))}
          {!enabledSections.some((s) => s.type === 'hero') && (
            <div className="py-12 px-6 max-w-md mx-auto">
              {signupForm}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
