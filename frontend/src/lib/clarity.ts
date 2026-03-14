/**
 * Microsoft Clarity integration: session recordings, heatmaps, and custom events.
 * Set VITE_CLARITY_PROJECT_ID in .env to enable. All tracking is no-op when not set.
 */
import Clarity from '@microsoft/clarity'

const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined

export function initClarity(): void {
  if (typeof window === 'undefined' || !projectId?.trim()) return
  try {
    Clarity.init(projectId.trim())
  } catch {
    // ignore
  }
}

function guard(fn: () => void): void {
  if (typeof window === 'undefined' || !projectId?.trim()) return
  const w = window as Window & { clarity?: (...args: unknown[]) => void }
  if (typeof w.clarity !== 'function') return
  try {
    fn()
  } catch {
    // ignore
  }
}

/**
 * Identify the current user so sessions can be attributed. Call after login.
 * Uses hashed IDs client-side; pass a friendly name for the dashboard.
 */
export function identifyUser(
  userId: string,
  friendlyName?: string | null,
  tags?: Record<string, string>,
): void {
  guard(() => {
    Clarity.identify(userId, undefined, undefined, friendlyName ?? undefined)
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        if (value != null && value !== '') Clarity.setTag(key, value)
      })
    }
  })
}

/**
 * Set a custom tag (key/value) for the current session.
 */
export function setClarityTag(key: string, value: string): void {
  guard(() => Clarity.setTag(key, value))
}

/**
 * Track a custom event for key metrics. Use snake_case names.
 */
export function clarityEvent(eventName: string): void {
  guard(() => Clarity.event(eventName))
}
