import { Link } from 'react-router-dom'

export type LogoSize = 'small' | 'default' | 'large'

export interface LogoProps {
  size?: LogoSize
}

const sizeClasses: Record<LogoSize, string> = {
  small: 'text-lg',
  default: 'text-xl',
  large: 'text-3xl',
}

export default function Logo({ size = 'default' }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-2 no-underline group`}>
      <div className="relative">
        <svg
          width={size === 'large' ? 40 : size === 'small' ? 24 : 30}
          height={size === 'large' ? 40 : size === 'small' ? 24 : 30}
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M20 2L36 11V29L20 38L4 29V11L20 2Z"
            stroke="url(#logoGrad)"
            strokeWidth="1.5"
            style={{ fill: 'color-mix(in srgb, var(--color-cyan-glow) 5%, transparent)' }}
          />
          <path
            d="M20 8L30 14V26L20 32L10 26V14L20 8Z"
            stroke="url(#logoGrad)"
            strokeWidth="1"
            style={{ fill: 'color-mix(in srgb, var(--color-cyan-glow) 8%, transparent)' }}
            className="transition-all duration-500"
          />
          <circle cx="20" cy="20" r="3" fill="url(#logoGrad)" className="transition-all" />
          <line x1="20" y1="17" x2="20" y2="8" style={{ stroke: 'color-mix(in srgb, var(--color-cyan-glow) 40%, transparent)' }} strokeWidth="0.5" />
          <line x1="22.6" y1="18.5" x2="30" y2="14" style={{ stroke: 'color-mix(in srgb, var(--color-cyan-glow) 40%, transparent)' }} strokeWidth="0.5" />
          <line x1="22.6" y1="21.5" x2="30" y2="26" style={{ stroke: 'color-mix(in srgb, var(--color-cyan-glow) 40%, transparent)' }} strokeWidth="0.5" />
          <line x1="20" y1="23" x2="20" y2="32" style={{ stroke: 'color-mix(in srgb, var(--color-cyan-glow) 40%, transparent)' }} strokeWidth="0.5" />
          <line x1="17.4" y1="21.5" x2="10" y2="26" style={{ stroke: 'color-mix(in srgb, var(--color-cyan-glow) 40%, transparent)' }} strokeWidth="0.5" />
          <line x1="17.4" y1="18.5" x2="10" y2="14" style={{ stroke: 'color-mix(in srgb, var(--color-cyan-glow) 40%, transparent)' }} strokeWidth="0.5" />
          <defs>
            <linearGradient id="logoGrad" x1="4" y1="2" x2="36" y2="38">
              <stop style={{ stopColor: 'var(--color-cyan-glow)' }} />
              <stop offset="1" style={{ stopColor: 'var(--color-magenta-glow)' }} />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className={`font-display font-black tracking-wider ${sizeClasses[size]}`}>
        <span className="text-cyan-glow">NEXUS</span>
        <span className="text-nexus-300">WAIT</span>
      </span>
    </Link>
  )
}
