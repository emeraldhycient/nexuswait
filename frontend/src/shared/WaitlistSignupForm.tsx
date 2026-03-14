import { useState, useRef } from 'react'
import { Loader2, CheckCircle, Users, Share2, Copy, Check } from 'lucide-react'
import type { FormConfig, SuccessConfig, ResolvedTheme, CustomFieldDefinition } from './hosted-page-types'
import { api } from '../api/client'
import { clarityEvent } from '../lib/clarity'

interface WaitlistSignupFormProps {
  formConfig: FormConfig
  successConfig: SuccessConfig
  projectId: string
  isPreview?: boolean
  theme: ResolvedTheme
  referralCode?: string
  subscriberCount?: number
  customFieldDefs?: CustomFieldDefinition[]
}

interface SuccessData {
  position?: number
  referralCode?: string
}

export function WaitlistSignupForm({
  formConfig,
  successConfig,
  projectId,
  isPreview = false,
  theme,
  referralCode,
  subscriberCount,
  customFieldDefs = [],
}: WaitlistSignupFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [customValues, setCustomValues] = useState<Record<string, string | number | boolean>>({})
  const emailRef = useRef<HTMLInputElement>(null)

  const updateCustomValue = (fieldKey: string, value: string | number | boolean) => {
    setCustomValues((prev) => ({ ...prev, [fieldKey]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPreview) return

    if (!email.trim()) {
      setError('Email is required')
      emailRef.current?.focus()
      return
    }
    if (formConfig.consentText && !consent) {
      setError('Please check the consent box')
      return
    }

    // Validate required custom fields
    for (const field of customFieldDefs) {
      if (field.required) {
        const val = customValues[field.fieldKey]
        if (val === undefined || val === '' || val === false) {
          setError(`${field.label} is required`)
          return
        }
      }
    }

    setError('')
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { email: email.trim() }
      if (formConfig.showNameField && name.trim()) body.name = name.trim()

      // Add custom field values as metadata
      if (customFieldDefs.length > 0) {
        const metadata: Record<string, unknown> = {}
        for (const field of customFieldDefs) {
          const val = customValues[field.fieldKey]
          if (val !== undefined && val !== '') {
            metadata[field.fieldKey] = val
          }
        }
        if (Object.keys(metadata).length > 0) {
          body.metadata = metadata
        }
      }

      // Pass referral code as query param (backend reads @Query('ref'))
      const refParam = referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ''
      const { data } = await api.post(`/projects/${projectId}/subscribers${refParam}`, body)
      clarityEvent('waitlist_signup')
      setSuccess({
        position: data?.position ?? data?._count,
        referralCode: data?.referralCode,
      })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  function buildShareUrl(code: string) {
    return `${window.location.origin}${window.location.pathname}?ref=${code}`
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle = {
    background: theme.surfaceColor,
    border: `1px solid ${theme.borderColor}`,
    color: theme.textColor,
    fontFamily: `'${theme.bodyFont}', sans-serif`,
  }

  // ─── Success state ──────────────────────────────────
  if (success) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle size={40} style={{ color: theme.primaryColor }} className="mx-auto" />
        <h3
          className="text-xl font-bold"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
        >
          {successConfig.message || "You're on the list!"}
        </h3>

        {successConfig.showPosition && success.position && (
          <p className="text-sm" style={{ color: theme.mutedColor }}>
            You are <strong style={{ color: theme.primaryColor }}>#{success.position}</strong> on the waitlist
          </p>
        )}

        {successConfig.showReferralLink && success.referralCode && (
          <div
            className="rounded-lg p-4 space-y-2"
            style={{ background: theme.surfaceColor, border: `1px solid ${theme.borderColor}` }}
          >
            <div className="flex items-center gap-2 justify-center text-xs" style={{ color: theme.mutedColor }}>
              <Share2 size={13} /> Share to move up the list
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={buildShareUrl(success.referralCode)}
                className="flex-1 text-xs rounded px-3 py-2 bg-transparent outline-none"
                style={{ border: `1px solid ${theme.borderColor}`, color: theme.textColor }}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(buildShareUrl(success.referralCode!))}
                className="px-3 py-2 rounded text-xs font-medium flex items-center gap-1"
                style={{ background: theme.primaryColor, color: theme.isDark ? '#000' : '#fff' }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {successConfig.redirectUrl && (
          <p className="text-xs" style={{ color: theme.mutedColor }}>
            Redirecting in {successConfig.redirectDelay || 5}s...
          </p>
        )}
      </div>
    )
  }

  // ─── Custom field renderer ────────────────────────────
  function renderCustomField(field: CustomFieldDefinition) {
    const val = customValues[field.fieldKey] ?? (field.type === 'checkbox' ? false : '')

    switch (field.type) {
      case 'text':
      case 'url':
      case 'phone':
        return (
          <input
            key={field.id}
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder || field.label}
            value={val as string}
            onChange={(e) => updateCustomValue(field.fieldKey, e.target.value)}
            disabled={isPreview}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            style={inputStyle}
          />
        )
      case 'number':
        return (
          <input
            key={field.id}
            type="number"
            placeholder={field.placeholder || field.label}
            value={val as string}
            onChange={(e) => updateCustomValue(field.fieldKey, e.target.value ? Number(e.target.value) : '')}
            disabled={isPreview}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            style={inputStyle}
          />
        )
      case 'textarea':
        return (
          <textarea
            key={field.id}
            placeholder={field.placeholder || field.label}
            value={val as string}
            onChange={(e) => updateCustomValue(field.fieldKey, e.target.value)}
            disabled={isPreview}
            rows={3}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none"
            style={inputStyle}
          />
        )
      case 'select':
        return (
          <select
            key={field.id}
            value={val as string}
            onChange={(e) => updateCustomValue(field.fieldKey, e.target.value)}
            disabled={isPreview}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            style={inputStyle}
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {(field.options ?? []).filter((o) => o.trim()).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <label
            key={field.id}
            className="flex items-center gap-2 text-xs cursor-pointer"
            style={{ color: theme.mutedColor }}
          >
            <input
              type="checkbox"
              checked={val as boolean}
              onChange={(e) => updateCustomValue(field.fieldKey, e.target.checked)}
              disabled={isPreview}
              className="shrink-0"
            />
            <span>{field.label}{field.required && ' *'}</span>
          </label>
        )
      default:
        return null
    }
  }

  // ─── Form state ─────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {subscriberCount !== undefined && subscriberCount > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-xs mb-2" style={{ color: theme.mutedColor }}>
          <Users size={13} style={{ color: theme.primaryColor }} />
          <span><strong style={{ color: theme.textColor }}>{subscriberCount.toLocaleString()}</strong> already joined</span>
        </div>
      )}

      {formConfig.showNameField && (
        <input
          type="text"
          placeholder={formConfig.namePlaceholder || 'Your name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPreview}
          className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
          style={inputStyle}
        />
      )}

      {/* Custom fields */}
      {customFieldDefs.map((field) => renderCustomField(field))}

      <div className="flex gap-2">
        <input
          ref={emailRef}
          type="email"
          placeholder={formConfig.placeholder || 'you@email.com'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPreview}
          className="flex-1 rounded-lg px-4 py-3 text-sm outline-none transition-colors"
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={isPreview || submitting}
          className="px-6 py-3 rounded-lg text-sm font-bold tracking-wide transition-all whitespace-nowrap"
          style={{
            background: theme.primaryColor,
            color: theme.isDark ? '#000' : '#fff',
            fontFamily: `'${theme.headingFont}', sans-serif`,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : (formConfig.ctaText || 'Join the Waitlist')}
        </button>
      </div>

      {formConfig.consentText && (
        <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: theme.mutedColor }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={isPreview}
            className="mt-0.5 shrink-0"
          />
          <span>{formConfig.consentText}</span>
        </label>
      )}

      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </form>
  )
}
