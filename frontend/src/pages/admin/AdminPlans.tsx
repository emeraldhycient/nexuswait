import { useState, useEffect } from 'react'
import {
  CreditCard, Save, Loader2, Trash2, Plus, X, Star, AlertTriangle,
} from 'lucide-react'
import {
  useAdminPlans,
  useAdminUpsertPlan,
  useAdminDeletePlan,
  getMutationErrorMessage,
} from '../../api/hooks'
import type { PlanConfig } from '../../api/hooks'

const TIERS = ['spark', 'pulse', 'nexus', 'enterprise'] as const
const TIER_COLORS: Record<string, string> = {
  spark: 'cyan-glow',
  pulse: 'violet-glow',
  nexus: 'magenta-glow',
  enterprise: 'amber-glow',
}

function emptyPlan(tier: string): Partial<PlanConfig> {
  return {
    tier,
    displayName: tier.charAt(0).toUpperCase() + tier.slice(1),
    description: '',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxProjects: null,
    maxSubscribersMonth: null,
    maxIntegrations: null,
    features: [],
    polarProductIdMonthly: null,
    polarProductIdYearly: null,
    highlight: false,
    ctaText: 'Get Started',
    sortOrder: 0,
  }
}

interface PlanCardProps {
  plan: Partial<PlanConfig>
  onSave: (plan: Partial<PlanConfig>) => void
  onDelete?: () => void
  saving: boolean
  deleting: boolean
}

