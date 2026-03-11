import { Link } from 'react-router-dom'

export default function Legal() {
  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link to="/" className="text-sm text-nexus-500 hover:text-cyan-glow no-underline mb-8 inline-block">← Back</Link>
        <h1 className="font-display text-3xl font-black text-nexus-50 tracking-wider mb-8">Legal</h1>
        <div className="card-surface p-8 space-y-6">
          <Link to="/terms" className="block text-nexus-200 hover:text-cyan-glow no-underline font-semibold">Terms of Service</Link>
          <Link to="/privacy" className="block text-nexus-200 hover:text-cyan-glow no-underline font-semibold">Privacy Policy</Link>
          <p className="text-nexus-500 text-sm pt-4">For other legal or compliance questions, <Link to="/contact" className="text-cyan-glow no-underline">contact us</Link>.</p>
        </div>
      </div>
    </div>
  )
}
