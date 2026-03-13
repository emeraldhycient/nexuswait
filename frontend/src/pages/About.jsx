import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function About() {
  useDocumentTitle('About')

  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link to="/" className="text-sm text-nexus-500 hover:text-cyan-glow no-underline mb-8 inline-block">← Back</Link>
        <h1 className="font-display text-3xl font-black text-nexus-50 tracking-wider mb-6">About NexusWait</h1>
        <div className="card-surface p-8 space-y-6 text-nexus-300 text-sm">
          <p>NexusWait is the modern waitlist platform that helps teams capture demand before launch. We offer hosted pages, embeddable forms, and a headless API so you can choose the experience that fits your stack.</p>
          <p>Our mission is to become the default infrastructure for pre-launch demand capture—from indie makers to enterprise teams.</p>
          <p>
            <Link to="/contact" className="text-cyan-glow no-underline">Get in touch</Link> for partnerships or press.
          </p>
        </div>
      </div>
    </div>
  )
}
