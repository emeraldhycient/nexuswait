import { Link } from 'react-router-dom'

const entries = [
  { version: '2.0.0', date: 'March 11, 2026', items: ['Hosted pages & page builder', 'Form submit integrations', 'Public REST API v1', 'Referral engine enhancements'] },
  { version: '1.5.0', date: 'February 20, 2026', items: ['Referral engine', 'Integration framework'] },
  { version: '1.0.0', date: 'January 15, 2026', items: ['Dashboard launch', 'Project management', 'Basic analytics'] },
]

export default function Changelog() {
  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link to="/" className="text-sm text-nexus-500 hover:text-cyan-glow no-underline mb-8 inline-block">← Back</Link>
        <h1 className="font-display text-3xl font-black text-nexus-50 tracking-wider mb-2">Changelog</h1>
        <p className="text-nexus-400 text-sm mb-10">Updates and releases.</p>
        <div className="space-y-8">
          {entries.map((e, i) => (
            <div key={i} className="card-surface p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-display font-bold text-cyan-glow">{e.version}</span>
                <span className="text-xs font-mono text-nexus-500">{e.date}</span>
              </div>
              <ul className="list-disc list-inside text-sm text-nexus-300 space-y-1">
                {e.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
