import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Key, Copy, Check, Eye, EyeOff, RefreshCw,
  Code, Terminal, BookOpen, ArrowRight, Play, ExternalLink,
  Zap, Shield, Globe, ChevronDown, ChevronUp
} from 'lucide-react'

const endpoints = [
  {
    group: 'Projects',
    items: [
      { method: 'GET', path: '/v1/projects', desc: 'List all projects', auth: 'Secret' },
      { method: 'POST', path: '/v1/projects', desc: 'Create a new project', auth: 'Secret' },
      { method: 'GET', path: '/v1/projects/:id', desc: 'Get project details', auth: 'Both' },
      { method: 'PATCH', path: '/v1/projects/:id', desc: 'Update project settings', auth: 'Secret' },
      { method: 'DELETE', path: '/v1/projects/:id', desc: 'Archive a project', auth: 'Secret' },
    ],
  },
  {
    group: 'Subscribers',
    items: [
      { method: 'POST', path: '/v1/projects/:id/subscribers', desc: 'Create a new signup', auth: 'Both' },
      { method: 'GET', path: '/v1/projects/:id/subscribers', desc: 'List subscribers', auth: 'Secret' },
      { method: 'GET', path: '/v1/projects/:id/subscribers/:sub_id', desc: 'Get subscriber details', auth: 'Secret' },
      { method: 'PATCH', path: '/v1/projects/:id/subscribers/:sub_id', desc: 'Update subscriber', auth: 'Secret' },
      { method: 'DELETE', path: '/v1/projects/:id/subscribers/:sub_id', desc: 'Remove subscriber', auth: 'Secret' },
      { method: 'GET', path: '/v1/projects/:id/subscribers/count', desc: 'Get subscriber count', auth: 'Both' },
    ],
  },
  {
    group: 'Referrals',
    items: [
      { method: 'GET', path: '/v1/projects/:id/referrals', desc: 'List referral relationships', auth: 'Secret' },
      { method: 'GET', path: '/v1/projects/:id/referrals/leaderboard', desc: 'Referrer leaderboard', auth: 'Both' },
      { method: 'GET', path: '/v1/projects/:id/subscribers/:sub_id/referral-link', desc: 'Get referral link', auth: 'Both' },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { method: 'GET', path: '/v1/projects/:id/analytics/overview', desc: 'Aggregate stats', auth: 'Secret' },
      { method: 'GET', path: '/v1/projects/:id/analytics/timeseries', desc: 'Signup time-series', auth: 'Secret' },
      { method: 'GET', path: '/v1/projects/:id/analytics/sources', desc: 'Traffic source breakdown', auth: 'Secret' },
    ],
  },
  {
    group: 'Hosted Pages',
    items: [
      { method: 'GET', path: '/v1/projects/:id/page', desc: 'Get hosted page config', auth: 'Secret' },
      { method: 'PUT', path: '/v1/projects/:id/page', desc: 'Create/replace page config', auth: 'Secret' },
      { method: 'POST', path: '/v1/projects/:id/page/publish', desc: 'Publish page to CDN', auth: 'Secret' },
    ],
  },
  {
    group: 'Integrations',
    items: [
      { method: 'GET', path: '/v1/projects/:id/integrations', desc: 'List integrations', auth: 'Secret' },
      { method: 'POST', path: '/v1/projects/:id/integrations', desc: 'Add integration', auth: 'Secret' },
      { method: 'POST', path: '/v1/projects/:id/integrations/:int_id/test', desc: 'Send test event', auth: 'Secret' },
    ],
  },
]

const methodColors = {
  GET: 'bg-emerald-glow/10 text-emerald-glow',
  POST: 'bg-cyan-glow/10 text-cyan-glow',
  PATCH: 'bg-amber-glow/10 text-amber-glow',
  PUT: 'bg-violet-glow/10 text-violet-glow',
  DELETE: 'bg-magenta-glow/10 text-magenta-glow',
}

