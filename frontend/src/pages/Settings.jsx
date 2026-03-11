import { useState } from 'react'
import { User, Bell, Shield, CreditCard, Key, Globe, Save } from 'lucide-react'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider mb-1">Settings</h1>
      <p className="text-sm text-nexus-400 mb-8">Manage your account and preferences.</p>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="sm:w-48 shrink-0 flex sm:flex-col gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-cyan-glow/[0.08] text-cyan-glow'
                  : 'text-nexus-400 hover:text-nexus-200 hover:bg-nexus-700/30'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-xl">
          {activeTab === 'profile' && (
            <div className="animate-fade-in space-y-6">
              <div className="card-surface p-6">
                <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-5">Profile Information</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-glow/20 to-magenta-glow/20 border border-cyan-glow/15 flex items-center justify-center">
                    <User size={24} className="text-cyan-glow" />
                  </div>
                  <div>
                    <button className="btn-secondary text-xs py-1.5 px-3">Change Avatar</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">First Name</label>
                      <input type="text" defaultValue="Jane" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Last Name</label>
                      <input type="text" defaultValue="Doe" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Email</label>
                    <input type="email" defaultValue="jane@company.com" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Company</label>
                    <input type="text" defaultValue="Acme Corp" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Timezone</label>
                    <select className="input-field">
                      <option>UTC (GMT+0)</option>
                      <option>EST (GMT-5)</option>
                      <option>PST (GMT-8)</option>
                      <option>CET (GMT+1)</option>
                      <option>JST (GMT+9)</option>
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={save} className="btn-primary flex items-center gap-2">
                <Save size={14} /> {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-fade-in card-surface p-6">
              <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-5">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'New signups', desc: 'Get notified when someone joins your waitlist', default: true },
                  { label: 'Daily digest', desc: 'Receive a daily summary of waitlist activity', default: true },
                  { label: 'Weekly report', desc: 'Detailed analytics report every Monday', default: false },
                  { label: 'Milestone alerts', desc: 'Celebrate when you hit signup milestones', default: true },
                  { label: 'Referral notifications', desc: 'Alert when someone refers a new signup', default: false },
                  { label: 'System updates', desc: 'NexusWait product news and updates', default: false },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-nexus-700/20 last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-nexus-200">{n.label}</div>
                      <div className="text-xs text-nexus-500 mt-0.5">{n.desc}</div>
                    </div>
                    <NotifToggle defaultOn={n.default} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-fade-in space-y-5">
              <div className="card-surface p-6">
                <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-5">Change Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Current Password</label>
                    <input type="password" className="input-field" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">New Password</label>
                    <input type="password" className="input-field" placeholder="Min 8 characters" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Confirm New Password</label>
                    <input type="password" className="input-field" placeholder="Re-enter new password" />
                  </div>
                  <button className="btn-primary text-xs">Update Password</button>
                </div>
              </div>

              <div className="card-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Two-Factor Authentication</h2>
                    <p className="text-xs text-nexus-500 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <button className="btn-secondary text-xs py-1.5 px-3">Enable</button>
                </div>
              </div>

              <div className="card-surface p-6">
                <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">API Keys</h2>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-nexus-900/50 border border-nexus-700/30">
                  <Key size={14} className="text-nexus-500 shrink-0" />
                  <code className="text-xs font-mono text-nexus-400 flex-1 truncate">nw_sk_live_a8f3k2m9x1b7c4d6e0g5h...</code>
                  <button className="text-xs text-cyan-glow/70 hover:text-cyan-glow font-mono">Copy</button>
                </div>
                <button className="btn-ghost text-xs mt-3">Regenerate Key</button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="animate-fade-in space-y-5">
              <div className="card-surface p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Current Plan</h2>
                  <span className="text-[10px] font-mono bg-cyan-glow/10 text-cyan-glow px-2 py-0.5 rounded-full tracking-wider">PULSE</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-display text-3xl font-black text-nexus-50">$24</span>
                  <span className="text-sm text-nexus-500">/ month (billed annually)</span>
                </div>
                <p className="text-xs text-nexus-500 mb-4">Next billing date: April 1, 2026</p>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs py-1.5 px-3">Change Plan</button>
                  <button className="btn-ghost text-xs text-nexus-500">Cancel Subscription</button>
                </div>
              </div>

              <div className="card-surface p-6">
                <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Usage This Month</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-nexus-400">Signups</span>
                      <span className="text-xs font-mono text-nexus-400">8,429 / 25,000</span>
                    </div>
                    <div className="h-2 bg-nexus-700/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-cyan-glow/60" style={{ width: '33.7%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-nexus-400">Projects</span>
                      <span className="text-xs font-mono text-nexus-400">4 / 10</span>
                    </div>
                    <div className="h-2 bg-nexus-700/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-violet-glow/60" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-surface p-6">
                <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Payment Method</h2>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-nexus-900/50 border border-nexus-700/30">
                  <div className="w-10 h-7 rounded bg-gradient-to-r from-violet-glow/30 to-cyan-glow/30 flex items-center justify-center">
                    <CreditCard size={14} className="text-nexus-300" />
                  </div>
                  <div>
                    <span className="text-sm text-nexus-200 font-semibold">•••• •••• •••• 4242</span>
                    <div className="text-[10px] text-nexus-600 font-mono">Exp 12/28</div>
                  </div>
                </div>
                <button className="btn-ghost text-xs mt-3">Update Payment Method</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NotifToggle({ defaultOn }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-10 h-5.5 rounded-full transition-all relative shrink-0 ${on ? 'bg-cyan-glow' : 'bg-nexus-600'}`}
      style={{ width: 40, height: 22 }}
    >
      <div
        className="w-4.5 h-4.5 rounded-full bg-white absolute top-[2px] transition-transform"
        style={{ width: 18, height: 18, transform: on ? 'translateX(20px)' : 'translateX(2px)' }}
      />
    </button>
  )
}
