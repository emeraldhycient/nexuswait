import { useState, useEffect } from 'react'
import type { CountdownContent, ResolvedTheme } from '../hosted-page-types'

interface CountdownSectionProps {
  content: CountdownContent
  theme: ResolvedTheme
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calcTimeLeft(target: string): TimeLeft | null {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function CountdownSection({ content, theme }: CountdownSectionProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    content.targetDate ? calcTimeLeft(content.targetDate) : null,
  )

  useEffect(() => {
    if (!content.targetDate) return
    setTimeLeft(calcTimeLeft(content.targetDate))
    const id = setInterval(() => {
      setTimeLeft(calcTimeLeft(content.targetDate))
    }, 1000)
    return () => clearInterval(id)
  }, [content.targetDate])

  if (!content.targetDate) return null

  const expired = timeLeft === null

  const boxes: { label: string; value: number }[] = expired
    ? []
    : [
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds },
      ]

  return (
    <section className="py-16 px-6 text-center">
      {content.heading && (
        <h2
          className="text-2xl md:text-3xl font-bold mb-8"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
        >
          {content.heading}
        </h2>
      )}

      {expired ? (
        <p
          className="text-lg font-semibold"
          style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.primaryColor }}
        >
          {content.expiredMessage || 'The countdown has ended!'}
        </p>
      ) : (
        <div className="flex justify-center gap-4">
          {boxes.map((b) => (
            <div
              key={b.label}
              className="rounded-xl px-5 py-4 min-w-[80px]"
              style={{ background: theme.surfaceColor, border: `1px solid ${theme.borderColor}` }}
            >
              <div
                className="text-3xl md:text-4xl font-black tabular-nums"
                style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
              >
                {String(b.value).padStart(2, '0')}
              </div>
              <div
                className="text-xs uppercase tracking-widest mt-1"
                style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.mutedColor }}
              >
                {b.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