function PlanCard({ plan, onSave, onDelete, saving, deleting }: PlanCardProps) {
  const [edit, setEdit] = useState<Partial<PlanConfig>>(plan)
  const [newFeature, setNewFeature] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setEdit(plan)
    setDirty(false)
  }, [plan])

  const update = (patch: Partial<PlanConfig>) => {
    setEdit(prev => ({ ...prev, ...patch }))
    setDirty(true)
  }

  const addFeature = () => {
    if (!newFeature.trim()) return
    update({ features: [...(edit.features ?? []), newFeature.trim()] })
    setNewFeature('')
  }

  const removeFeature = (idx: number) => {
    update({ features: (edit.features ?? []).filter((_, i) => i !== idx) })
  }

  const color = TIER_COLORS[edit.tier ?? ''] ?? 'cyan-glow'

  return (
    <div className={`card-surface p-6 flex flex-col gap-4 ${edit.highlight ? `border-${color}/25` : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}/10`}>
            <CreditCard size={15} className={`text-${color}`} />
          </div>
          <span className={`text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-${color}/10 text-${color}`}>
            {edit.tier}
          </span>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-nexus-600 hover:text-magenta-glow transition-colors"
            title="Delete plan"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Display Name + Description */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Display Name</label>
          <input
            type="text"
            value={edit.displayName ?? ''}
            onChange={e => update({ displayName: e.target.value })}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">CTA Text</label>
          <input
            type="text"
            value={edit.ctaText ?? ''}
            onChange={e => update({ ctaText: e.target.value })}
            className="input-field text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Description</label>
        <input
          type="text"
          value={edit.description ?? ''}
          onChange={e => update({ description: e.target.value })}
          className="input-field text-sm"
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Monthly ($)</label>
          <input
            type="number"
            step="0.01"
            value={((edit.monthlyPriceCents ?? 0) / 100).toFixed(2)}
            onChange={e => update({ monthlyPriceCents: Math.round(parseFloat(e.target.value || '0') * 100) })}
            className="input-field text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Yearly ($)</label>
          <input
            type="number"
            step="0.01"
            value={((edit.yearlyPriceCents ?? 0) / 100).toFixed(2)}
            onChange={e => update({ yearlyPriceCents: Math.round(parseFloat(e.target.value || '0') * 100) })}
            className="input-field text-sm font-mono"
          />
        </div>
      </div>

      {/* Limits */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Max Projects</label>
          <input
            type="number"
            placeholder="Unlimited"
            value={edit.maxProjects ?? ''}
            onChange={e => update({ maxProjects: e.target.value ? parseInt(e.target.value) : null })}
            className="input-field text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Max Signups/mo</label>
          <input
            type="number"
            placeholder="Unlimited"
            value={edit.maxSubscribersMonth ?? ''}
            onChange={e => update({ maxSubscribersMonth: e.target.value ? parseInt(e.target.value) : null })}
            className="input-field text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Max Integrations</label>
          <input
            type="number"
            placeholder="Unlimited"
            value={edit.maxIntegrations ?? ''}
            onChange={e => update({ maxIntegrations: e.target.value ? parseInt(e.target.value) : null })}
            className="input-field text-sm font-mono"
          />
        </div>
      </div>

      {/* Polar Product IDs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Polar Product (Monthly)</label>
          <input
            type="text"
            placeholder="polar_prod_..."
            value={edit.polarProductIdMonthly ?? ''}
            onChange={e => update({ polarProductIdMonthly: e.target.value || null })}
            className="input-field text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1">Polar Product (Yearly)</label>
          <input
            type="text"
            placeholder="polar_prod_..."
            value={edit.polarProductIdYearly ?? ''}
            onChange={e => update({ polarProductIdYearly: e.target.value || null })}
            className="input-field text-sm font-mono"
          />
        </div>
      </div>

      {/* Highlight + Sort */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-nexus-300 cursor-pointer">
          <input
            type="checkbox"
            checked={edit.highlight ?? false}
            onChange={e => update({ highlight: e.target.checked })}
            className="accent-cyan-400"
          />
          <Star size={12} /> Highlight Card
        </label>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono text-nexus-500 tracking-wider uppercase">Sort</label>
          <input
            type="number"
            value={edit.sortOrder ?? 0}
            onChange={e => update({ sortOrder: parseInt(e.target.value) || 0 })}
            className="input-field text-sm font-mono w-16"
          />
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="block text-[10px] font-mono text-nexus-500 tracking-wider uppercase mb-1.5">Features</label>
        <div className="space-y-1.5 mb-2">
          {(edit.features ?? []).map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-nexus-900/50 border border-nexus-700/20">
              <span className="flex-1 text-xs text-nexus-300 truncate">{f}</span>
              <button type="button" onClick={() => removeFeature(i)} className="text-nexus-600 hover:text-magenta-glow shrink-0">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            placeholder="Add feature..."
            className="input-field text-xs flex-1"
          />
          <button type="button" onClick={addFeature} className="btn-ghost text-xs px-2 py-1">
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={() => onSave(edit)}
        disabled={saving || !dirty}
        className={`btn-primary text-xs flex items-center gap-2 justify-center mt-2 ${!dirty ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? 'Saving...' : 'Save Plan'}
      </button>
    </div>
  )
}

export default function AdminPlans() {
  const { data: plans, isLoading, error } = useAdminPlans()
  const upsertPlan = useAdminUpsertPlan()
  const deletePlan = useAdminDeletePlan()
  const [saveError, setSaveError] = useState<string | null>(null)

  if (isLoading) return <div className="p-6 text-nexus-400">Loading plan configurations...</div>
  if (error) return <div className="p-6 text-magenta-glow">Failed to load plans.</div>

  const plansByTier: Record<string, PlanConfig> = {}
  ;(plans ?? []).forEach(p => { plansByTier[p.tier] = p })

  const handleSave = (plan: Partial<PlanConfig>) => {
    setSaveError(null)
    const { tier, ...body } = plan
    if (!tier) return
    upsertPlan.mutate(
      { tier, ...body },
      { onError: (err) => setSaveError(getMutationErrorMessage(err)) },
    )
  }

  const handleDelete = (tier: string) => {
    if (!confirm(`Delete the "${tier}" plan configuration? This cannot be undone.`)) return
    deletePlan.mutate(tier)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">Plan Management</h1>
        <p className="text-sm text-nexus-400 mt-1">Configure pricing tiers, limits, and features for all plans.</p>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-magenta-glow/10 border border-magenta-glow/20 text-magenta-glow text-xs">
          <AlertTriangle size={14} /> {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {TIERS.map((tier, i) => (
          <div key={tier} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <PlanCard
              plan={plansByTier[tier] ?? emptyPlan(tier)}
              onSave={handleSave}
              onDelete={plansByTier[tier] ? () => handleDelete(tier) : undefined}
              saving={upsertPlan.isPending}
              deleting={deletePlan.isPending}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
