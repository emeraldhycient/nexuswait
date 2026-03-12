import { Zap, Shield, Rocket, BarChart3, Globe, Heart, Star, Award, Layers, Lock } from 'lucide-react'
import type { FeaturesContent, ResolvedTheme } from '../hosted-page-types'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap, shield: Shield, rocket: Rocket, chart: BarChart3,
  globe: Globe, heart: Heart, star: Star, award: Award,
  layers: Layers, lock: Lock,
}

interface FeaturesSectionProps {
  content: FeaturesContent
  theme: ResolvedTheme
}

export function FeaturesSection({ content, theme }: FeaturesSectionProps) {
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
        {content.items.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? Zap
          return (
            <div
              key={item.id}
              className="rounded-xl p-6 transition-all"
              style={{ background: theme.surfaceColor, border: `1px solid ${theme.borderColor}` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}
              >
                <Icon size={20} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
              >
                {item.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.mutedColor }}
              >
                {item.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
