import { Link } from 'react-router-dom'
import { Check, Sparkles, HelpCircle } from 'lucide-react'
import { useState } from 'react'

const plans = [
  {
    name: 'Spark',
    desc: 'Perfect for side projects and experiments.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: 'Start Free',
    highlight: false,
    features: [
      '1 waitlist project',
      '500 signups / month',
      'Basic analytics',
      'NexusWait branding',
      'Email notifications',
      'Community support',
    ],
  },
  {
    name: 'Pulse',
    desc: 'For startups ready to launch big.',
    monthlyPrice: 29,
    yearlyPrice: 24,
    cta: 'Start Trial',
    highlight: true,
    badge: 'MOST POPULAR',
    features: [
      '10 waitlist projects',
      '25,000 signups / month',
      'Advanced analytics & funnels',
      'Custom branding',
      'Referral engine',
      'Webhook integrations',
      'Priority support',
      'A/B testing',
    ],
  },
  {
    name: 'Nexus',
    desc: 'Unlimited power for serious operators.',
    monthlyPrice: 99,
    yearlyPrice: 79,
    cta: 'Contact Sales',
    highlight: false,
    features: [
      'Unlimited projects',
      'Unlimited signups',
      'Full analytics suite',
      'White-label solution',
      'Advanced referral tiers',
      'API access & webhooks',
      'Dedicated account manager',
      'SSO & team roles',
      'Custom SLA',
    ],
  },
]

const faqs = [
  { q: 'Can I switch plans later?', a: 'Absolutely. Upgrade or downgrade at any time. Changes take effect immediately and we prorate charges.' },
  { q: 'Is there a free trial for paid plans?', a: 'Yes — both Pulse and Nexus come with a 14-day free trial. No credit card required to start.' },
  { q: 'What counts as a signup?', a: 'Each unique email submission to any of your waitlists counts as one signup. Duplicate or bot submissions are filtered out and don\'t count.' },
  { q: 'Do you offer refunds?', a: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, reach out and we\'ll process your refund.' },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-14 animate-slide-up">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-nexus-50">
            Simple, <span className="text-cyan-glow">Transparent</span> Pricing
          </h1>
          <p className="mt-4 text-nexus-400 max-w-xl mx-auto">
            Start free. Scale when you&apos;re ready. No hidden fees ever.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full border border-cyan-glow/10 bg-nexus-800/50">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!annual ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-nexus-400'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${annual ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-nexus-400'}`}
            >
              Annual
              <span className="text-[10px] font-mono bg-emerald-glow/15 text-emerald-glow px-2 py-0.5 rounded-full">SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`animate-slide-up relative card-surface p-7 flex flex-col ${
                plan.highlight ? 'border-cyan-glow/25 box-glow-cyan' : ''
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {'badge' in plan && plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-glow text-nexus-900 font-display text-[10px] font-bold tracking-widest">
                    <Sparkles size={10} /> {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-display text-lg font-bold text-nexus-100 tracking-wider">{plan.name}</h3>
                <p className="text-sm text-nexus-400 mt-1">{plan.desc}</p>
              </div>

              <div className="mt-6 mb-6">
                <span className="font-display text-4xl font-black text-nexus-50">
                  ${annual ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="text-nexus-500 text-sm ml-1">/ mo</span>
              </div>

              <Link
                to="/signup"
                className={`no-underline text-center rounded-lg py-3 font-display text-sm font-bold tracking-wider uppercase transition-all ${
                  plan.highlight
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-7 space-y-3 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-nexus-300">
                    <Check size={15} className="text-cyan-glow mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-28 max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-black text-nexus-100 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="card-surface overflow-hidden cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                onKeyDown={(e) => e.key === 'Enter' && setOpenFaq(openFaq === i ? null : i)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between p-5">
                  <span className="font-semibold text-nexus-200 text-sm">{faq.q}</span>
                  <HelpCircle size={16} className={`text-nexus-500 transition-transform ${openFaq === i ? 'rotate-45 text-cyan-glow' : ''}`} />
                </div>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-nexus-400 leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
