import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react'
import { useResendVerification, getMutationErrorMessage } from '../api/hooks'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function CheckEmail() {
  useDocumentTitle('Check Your Email')
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email ?? ''
  const resend = useResendVerification()
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const handleResend = () => {
    if (!email || cooldown > 0) return
    resend.mutate(email, {
      onSuccess: () => setCooldown(60),
    })
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-20 grid-bg">
      <div className="fixed top-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-glow/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-glow/20 to-cyan-glow/5 border border-cyan-glow/10 flex items-center justify-center">
            <Mail size={28} className="text-cyan-glow" />
          </div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Check Your Email</h1>
          <p className="text-sm text-nexus-400 mt-2">
            We sent a verification link to{' '}
            {email ? <span className="text-cyan-glow/80">{email}</span> : 'your email'}
          </p>
        </div>

        <div className="card-surface p-7 text-center">
          <p className="text-sm text-nexus-400 leading-relaxed mb-6">
            Click the link in the email to verify your account. The link expires in 24 hours.
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={resend.isPending || cooldown > 0 || !email}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-nexus-600 text-sm text-nexus-200 font-semibold hover:bg-nexus-700/30 hover:border-nexus-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={resend.isPending ? 'animate-spin' : ''} />
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : resend.isPending
                ? 'Sending...'
                : 'Resend Verification Email'}
          </button>

          {resend.isSuccess && (
            <p className="text-sm text-emerald-glow mt-3">Verification email sent!</p>
          )}
          {resend.error && (
            <p className="text-sm text-magenta-glow mt-3">{getMutationErrorMessage(resend.error)}</p>
          )}

          <p className="text-xs text-nexus-500 mt-4">
            Didn&apos;t receive it? Check your spam folder.
          </p>
        </div>

        <p className="text-center text-sm text-nexus-500 mt-6">
          <Link to="/login" className="inline-flex items-center gap-1 text-cyan-glow no-underline hover:underline">
            <ArrowLeft size={13} /> Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
