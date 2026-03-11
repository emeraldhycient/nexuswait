import { Link } from 'react-router-dom'
import {
  Zap, Shield, BarChart3, Globe, Layers, ArrowRight,
  Sparkles, Users, Clock, TrendingUp, Code, Webhook
} from 'lucide-react'

const stats = [
  { value: '12K+', label: 'Waitlists Created' },
  { value: '4.2M', label: 'Signups Collected' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<50ms', label: 'API Latency' },
]

const features = [
  {
    icon: Zap,
    title: 'Instant Deploy',
    desc: 'Go live in under 60 seconds. Embed anywhere with a single line of code or use our hosted pages.',
    color: 'cyan',
  },
  {
    icon: Shield,
    title: 'Bot Protection',
    desc: 'AI-powered fraud detection eliminates fake signups. Keep your list clean and conversion-ready.',
    color: 'magenta',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    desc: 'Track referral chains, conversion funnels, and engagement metrics with live dashboards.',
    color: 'violet',
  },
  {
    icon: Globe,
    title: 'Global Edge Network',
    desc: 'Forms load in milliseconds worldwide. 200+ edge locations ensure zero-lag experiences.',
    color: 'emerald',
  },
  {
    icon: Layers,
    title: 'Smart Segmentation',
    desc: 'Auto-segment by source, behavior, and custom attributes. Send the right message to the right cohort.',
    color: 'amber',
  },
  {
    icon: Webhook,
    title: 'Webhooks & API',
    desc: 'Full REST API and real-time webhooks. Pipe data into any tool in your stack.',
    color: 'cyan',
  },
]

const colorMap = {
  cyan: { text: 'text-cyan-glow', bg: 'bg-cyan-glow/10', border: 'border-cyan-glow/20' },
  magenta: { text: 'text-magenta-glow', bg: 'bg-magenta-glow/10', border: 'border-magenta-glow/20' },
  violet: { text: 'text-violet-glow', bg: 'bg-violet-glow/10', border: 'border-violet-glow/20' },
  emerald: { text: 'text-emerald-glow', bg: 'bg-emerald-glow/10', border: 'border-emerald-glow/20' },
  amber: { text: 'text-amber-glow', bg: 'bg-amber-glow/10', border: 'border-amber-glow/20' },
}

const logos = ['Vercel', 'Stripe', 'Linear', 'Notion', 'Figma', 'Raycast']

export default function Landing() {
  return (
    <div className="grid-bg">
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-cyan-glow/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-magenta-glow/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-32 text-center relative z-10">
          {/* Badge */}
          <div className="animate-slide-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-glow/15 bg-cyan-glow/[0.04] mb-8">
            <Sparkles size={13} className="text-cyan-glow" />
            <span className="font-mono text-xs text-cyan-glow tracking-wider">NOW IN PUBLIC BETA</span>
          </div>

          <h1 className="animate-slide-up stagger-1 font-display text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            <span className="text-nexus-50">Build Waitlists</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-glow via-violet-glow to-magenta-glow bg-clip-text text-transparent">
              That Launch Empires
            </span>
          </h1>

          <p className="animate-slide-up stagger-2 mt-7 text-lg sm:text-xl text-nexus-300 max-w-2xl mx-auto leading-relaxed">
            Capture demand before you ship. NexusWait gives you referral-powered waitlists,
            real-time analytics, and instant embeds — so your launch day is already a success.
          </p>

          <div className="animate-slide-up stagger-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary no-underline text-base px-8 py-3.5 flex items-center gap-2">
              Start Free <ArrowRight size={16} />
            </Link>
            <Link to="/resources" className="btn-secondary no-underline flex items-center gap-2">
              View Docs
            </Link>
          </div>

          {/* Terminal preview */}
          <div className="animate-slide-up stagger-4 mt-16 max-w-2xl mx-auto">
            <div className="card-surface overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-cyan-glow/[0.06]">
                <div className="w-2.5 h-2.5 rounded-full bg-magenta-glow/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-glow/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-glow/60" />
                <span className="ml-3 font-mono text-[11px] text-nexus-500">terminal</span>
              </div>
              <div className="p-5 font-mono text-sm text-left space-y-2">
                <div>
                  <span className="text-cyan-glow">$</span>
                  <span className="text-nexus-200"> npx create-nexuswait@latest my-launch</span>
                </div>
                <div className="text-nexus-500">
                  ✓ Created waitlist project<br />
                  ✓ Connected analytics pipeline<br />
                  ✓ Referral engine configured<br />
                  ✓ Bot protection active
                </div>
                <div>
                  <span className="text-emerald-glow">Ready!</span>
                  <span className="text-nexus-400"> Deploy at </span>
                  <span className="text-cyan-glow underline">nexuswait.io/my-launch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="border-y border-cyan-glow/[0.04] bg-nexus-800/20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="font-mono text-[10px] text-nexus-500 tracking-[0.3em] uppercase text-center mb-8">
            Trusted by teams building the future
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-40">
            {logos.map(name => (
              <span key={name} className="font-display text-sm tracking-[0.15em] text-nexus-300 uppercase">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="animate-slide-up card-surface p-6 text-center" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="font-display text-3xl font-black text-cyan-glow text-glow-cyan">{s.value}</div>
              <div className="mt-2 font-mono text-[11px] text-nexus-400 tracking-wider uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-black text-nexus-50">
            Everything You Need to <span className="text-cyan-glow">Dominate</span> Launch Day
          </h2>
          <p className="mt-4 text-nexus-400 max-w-xl mx-auto">
            A full-stack waitlist engine built for speed, scale, and conversions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const c = colorMap[f.color]
            return (
              <div
                key={i}
                className="animate-slide-up card-surface p-6 group hover:border-cyan-glow/20 transition-all duration-300"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-10 h-10 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                  <f.icon size={18} className={c.text} />
                </div>
                <h3 className="font-display text-sm font-bold tracking-wider text-nexus-100 uppercase">{f.title}</h3>
                <p className="mt-2 text-sm text-nexus-400 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-cyan-glow/[0.04] bg-nexus-800/10">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="font-display text-3xl sm:text-4xl font-black text-nexus-50 text-center mb-16">
            Launch in <span className="text-magenta-glow">Three Steps</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Code, title: 'Create', desc: 'Design your waitlist page with our builder or bring your own. Customize every pixel.' },
              { step: '02', icon: Users, title: 'Collect', desc: 'Watch signups flow in. Referral loops amplify growth while bot detection keeps data clean.' },
              { step: '03', icon: TrendingUp, title: 'Convert', desc: 'Launch to a primed audience. Segment, sequence, and convert your waitlist into customers.' },
            ].map((item, i) => (
              <div key={i} className="relative animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <span className="font-display text-6xl font-black text-cyan-glow/[0.07] absolute -top-4 -left-2">{item.step}</span>
                <div className="relative card-surface p-6">
                  <item.icon size={24} className="text-cyan-glow mb-4" />
                  <h3 className="font-display text-lg font-bold text-nexus-100">{item.title}</h3>
                  <p className="mt-2 text-sm text-nexus-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="relative card-surface p-12 sm:p-16 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-cyan-glow/[0.06] to-transparent rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-black text-nexus-50">
              Ready to Build Your <span className="text-cyan-glow text-glow-cyan">Nexus</span>?
            </h2>
            <p className="mt-4 text-nexus-400 max-w-lg mx-auto">
              Join thousands of founders who launched with a waitlist that actually converts.
              Free tier available — no credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="btn-primary no-underline px-8 py-3.5 flex items-center gap-2">
                Create Free Waitlist <ArrowRight size={16} />
              </Link>
              <Link to="/pricing" className="btn-secondary no-underline">View Pricing</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
