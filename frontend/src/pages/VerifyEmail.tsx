import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, RefreshCw, ArrowLeft } from 'lucide-react'
import { useVerifyEmail, useResendVerification, getMutationErrorMessage } from '../api/hooks'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function VerifyEmail() {
  useDocumentTitle('Verify Email')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const verify = useVerifyEmail()
  const resend = useResendVerification()
  const [resendEmail, setResendEmail] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    if (!token || triggered) return
    setTriggered(true)
    verify.mutate(token)
  }, [token, triggered, verify])

  // Redirect to dashboard 2s after success
  useEffect(() => {
    if (!verify.isSuccess) return
    const id = setTimeout(() => navigate('/dashboard'), 2000)
    return () => clearTimeout(id)
  }, [verify.isSuccess, navigate])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const isExpired = verify.error
    && (verify.error as { response?: { data?: { code?: string } } }).response?.data?.code === 'TOKEN_EXPIRED'

  const handleResend = () => {
    if (!resendEmail || cooldown > 0) return
    resend.mutate(resendEmail, {
      onSuccess: () => setCooldown(60),
    })
  }

  if (!token) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-6 py-20 grid-bg">
        <div className="w-full max-w-sm relative z-10 text-center animate-slide-up">
          <XCircle size={48} className="mx-auto text-magenta-glow mb-4" />
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider mb-2">Invalid Link</h1>
          <p className="text-sm text-nexus-400">This verification link is missing a token.</p>
          <Link to="/login" className="inline-flex items-center gap-1 text-cyan-glow no-underline hover:underline mt-4 text-sm">
            <ArrowLeft size={13} /> Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-20 grid-bg">
      <div className="fixed top-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-glow/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Loading */}
        {verify.isPending && (
          <div className="text-center">
            <Loader2 size={48} className="mx-auto text-cyan-glow animate-spin mb-4" />
            <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider mb-2">Verifying...</h1>
            <p className="text-sm text-nexus-400">Please wait while we verify your email.</p>
          </div>
        )}

        {/* Success */}
        {verify.isSuccess && (
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-glow mb-4" />
            <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider mb-2">
              {verify.data?.alreadyVerified ? 'Already Verified' : 'Email Verified!'}
            </h1>
            <p className="text-sm text-nexus-400">
              {verify.data?.alreadyVerified
                ? 'Your email was already verified. Redirecting to dashboard...'
                : 'Your account is now active. Redirecting to dashboard...'}
            </p>
          </div>
        )}

        {/* Error */}
        {verify.isError && (
          <div className="text-center">
            <XCircle size={48} className="mx-auto text-magenta-glow mb-4" />
            <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider mb-2">
              {isExpired ? 'Link Expired' : 'Verification Failed'}
            </h1>
            <p className="text-sm text-nexus-400 mb-6">
              {isExpired
                ? 'This verification link has expired. Request a new one below.'
                : getMutationErrorMessage(verify.error)}
            </p>

            {isExpired && (
              <div className="card-surface p-6">
                <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="input-field mb-3"
                  placeholder="you@company.com"
                />
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resend.isPending || cooldown > 0 || !resendEmail}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-nexus-600 text-sm text-nexus-200 font-semibold hover:bg-nexus-700/30 hover:border-nexus-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} className={resend.isPending ? 'animate-spin' : ''} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : resend.isPending ? 'Sending...' : 'Resend Verification Email'}
                </button>
                {resend.isSuccess && (
                  <p className="text-sm text-emerald-glow mt-3">Verification email sent!</p>
                )}
                {resend.error && (
                  <p className="text-sm text-magenta-glow mt-3">{getMutationErrorMessage(resend.error)}</p>
                )}
              </div>
            )}

            <p className="text-sm text-nexus-500 mt-6">
              <Link to="/login" className="inline-flex items-center gap-1 text-cyan-glow no-underline hover:underline">
                <ArrowLeft size={13} /> Back to login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
