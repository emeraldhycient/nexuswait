import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Privacy() {
  useDocumentTitle('Privacy Policy')

  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link to="/" className="text-sm text-nexus-500 hover:text-cyan-glow no-underline mb-8 inline-block">← Back</Link>
        <h1 className="font-display text-3xl font-black text-nexus-50 tracking-wider mb-6">Privacy Policy</h1>
        <p className="text-nexus-400 text-sm mb-6">Last updated: March 11, 2026.</p>
        <div className="card-surface p-8 space-y-6 text-nexus-300 text-sm">
          <p>NexusWait respects your privacy. This policy describes how we collect, use, and protect your information.</p>
          <h2 className="font-display text-nexus-100 text-base">1. Data We Collect</h2>
          <p>We collect account information (email, name), usage data, and data you submit via waitlists (e.g. subscriber emails).</p>
          <h2 className="font-display text-nexus-100 text-base">2. How We Use It</h2>
          <p>We use data to provide the service, improve the product, and communicate with you. We do not sell your data.</p>
          <h2 className="font-display text-nexus-100 text-base">3. Your Rights</h2>
          <p>You may request access, correction, or deletion of your data. Contact us via <Link to="/contact" className="text-cyan-glow no-underline">Contact</Link>.</p>
        </div>
      </div>
    </div>
  )
}
