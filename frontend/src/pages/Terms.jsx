import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Terms() {
  useDocumentTitle('Terms of Service')

  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link to="/" className="text-sm text-nexus-500 hover:text-cyan-glow no-underline mb-8 inline-block">← Back</Link>
        <h1 className="font-display text-3xl font-black text-nexus-50 tracking-wider mb-6">Terms of Service</h1>
        <p className="text-nexus-400 text-sm mb-6">Last updated: March 11, 2026.</p>
        <div className="card-surface p-8 space-y-6 text-nexus-300 text-sm">
          <p>These Terms of Service govern your use of NexusWait. By signing up or using the platform, you agree to these terms.</p>
          <h2 className="font-display text-nexus-100 text-base">1. Acceptance</h2>
          <p>By accessing or using NexusWait, you agree to be bound by these Terms and our Privacy Policy.</p>
          <h2 className="font-display text-nexus-100 text-base">2. Use of Service</h2>
          <p>You may use NexusWait to build and manage waitlists in accordance with your plan. You are responsible for the data you collect and for complying with applicable laws (e.g. GDPR, CCPA).</p>
          <h2 className="font-display text-nexus-100 text-base">3. Contact</h2>
          <p>For questions about these terms, contact us at <Link to="/contact" className="text-cyan-glow no-underline">Contact</Link>.</p>
        </div>
      </div>
    </div>
  )
}
