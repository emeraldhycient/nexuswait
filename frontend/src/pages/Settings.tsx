import { useState, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import { User, Bell, Shield, CreditCard, Key, Save, Plus, Trash2, Loader2, AlertTriangle, ArrowUpRight, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  useUpdateProfile,
  useChangePassword,
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useBilling,
  useCheckoutSession,
  usePlans,
  useCancelSubscription,
  getMutationErrorMessage,
} from '../api/hooks'
import type { PlanConfig } from '../api/hooks'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

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
  useDocumentTitle('Settings')
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
        planConfig?: PlanConfig
        price?: number
        interval?: string
        nextBillingDate?: string
        usage?: {
          signups?: { used?: number; limit?: number | null }
          projects?: { used?: number; limit?: number | null }
          integrations?: { used?: number; limit?: number | null }
        }
        polarSubscription?: Record<string, unknown>
      }
    | undefined
  const checkout = useCheckoutSession()
  const { data: allPlans } = usePlans()
  const cancelSub = useCancelSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [annual, setAnnual] = useState(true)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

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
                  {/* Current Plan */}
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
                        onClick={() => setShowUpgrade(!showUpgrade)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <ArrowUpRight size={12} /> Change Plan
                      </button>
                      {billing?.plan && billing.plan !== 'spark' && (
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          className="btn-ghost text-xs text-nexus-500 hover:text-magenta-glow"
                        >
                          Cancel Subscription
                        </button>
                      )}
                    </div>

                    {/* Cancel confirmation */}
                    {showCancelConfirm && (
                      <div className="mt-4 p-4 rounded-lg bg-magenta-glow/5 border border-magenta-glow/20">
                        <p className="text-sm text-nexus-200 mb-3">
                          Are you sure you want to cancel? Your plan will be downgraded at the end of the current billing period.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => cancelSub.mutate(undefined, { onSuccess: () => setShowCancelConfirm(false) })}
                            disabled={cancelSub.isPending}
                            className="btn-primary text-xs bg-magenta-glow hover:bg-magenta-glow/80 flex items-center gap-1.5"
                          >
                            {cancelSub.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                            {cancelSub.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCancelConfirm(false)}
                            className="btn-ghost text-xs"
                          >
                            Keep Plan
                          </button>
                        </div>
                        {cancelSub.isError && (
                          <p className="text-magenta-glow text-xs mt-2">{getMutationErrorMessage(cancelSub.error)}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upgrade selector */}
                  {showUpgrade && allPlans && allPlans.length > 0 && (
                    <div className="card-surface p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Choose a Plan</h2>
                        <div className="flex gap-1 p-0.5 rounded-full bg-nexus-800/50 border border-nexus-700/20">
                          <button
                            type="button"
                            onClick={() => setAnnual(false)}
                            className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${!annual ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-nexus-500'}`}
                          >
                            Monthly
                          </button>
                          <button
                            type="button"
                            onClick={() => setAnnual(true)}
                            className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${annual ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-nexus-500'}`}
                          >
                            Annual
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3">
                        {allPlans.map((p: PlanConfig) => {
                          const isCurrent = p.tier === (billing?.plan ?? 'spark')
                          const isSelected = selectedTier === p.tier
                          const price = annual ? p.yearlyPriceCents : p.monthlyPriceCents
                          const productId = annual ? p.polarProductIdYearly : p.polarProductIdMonthly
                          const isEnterprise = p.tier === 'enterprise'
                          const canSelect = !isCurrent && !isEnterprise
                          return (
                            <div
                              key={p.tier}
                              role={canSelect ? 'button' : undefined}
                              tabIndex={canSelect ? 0 : undefined}
                              onClick={() => canSelect && setSelectedTier(isSelected ? null : p.tier)}
                              onKeyDown={(e) => e.key === 'Enter' && canSelect && setSelectedTier(isSelected ? null : p.tier)}
                              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                                isCurrent
                                  ? 'border-cyan-glow/25 bg-cyan-glow/[0.03]'
                                  : isSelected
                                    ? 'border-cyan-glow/60 bg-cyan-glow/[0.06] shadow-[0_0_20px_rgba(0,255,255,0.08)]'
                                    : canSelect
                                      ? 'border-nexus-700/20 hover:border-nexus-500/30 cursor-pointer'
                                      : 'border-nexus-700/20 opacity-60'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-nexus-200">{p.displayName}</span>
                                  {isCurrent && (
                                    <span className="text-[8px] font-mono bg-cyan-glow/10 text-cyan-glow px-1.5 py-0.5 rounded tracking-wider">CURRENT</span>
                                  )}
                                  {isSelected && !isCurrent && (
                                    <span className="text-[8px] font-mono bg-cyan-glow/15 text-cyan-glow px-1.5 py-0.5 rounded tracking-wider">SELECTED</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-sm font-mono font-bold text-nexus-100">
                                    {price > 0 ? `$${(price / 100).toFixed(0)}/mo` : isEnterprise ? 'Custom' : 'Free'}
                                  </span>
                                  <span className="text-xs text-nexus-500">
                                    {p.maxProjects != null ? `${p.maxProjects} projects` : 'Unlimited projects'}
                                    {' | '}
                                    {p.maxSubscribersMonth != null ? `${p.maxSubscribersMonth.toLocaleString()} signups/mo` : 'Unlimited signups'}
                                  </span>
                                </div>
                              </div>
                              {isSelected && productId && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); checkout.mutate({ productId }) }}
                                  disabled={checkout.isPending}
                                  className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
                                >
                                  {checkout.isPending ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
                                  {checkout.isPending ? 'Redirecting...' : 'Confirm'}
                                </button>
                              )}
                              {isSelected && !productId && !isEnterprise && (
                                <span className="text-[10px] text-amber-glow font-mono">Syncing with Polar...</span>
                              )}
                              {isEnterprise && !isCurrent && (
                                <a href="mailto:sales@nexuswait.io" className="btn-secondary text-xs py-1.5 px-4 no-underline">Contact Sales</a>
                              )}
                              {isCurrent && <Check size={16} className="text-cyan-glow" />}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Usage */}
                  <div className="card-surface p-6">
                    <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-4">Usage This Month</h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Signups', data: billing?.usage?.signups, color: 'cyan-glow' },
                        { label: 'Projects', data: billing?.usage?.projects, color: 'violet-glow' },
                        { label: 'Integrations', data: billing?.usage?.integrations, color: 'magenta-glow' },
                      ].map(item => {
                        const used = item.data?.used ?? 0
                        const limit = item.data?.limit
                        const pct = limit ? Math.min((used / limit) * 100, 100) : 0
                        const isWarning = limit != null && pct >= 80 && pct < 100
                        const isMaxed = limit != null && pct >= 100
                        return (
                          <div key={item.label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-nexus-400">{item.label}</span>
                              <span className="text-xs font-mono text-nexus-400">
                                {used.toLocaleString()} / {limit != null ? limit.toLocaleString() : 'Unlimited'}
                              </span>
                            </div>
                            <div className="h-2 bg-nexus-700/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isMaxed ? 'bg-magenta-glow' : isWarning ? 'bg-amber-glow' : `bg-${item.color}/60`
                                }`}
                                style={{ width: limit ? `${pct}%` : '0%' }}
                              />
                            </div>
                            {isWarning && (
                              <p className="flex items-center gap-1 text-[10px] text-amber-glow mt-1">
                                <AlertTriangle size={10} /> Approaching limit ({pct.toFixed(0)}% used)
                              </p>
                            )}
                            {isMaxed && (
                              <p className="flex items-center gap-1 text-[10px] text-magenta-glow mt-1">
                                <AlertTriangle size={10} /> Limit reached!{' '}
                                <button type="button" onClick={() => setShowUpgrade(true)} className="underline hover:text-magenta-glow/80">
                                  Upgrade now
                                </button>
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Payment Method */}
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
