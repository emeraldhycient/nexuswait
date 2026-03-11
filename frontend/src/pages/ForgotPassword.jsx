import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="grid-bg min-h-[85vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm">
        <Link to="/login" className="text-sm text-nexus-500 hover:text-cyan-glow no-underline mb-6 inline-block">← Back to Login</Link>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider mb-2">Forgot password?</h1>
        <p className="text-sm text-nexus-400 mb-6">Enter your email and we'll send you a reset link.</p>
        <div className="card-surface p-7">
          {sent ? (
            <p className="text-nexus-300 text-sm">If an account exists for that email, you will receive a reset link shortly.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@company.com"
                />
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                Send reset link <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
