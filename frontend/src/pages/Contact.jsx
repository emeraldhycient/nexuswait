import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-24">
        <Link to="/" className="text-sm text-nexus-500 hover:text-cyan-glow no-underline mb-8 inline-block">← Back</Link>
        <h1 className="font-display text-3xl font-black text-nexus-50 tracking-wider mb-2">Contact</h1>
        <p className="text-nexus-400 text-sm mb-8">Get in touch with the NexusWait team.</p>
        <div className="card-surface p-8">
          {submitted ? (
            <p className="text-nexus-300 text-sm">Thanks for your message. We'll get back to you soon.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Name</label>
                <input type="text" className="input-field" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Email</label>
                <input type="email" className="input-field" placeholder="you@company.com" />
              </div>
              <div>
                <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Message</label>
                <textarea className="input-field min-h-[120px]" placeholder="Your message" />
              </div>
              <button type="submit" className="btn-primary flex items-center gap-2">
                Send <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>
        <p className="text-nexus-500 text-xs mt-6">
          For legal inquiries, see <Link to="/legal" className="text-cyan-glow/70 no-underline">Legal</Link>.
        </p>
      </div>
    </div>
  )
}
