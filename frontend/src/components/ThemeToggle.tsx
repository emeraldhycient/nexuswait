import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface ThemeToggleProps {
  /** Compact mode for sidebar/nav where space is tight (icon only) */
  compact?: boolean
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { mode, setMode } = useTheme()

  // Toggle: dark <-> light
  function cycle() {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }

  const icon = mode === 'dark'
    ? <Moon size={compact ? 16 : 18} />
    : <Sun size={compact ? 16 : 18} />

  const label = mode === 'dark' ? 'Dark' : 'Light'

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex items-center gap-2 p-2 rounded-lg text-nexus-400 hover:text-nexus-100 hover:bg-nexus-700/30 transition-colors"
      title={`Theme: ${label}. Click to switch.`}
      aria-label={`Switch theme. Current: ${label}`}
    >
      {icon}
      {!compact && <span className="text-xs font-mono">{label}</span>}
    </button>
  )
}
