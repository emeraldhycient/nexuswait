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
            fill="rgba(0,232,255,0.05)"
          />
          <path
            d="M20 8L30 14V26L20 32L10 26V14L20 8Z"
            stroke="url(#logoGrad)"
            strokeWidth="1"
            fill="rgba(0,232,255,0.08)"
            className="group-hover:fill-[rgba(0,232,255,0.15)] transition-all duration-500"
          />
          <circle cx="20" cy="20" r="3" fill="url(#logoGrad)" className="group-hover:r-4 transition-all" />
          <line x1="20" y1="17" x2="20" y2="8" stroke="rgba(0,232,255,0.4)" strokeWidth="0.5" />
          <line x1="22.6" y1="18.5" x2="30" y2="14" stroke="rgba(0,232,255,0.4)" strokeWidth="0.5" />
          <line x1="22.6" y1="21.5" x2="30" y2="26" stroke="rgba(0,232,255,0.4)" strokeWidth="0.5" />
          <line x1="20" y1="23" x2="20" y2="32" stroke="rgba(0,232,255,0.4)" strokeWidth="0.5" />
          <line x1="17.4" y1="21.5" x2="10" y2="26" stroke="rgba(0,232,255,0.4)" strokeWidth="0.5" />
          <line x1="17.4" y1="18.5" x2="10" y2="14" stroke="rgba(0,232,255,0.4)" strokeWidth="0.5" />
          <defs>
            <linearGradient id="logoGrad" x1="4" y1="2" x2="36" y2="38">
              <stop stopColor="#00e8ff" />
              <stop offset="1" stopColor="#ff2daa" />
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
