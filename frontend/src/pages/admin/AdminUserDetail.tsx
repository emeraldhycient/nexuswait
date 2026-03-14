import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, KeyRound, Shield, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  useAdminUser,
  useAdminUpdateUser,
  useAdminDeleteUser,
  useAdminResetPassword,
} from '../../api/hooks'

const planBadge: Record<string, string> = {
  spark: 'bg-cyan-glow/10 text-cyan-glow',
  pulse: 'bg-violet-glow/10 text-violet-glow',
  nexus: 'bg-magenta-glow/10 text-magenta-glow',
  enterprise: 'bg-amber-glow/10 text-amber-glow',
}

const roleBadge: Record<string, string> = {
  admin: 'bg-magenta-glow/15 text-magenta-glow',
  user: 'bg-nexus-700/30 text-nexus-400',
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { data: user, isLoading, error } = useAdminUser(id)
  const updateMutation = useAdminUpdateUser(id)
  const deleteMutation = useAdminDeleteUser(id)
  const resetPwMutation = useAdminResetPassword(id)

  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isSelf = currentUser?.id === id

  if (isLoading) return <div className="p-6 text-nexus-400">Loading...</div>
  if (error || !user) return <div className="p-6 text-magenta-glow">Failed to load user.</div>

  const u = user as Record<string, unknown>
  const roles = (u.roles as string[]) ?? ['user']
  const provider = (u.provider as string) ?? 'local'
  const account = u.account as Record<string, unknown> | null
  const accountPlan = ((account?.plan as string) ?? 'spark').toLowerCase()
  const accountProjects: Record<string, unknown>[] = (account?.projects as Record<string, unknown>[]) ?? []
  const createdAt = u.createdAt ? new Date(u.createdAt as string).toLocaleDateString() : '—'
  const isAdmin = roles.includes('admin')
  const isGoogleOnly = provider === 'google'

  const startEditing = () => {
    setFirstName((u.firstName as string) ?? '')
    setLastName((u.lastName as string) ?? '')
    setEmail((u.email as string) ?? '')
    setEditing(true)
  }

  const handleSaveProfile = () => {
    updateMutation.mutate(
      { firstName, lastName, email },
      { onSuccess: () => setEditing(false) },
    )
  }

  const handleToggleAdmin = () => {
    const newRoles = isAdmin ? ['user'] : ['user', 'admin']
    updateMutation.mutate({ roles: newRoles })
  }

  const handleResetPassword = () => {
    if (!tempPassword || tempPassword.length < 8) return
    resetPwMutation.mutate(
      { temporaryPassword: tempPassword },
      { onSuccess: () => setTempPassword('') },
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => navigate('/admin/users'),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/users" className="text-nexus-500 hover:text-nexus-200 transition-colors no-underline">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black text-nexus-50 tracking-wider">User Detail</h1>
          <p className="text-sm text-nexus-400 mt-0.5">ID: <span className="font-mono text-nexus-500">{id}</span></p>
        </div>
      </div>

      {/* User Info */}
      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">User Information</h2>
          {!editing && (
            <button type="button" onClick={startEditing} className="text-xs text-cyan-glow hover:text-cyan-glow/80 transition-colors font-mono">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="input-field w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field w-full max-w-md" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={handleSaveProfile} disabled={updateMutation.isPending} className="btn-primary flex items-center gap-2 disabled:opacity-40">
                <Save size={14} />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost text-sm">Cancel</button>
            </div>
            {updateMutation.isSuccess && <p className="text-xs text-emerald-glow mt-2">User updated successfully.</p>}
            {updateMutation.isError && <p className="text-xs text-magenta-glow mt-2">Failed to update user.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Email</div>
              <div className="text-sm text-nexus-200 font-mono">{(u.email as string) ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Name</div>
              <div className="text-sm text-nexus-200">
                {[(u.firstName as string), (u.lastName as string)].filter(Boolean).join(' ') || '—'}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Provider</div>
              <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${provider === 'google' ? 'bg-cyan-glow/10 text-cyan-glow' : 'bg-nexus-700/30 text-nexus-400'}`}>
                {provider}
              </span>
            </div>
            <div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Created</div>
              <div className="text-sm text-nexus-200">{createdAt}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Account</div>
              <Link to={`/admin/accounts/${u.accountId}`} className="text-sm text-cyan-glow hover:text-cyan-glow/80 font-mono no-underline">
                {(u.accountId as string)?.slice(0, 8)}...
              </Link>
            </div>
            <div>
              <div className="text-xs font-mono text-nexus-500 tracking-wider uppercase mb-1">Account Plan</div>
              <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${planBadge[accountPlan] ?? 'bg-nexus-600/10 text-nexus-400'}`}>
                {accountPlan}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Role Management */}
      <div className="card-surface p-6">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-5">Role Management</h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r: string) => (
              <span key={r} className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${roleBadge[r] ?? 'bg-nexus-700/30 text-nexus-400'}`}>
                {r}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleToggleAdmin}
            disabled={updateMutation.isPending || isSelf}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-30 ${
              isAdmin
                ? 'bg-magenta-glow/10 text-magenta-glow hover:bg-magenta-glow/20'
                : 'bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20'
            }`}
            title={isSelf ? 'Cannot modify your own admin role' : undefined}
          >
            <Shield size={13} />
            {isAdmin ? 'Revoke Admin' : 'Grant Admin'}
          </button>
        </div>
        {isSelf && <p className="text-xs text-nexus-500 mt-2">You cannot modify your own admin role.</p>}
      </div>

      {/* Projects */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase">Projects ({accountProjects.length})</h2>
        </div>
        {accountProjects.length === 0 ? (
          <div className="px-6 pb-5 text-sm text-nexus-500">No projects in this account.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-glow/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase">Subscribers</th>
                </tr>
              </thead>
              <tbody>
                {accountProjects.map((p, i) => (
                  <tr key={(p.id as string) ?? i} className="border-b border-nexus-700/10 hover:bg-nexus-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-nexus-200">{(p.name as string) ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${(p.status as string) === 'active' ? 'bg-emerald-glow' : 'bg-nexus-500'}`} />
                        <span className="text-xs text-nexus-400 font-mono">{(p.status as string) ?? 'unknown'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-nexus-300 font-mono">
                      {((p._count as Record<string, number>)?.subscribers ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Reset */}
      <div className="card-surface p-6">
        <h2 className="font-display text-sm font-bold text-nexus-200 tracking-widest uppercase mb-5">Password Reset</h2>
        {isGoogleOnly ? (
          <p className="text-sm text-nexus-500">This user signed in with Google only. Password reset is not available.</p>
        ) : (
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-mono text-nexus-400 tracking-wider uppercase mb-1.5">Temporary Password</label>
              <input
                type="text"
                value={tempPassword}
                onChange={e => setTempPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="input-field w-64"
              />
            </div>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetPwMutation.isPending || tempPassword.length < 8}
              className="btn-primary flex items-center gap-2 disabled:opacity-40"
            >
              <KeyRound size={14} />
              {resetPwMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        )}
        {resetPwMutation.isSuccess && <p className="text-xs text-emerald-glow mt-2">Password has been reset.</p>}
        {resetPwMutation.isError && <p className="text-xs text-magenta-glow mt-2">Failed to reset password.</p>}
      </div>

      {/* Delete User */}
      <div className="card-surface p-6 border border-magenta-glow/10">
        <h2 className="font-display text-sm font-bold text-magenta-glow tracking-widest uppercase mb-4">Danger Zone</h2>
        {confirmDelete ? (
          <div className="space-y-3">
            <p className="text-sm text-nexus-300">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-magenta-glow/10 text-magenta-glow font-mono text-sm font-bold hover:bg-magenta-glow/20 transition-all disabled:opacity-40"
              >
                <Trash2 size={14} />
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost text-sm flex items-center gap-1.5">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={isSelf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-magenta-glow/10 text-magenta-glow font-mono text-sm font-bold hover:bg-magenta-glow/20 transition-all disabled:opacity-30"
            title={isSelf ? 'Cannot delete your own account' : undefined}
          >
            <Trash2 size={14} />
            Delete User
          </button>
        )}
        {isSelf && <p className="text-xs text-nexus-500 mt-2">You cannot delete your own account.</p>}
        {deleteMutation.isError && <p className="text-xs text-magenta-glow mt-2">Failed to delete user.</p>}
      </div>
    </div>
  )
}
