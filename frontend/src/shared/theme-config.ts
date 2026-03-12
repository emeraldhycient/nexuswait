import type { ThemeDefinition, ThemeOverrides, ResolvedTheme } from './hosted-page-types'

export const THEMES: ThemeDefinition[] = [
  { id: 'nexus-dark', name: 'Nexus Dark', gradientFrom: '#0a0a14', gradientTo: '#1a1a2e', isDark: true, previewClass: 'bg-gradient-to-br from-[#0a0a14] to-[#1a1a2e]' },
  { id: 'aurora', name: 'Aurora', gradientFrom: '#0f172a', gradientTo: '#1e3a5f', isDark: true, previewClass: 'bg-gradient-to-br from-[#0f172a] to-[#1e3a5f]' },
  { id: 'ember', name: 'Ember', gradientFrom: '#1a0a0a', gradientTo: '#2e1a1a', isDark: true, previewClass: 'bg-gradient-to-br from-[#1a0a0a] to-[#2e1a1a]' },
  { id: 'frost', name: 'Frost', gradientFrom: '#f0f4f8', gradientTo: '#d9e2ec', isDark: false, previewClass: 'bg-gradient-to-br from-[#f0f4f8] to-[#d9e2ec]' },
  { id: 'minimal-light', name: 'Minimal Light', gradientFrom: '#ffffff', gradientTo: '#f5f5f5', isDark: false, previewClass: 'bg-gradient-to-br from-white to-[#f5f5f5]' },
  { id: 'midnight', name: 'Midnight', gradientFrom: '#0d0d1a', gradientTo: '#1a1a3e', isDark: true, previewClass: 'bg-gradient-to-br from-[#0d0d1a] to-[#1a1a3e]' },
]

export const HEADING_FONTS = ['Orbitron', 'Inter', 'Poppins', 'Space Grotesk', 'DM Sans', 'Montserrat', 'Playfair Display']
export const BODY_FONTS = ['Rajdhani', 'Inter', 'DM Sans', 'Source Sans Pro', 'Nunito', 'Lato']

export function resolveTheme(themeId: string, overrides?: ThemeOverrides): ResolvedTheme {
  const base = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const primaryColor = overrides?.primaryColor ?? '#00e8ff'
  const headingFont = overrides?.headingFont ?? 'Orbitron'
  const bodyFont = overrides?.bodyFont ?? 'Rajdhani'

  return {
    id: base.id,
    name: base.name,
    gradientFrom: base.gradientFrom,
    gradientTo: base.gradientTo,
    isDark: base.isDark,
    primaryColor,
    headingFont,
    bodyFont,
    textColor: base.isDark ? '#ffffff' : '#1a1a2e',
    mutedColor: base.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
    surfaceColor: base.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderColor: base.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  }
}

export function buildGoogleFontsUrl(fonts: string[]): string {
  const unique = [...new Set(fonts)].filter(Boolean)
  if (unique.length === 0) return ''
  const families = unique.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900`).join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}