const codeExamples = {
  curl: `curl -X POST https://api.nexuswait.io/v1/projects/prj_abc123/subscribers \\
  -H "Authorization: Bearer nw_pk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "name": "Jane Doe",
    "fields": {
      "company": "Acme Corp",
      "role": "Founder"
    },
    "referral_code": "REF_xyz789"
  }'`,
  javascript: `import { NexusWait } from '@nexuswait/sdk';

const nw = new NexusWait({
  publishableKey: 'nw_pk_live_...'
});

// Create a signup (client-safe)
const subscriber = await nw.subscribers.create('prj_abc123', {
  email: 'user@example.com',
  name: 'Jane Doe',
  fields: { company: 'Acme Corp', role: 'Founder' },
  referralCode: 'REF_xyz789',
});

console.log(subscriber.referralLink);
// => "https://nexuswait.io/your-project?ref=ABC123"`,
  react: `import { useNexusWait } from '@nexuswait/react';

export default function WaitlistForm() {
  const { submit, status, referralLink, error } = useNexusWait({
    projectId: 'prj_abc123',
    publishableKey: 'nw_pk_live_...',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    submit({
      email: data.get('email'),
      name: data.get('name'),
    });
  };

  if (status === 'success') {
    return (
      <div>
        <p>You're on the list!</p>
        <p>Share this link: {referralLink}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="name" type="text" />
      <button disabled={status === 'loading'}>
        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
      </button>
      {error && <p>{error.message}</p>}
    </form>
  );
}`,
  python: `from nexuswait import NexusWait

nw = NexusWait(secret_key="nw_sk_live_...")

# Create subscriber (server-side)
subscriber = nw.subscribers.create(
    project_id="prj_abc123",
    email="user@example.com",
    name="Jane Doe",
    fields={"company": "Acme Corp"},
)

# List all subscribers
subscribers = nw.subscribers.list(
    project_id="prj_abc123",
    limit=50,
    sort="created_at:desc",
)

# Verify webhook signature
is_valid = nw.webhooks.verify(
    payload=request.body,
    signature=request.headers["X-NexusWait-Signature"],
)`,
}

