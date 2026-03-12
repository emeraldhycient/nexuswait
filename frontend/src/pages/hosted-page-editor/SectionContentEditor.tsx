import type { Section } from '../../shared/hosted-page-types'
import { HeroEditor } from './editors/HeroEditor'
import { FeaturesEditor } from './editors/FeaturesEditor'
import { SocialProofEditor } from './editors/SocialProofEditor'
import { CountdownEditor } from './editors/CountdownEditor'
import { FaqEditor } from './editors/FaqEditor'
import { CustomTextEditor } from './editors/CustomTextEditor'

interface SectionContentEditorProps {
  section: Section
  onChange: (section: Section) => void
}

export function SectionContentEditor({ section, onChange }: SectionContentEditorProps) {
  const updateContent = (content: Section['content']) => {
    onChange({ ...section, content } as Section)
  }

  switch (section.type) {
    case 'hero':
      return <HeroEditor content={section.content} onChange={updateContent} />
    case 'features':
      return <FeaturesEditor content={section.content} onChange={updateContent} />
    case 'social-proof':
      return <SocialProofEditor content={section.content} onChange={updateContent} />
    case 'countdown':
      return <CountdownEditor content={section.content} onChange={updateContent} />
    case 'faq':
      return <FaqEditor content={section.content} onChange={updateContent} />
    case 'custom-text':
      return <CustomTextEditor content={section.content} onChange={updateContent} />
    default:
      return <p className="text-xs text-nexus-500">No editor available for this section type.</p>
  }
}
