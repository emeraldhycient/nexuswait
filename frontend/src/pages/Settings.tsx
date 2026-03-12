import { useState, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import { User, Bell, Shield, CreditCard, Key, Save, Plus, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  useUpdateProfile,
  useChangePassword,
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useBilling,
  useCheckoutSession,
  getMutationErrorMessage,
} from '../api/hooks'

type SettingsTabId = 'profile' | 'notifications' | 'security' | 'billing'

const tabs: { id: SettingsTabId; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

function NotifToggle({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      type="button"
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

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile')

  // ─── Profile state ─────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const updateProfile = useUpdateProfile()

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
      setEmail(user.email ?? '')
      setCompany((user.company as string) ?? '')
    }
  }, [user])

  const saveProfile = () => {
    updateProfile.mutate(
      { firstName, lastName, email },
      {
        onSuccess: () => {
          setProfileSaved(true)
          setTimeout(() => setProfileSaved(false), 2000)
        },
      },
    )
  }

  // ─── Security / Password state ─────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const changePassword = useChangePassword()

  const savePassword = () => {
    if (newPassword !== confirmPassword) return
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setPasswordSaved(true)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setTimeout(() => setPasswordSaved(false), 2000)
        },
      },
    )
  }

  // ─── API Keys ──────────────────────────────────────
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys()
  const createApiKey = useCreateApiKey()
  const revokeApiKey = useRevokeApiKey()
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)

  const generateKey = (type: string) => {
    createApiKey.mutate(
      { type },
      {
        onSuccess: (data: Record<string, unknown>) => {
          const rawKey = (data as { rawKey?: string }).rawKey ?? (data as { key?: string }).key
          if (rawKey) {
            setNewlyCreatedKey(rawKey as string)
          }
        },
      },
    )
  }

  const regenerateKey = (keyId: string, type: string) => {
    revokeApiKey.mutate(keyId, {
      onSuccess: () => generateKey(type),
    })
  }

  // ─── Billing ───────────────────────────────────────
  const { data: billingData, isLoading: billingLoading } = useBilling()
  const billing = billingData as
    | {
        plan?: string
        price?: number
        interval?: string
        nextBillingDate?: string
        usage?: {
          signups?: { used?: number; limit?: number }
          projects?: { used?: number; limit?: number }
        }
      }
    | undefined
  const checkout = useCheckoutSession()

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider mb-1">Settings</h1>
      <p className="text-sm text-nexus-400 mb-8">Manage your account and preferences.</p>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="sm:w-48 shrink-0 flex sm:flex-col gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-cyan-glow/[0.08] text-cyan-glow'
                    : 'text-nexus-400 hover:text-nexus-200 hover:bg-nexus-700/30'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

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
                    <button type="button" className="btn-secondary text-xs py-1.5 px-3">Change Avatar</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">First Name</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Last Name</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Company</label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="input-field" />
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
                {updateProfile.isError && (
                  <p className="text-magenta-glow text-xs mt-3">{getMutationErrorMessage(updateProfile.error)}</p>
                )}
              </div>
              <button
                type="button"
                onClick={saveProfile}
                disabled={updateProfile.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {profileSaved ? 'Saved!' : updateProfile.isPending ? 'Saving...' : 'Save Changes'}
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
                    <input type="password" className="input-field" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">New Password</label>
                    <input type="password" className="input-field" placeholder="Min 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Confirm New Password</label>
                    <input type="password" className="input-field" placeholder="Re-enter new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-amber-glow text-xs">Passwords do not match.</p>
                  )}
                  {changePassword.isError && (
                    <p className="text-magenta-glow text-xs">{getMutationErrorMessage(changePassword.error)}</p>
                  )}
                  {passwordSaved && (
                    <p className="text-emerald-glow text-xs">Password updated successfully.</p>
                  )}
                  <button
                    type="button"
                    onClick={savePassword}
                    disabled={changePassword.isPending || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="btn-primary text-xs"
                  >
                    {changePassword.isPending ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              <div className="card-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Two-Factor Authentication</h2>
                    <p className="text-xs text-nexus-500 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <button type="button" className="btn-secondary text-xs py-1.5 px-3">Enable</button>
                </div>
              </div>

              <div className="card-surface p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">API Keys</h2>
                  <button
                    type="button"
                    onClick={() => generateKey('secret')}
                    disabled={createApiKey.isPending}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Plus size={12} /> Generate Key
                  </button>
                </div>

                {newlyCreatedKey && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-glow/10 border border-emerald-glow/20">
                    <p className="text-xs text-emerald-glow font-semibold mb-1">New key created! Copy it now -- it won't be shown again.</p>
                    <code className="text-xs font-mono text-nexus-200 break-all">{newlyCreatedKey}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newlyCreatedKey)
                        setNewlyCreatedKey(null)
                      }}
                      className="btn-ghost text-xs mt-2"
                    >
                      Copy & Dismiss
                    </button>
                  </div>
                )}

                {keysLoading && <p className="text-xs text-nexus-500">Loading API keys...</p>}

                {!keysLoading && (!apiKeys || apiKeys.length === 0) && (
                  <p className="text-xs text-nexus-500">No API keys yet. Generate one above.</p>
                )}

                <div className="space-y-2">
                  {apiKeys?.map(k => (
                    <div key={k.id} className="flex items-center gap-2 p-3 rounded-lg bg-nexus-900/50 border border-nexus-700/30">
                      <Key size={14} className="text-nexus-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <code className="text-xs font-mono text-nexus-400 truncate block">{k.prefix}...</code>
                        <span className="text-[9px] font-mono text-nexus-600 uppercase tracking-wider">{k.type}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => regenerateKey(k.id, k.type)}
                        disabled={revokeApiKey.isPending || createApiKey.isPending}
                        className="text-xs text-cyan-glow/70 hover:text-cyan-glow font-mono"
                      >
                        Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeApiKey.mutate(k.id)}
                        disabled={revokeApiKey.isPending}
                        className="text-nexus-600 hover:text-magenta-glow transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {(createApiKey.isError || revokeApiKey.isError) && (
                  <p className="text-magenta-glow text-xs mt-2">
                    {getMutationErrorMessage(createApiKey.error ?? revokeApiKey.error)}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="animate-fade-in space-y-5">
              {billingLoading && <p className="text-nexus-500 text-sm">Loading billing info...</p>}

              {!billingLoading && (
                <>
                  <div className="card-surface p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Current Plan</h2>
                      <span className="text-[10px] font-mono bg-cyan-glow/10 text-cyan-glow px-2 py-0.5 rounded-full tracking-wider uppercase">
                        {billing?.plan ?? user?.account?.plan ?? 'FREE'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="font-display text-3xl font-black text-nexus-50">
                        {billing?.price != null ? `$${billing.price}` : '$0'}
                      </span>
                      <span className="text-sm text-nexus-500">
                        / {billing?.interval ?? 'month'}
                      </span>
                    </div>
                    {billing?.nextBillingDate && (
                      <p className="text-xs text-nexus-500 mb-4">Next billing date: {billing.nextBillingDate}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => checkout.mutate({})}
                        disabled={checkout.isPending}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        {checkout.isPending ? 'Redirecting...' : 'Change Plan'}
                      </button>
                      <button type="button" className="btn-ghost text-xs text-nexus-500">Cancel Subscription</button>
                    </div>
                  </div>

                  <div className="card-surface p-6">
                    <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Usage This Month</h2>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-nexus-400">Signups</span>
                          <span className="text-xs font-mono text-nexus-400">
                            {(billing?.usage?.signups?.used ?? 0).toLocaleString()} / {(billing?.usage?.signups?.limit ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-nexus-700/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-glow/60"
                            style={{
                              width: `${billing?.usage?.signups?.limit ? Math.min(((billing.usage.signups.used ?? 0) / billing.usage.signups.limit) * 100, 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-nexus-400">Projects</span>
                          <span className="text-xs font-mono text-nexus-400">
                            {(billing?.usage?.projects?.used ?? 0).toLocaleString()} / {(billing?.usage?.projects?.limit ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-nexus-700/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-glow/60"
                            style={{
                              width: `${billing?.usage?.projects?.limit ? Math.min(((billing.usage.projects.used ?? 0) / billing.usage.projects.limit) * 100, 100) : 0}%`,
                            }}
                          />
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
                        <span className="text-sm text-nexus-200 font-semibold">Manage via billing portal</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => checkout.mutate({})}
                      disabled={checkout.isPending}
                      className="btn-ghost text-xs mt-3"
                    >
                      Update Payment Method
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