export default function ApiDocs() {
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)
  const [activeCodeTab, setActiveCodeTab] = useState('curl')
  const [expandedGroup, setExpandedGroup] = useState('Subscribers')
  const [playgroundResponse, setPlaygroundResponse] = useState(null)

  const copyKey = (type) => {
    setCopiedKey(type)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const runPlayground = () => {
    setPlaygroundResponse(JSON.stringify({
      id: "sub_a1b2c3d4e5",
      email: "user@example.com",
      name: "Jane Doe",
      position: 1248,
      referral_code: "REF_a1b2c3",
      referral_link: "https://nexuswait.io/synthos?ref=REF_a1b2c3",
      referral_count: 0,
      fields: { company: "Acme Corp", role: "Founder" },
      verified: false,
      created_at: "2026-03-11T14:32:00Z"
    }, null, 2))
  }

  return (
    <div className="animate-fade-in">
      <Link to="/dashboard" className="no-underline inline-flex items-center gap-1.5 text-sm text-nexus-500 hover:text-cyan-glow transition-colors mb-5">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">API & BYOUI</h1>
          <p className="text-sm text-nexus-400 mt-1">
            Full REST API access. Bring your own UI or use our SDKs.
          </p>
        </div>
        <a href="#" className="btn-secondary no-underline flex items-center gap-1.5 text-xs">
          <BookOpen size={13} /> Full Docs <ExternalLink size={11} />
        </a>
      </div>

      {/* Key features */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Key, label: 'Dual Key Auth', desc: 'Publishable keys for client-side, secret keys for server-side', color: 'cyan' },
          { icon: Shield, label: 'HMAC Webhooks', desc: 'Signed payloads with SHA-256 verification', color: 'emerald' },
          { icon: Zap, label: '< 50ms Latency', desc: 'Edge-optimized API with global distribution', color: 'violet' },
        ].map((f, i) => (
          <div key={i} className="card-surface p-4 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${f.color}-glow/10 text-${f.color}-glow border border-${f.color}-glow/20`}>
              <f.icon size={15} />
            </div>
            <div>
              <div className="font-display text-xs font-bold text-nexus-100 tracking-wider">{f.label}</div>
              <div className="text-[11px] text-nexus-500 mt-0.5">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* API Keys */}
      <div className="card-surface p-6 mb-8">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Your API Keys</h2>
        <div className="space-y-3">
          {/* Publishable */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-nexus-900/50 border border-nexus-700/30">
            <div className="shrink-0">
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-glow/10 text-emerald-glow">Publishable</span>
            </div>
            <code className="text-xs font-mono text-nexus-300 flex-1 truncate">nw_pk_live_x7k2m9a1b3c5d8e0f4g6h...</code>
            <button onClick={() => copyKey('pub')} className="text-nexus-500 hover:text-cyan-glow transition-colors">
              {copiedKey === 'pub' ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
          {/* Secret */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-nexus-900/50 border border-nexus-700/30">
            <div className="shrink-0">
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-magenta-glow/10 text-magenta-glow">Secret</span>
            </div>
            <code className="text-xs font-mono text-nexus-300 flex-1 truncate">
              {showSecretKey ? 'nw_sk_live_a8f3k2m9x1b7c4d6e0g5h...' : 'nw_sk_live_••••••••••••••••••••••••'}
            </code>
            <button onClick={() => setShowSecretKey(!showSecretKey)} className="text-nexus-500 hover:text-nexus-300">
              {showSecretKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button onClick={() => copyKey('sec')} className="text-nexus-500 hover:text-cyan-glow transition-colors">
              {copiedKey === 'sec' ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button className="btn-ghost text-xs flex items-center gap-1.5"><RefreshCw size={12} /> Rotate Keys</button>
          <p className="text-[10px] text-nexus-600">Publishable keys are safe for client-side code. Never expose secret keys in the browser.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mb-8">
        {/* Endpoints reference */}
        <div>
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Endpoints</h2>
          <div className="space-y-2">
            {endpoints.map(group => (
              <div key={group.group} className="card-surface overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-nexus-700/10 transition-all"
                  onClick={() => setExpandedGroup(expandedGroup === group.group ? null : group.group)}
                >
                  <span className="font-display text-xs font-bold text-nexus-200 tracking-wider">{group.group}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-nexus-600">{group.items.length}</span>
                    {expandedGroup === group.group ? <ChevronUp size={14} className="text-nexus-500" /> : <ChevronDown size={14} className="text-nexus-500" />}
                  </div>
                </button>
                {expandedGroup === group.group && (
                  <div className="border-t border-cyan-glow/[0.04] animate-fade-in">
                    {group.items.map((ep, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-nexus-700/10 last:border-0 hover:bg-cyan-glow/[0.02] transition-all">
                        <span className={`text-[9px] font-mono font-bold tracking-wider w-12 text-center px-1.5 py-0.5 rounded ${methodColors[ep.method]}`}>
                          {ep.method}
                        </span>
                        <code className="text-xs font-mono text-nexus-300 flex-1 truncate">{ep.path}</code>
                        <span className="text-[9px] text-nexus-600 font-mono shrink-0">{ep.auth}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Code examples */}
        <div>
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Quick Start</h2>
          <div className="card-surface overflow-hidden">
            <div className="flex border-b border-cyan-glow/[0.06]">
              {Object.keys(codeExamples).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wider capitalize transition-all border-b-2 ${
                    activeCodeTab === tab ? 'text-cyan-glow border-cyan-glow' : 'text-nexus-500 border-transparent hover:text-nexus-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <pre className="p-4 font-mono text-[11px] text-nexus-300 overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto">
              <code>{codeExamples[activeCodeTab]}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* API Playground */}
      <div className="card-surface p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">API Playground</h2>
          <span className="text-[10px] font-mono text-nexus-600">Using test mode</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <select className="input-field text-sm font-mono w-24">
                <option>POST</option>
                <option>GET</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
              <input type="text" defaultValue="/v1/projects/prj_abc123/subscribers" className="input-field text-sm font-mono flex-1" />
            </div>
            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Request Body</label>
              <textarea
                rows={6}
                defaultValue={JSON.stringify({ email: "user@example.com", name: "Jane Doe", fields: { company: "Acme Corp" } }, null, 2)}
                className="input-field text-xs font-mono resize-none"
              />
            </div>
            <button onClick={runPlayground} className="btn-primary flex items-center gap-2 text-xs">
              <Play size={13} /> Send Request
            </button>
          </div>
          <div>
            <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Response</label>
            <div className="bg-nexus-900/50 border border-nexus-700/30 rounded-lg p-4 min-h-[200px]">
              {playgroundResponse ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold bg-emerald-glow/10 text-emerald-glow px-2 py-0.5 rounded">201 Created</span>
                    <span className="text-[10px] font-mono text-nexus-600">42ms</span>
                  </div>
                  <pre className="font-mono text-[11px] text-nexus-300 overflow-auto leading-relaxed">
                    <code>{playgroundResponse}</code>
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-nexus-600 font-mono">Send a request to see the response here.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SDKs */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { name: 'JavaScript SDK', install: 'npm install @nexuswait/sdk', desc: 'Browser + Node.js, TypeScript, auto-retry' },
          { name: 'React Hook', install: 'npm install @nexuswait/react', desc: 'useNexusWait() with form state management' },
          { name: 'Python SDK', install: 'pip install nexuswait', desc: 'Sync + async, Pydantic models, webhook verify' },
        ].map((sdk, i) => (
          <div key={i} className="card-surface p-5">
            <Terminal size={18} className="text-cyan-glow mb-3" />
            <h3 className="font-display text-xs font-bold text-nexus-100 tracking-wider mb-1">{sdk.name}</h3>
            <code className="text-[10px] font-mono text-cyan-glow/70 bg-cyan-glow/5 px-2 py-0.5 rounded inline-block mb-2">{sdk.install}</code>
            <p className="text-[11px] text-nexus-500">{sdk.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
