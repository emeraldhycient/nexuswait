import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { api } from './client'
import { useAuth } from '../contexts/AuthContext'

// ─── Projects ──────────────────────────────────────────

export interface Project {
  id: string
  name: string
  slug?: string
  status?: string
  _count?: { subscribers: number }
  [key: string]: unknown
}

export interface CreateProjectBody {
  name: string
  redirectUrl?: string
  webhookUrl?: string
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects')
      return data
    },
  })
}

export function useProject(id: string | undefined) {
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async (body: CreateProjectBody) => {
      const { data } = await api.post<Project>('/projects', body)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate(`/dashboard/project/${data.id}`)
    },
  })
}

export interface UpdateProjectBody {
  name?: string
  redirectUrl?: string
  webhookUrl?: string
  status?: string
  customFields?: Record<string, unknown>[]
}

export function useUpdateProject(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateProjectBody) => {
      const { data } = await api.patch<Project>(`/projects/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject(id: string | undefined) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate('/dashboard')
    },
  })
}

// ─── Subscribers ────────────────────────────────────────

export function useSubscribers(projectId: string | undefined, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['subscribers', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/subscribers`)
      return data
    },
    enabled: !!projectId && (opts.enabled !== false),
  })
}

export function useSubscriberCount(projectId: string | undefined) {
  return useQuery({
    queryKey: ['subscribers', projectId, 'count'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/subscribers/count`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateSubscriber(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post(`/projects/${projectId}/subscribers`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers', projectId] })
      queryClient.invalidateQueries({ queryKey: ['subscribers', projectId, 'count'] })
    },
  })
}

export function useUpdateSubscriber(projectId: string | undefined, subId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/projects/${projectId}/subscribers/${subId}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers', projectId] })
    },
  })
}

export function useDeleteSubscriber(projectId: string | undefined, subId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${projectId}/subscribers/${subId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers', projectId] })
      queryClient.invalidateQueries({ queryKey: ['subscribers', projectId, 'count'] })
    },
  })
}

// ─── Auth ───────────────────────────────────────────────

export function useLogin() {
  const { setToken } = useAuth()
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data } = await api.post<{ token?: string }>('/auth/login', { email, password })
      return data
    },
    onSuccess: (data) => {
      if (data?.token) setToken(data.token)
    },
  })
}

export function useRegister() {
  const { setToken } = useAuth()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<{ token?: string }>('/auth/register', body)
      return data
    },
    onSuccess: (data) => {
      if (data?.token) setToken(data.token)
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { firstName?: string; lastName?: string; email?: string }) => {
      const { data } = await api.patch('/auth/me', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.post('/auth/change-password', body)
      return data
    },
  })
}

// ─── Account / Billing ──────────────────────────────────

export function useAccount() {
  return useQuery({
    queryKey: ['account'],
    queryFn: async () => {
      const { data } = await api.get('/account')
      return data
    },
  })
}

export function useBilling() {
  return useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      const { data } = await api.get('/account/billing')
      return data
    },
  })
}

export function useCheckoutSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<{ url?: string }>('/payments/checkout/session', body)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] })
      if (data?.url) window.location.href = data.url
    },
  })
}

// ─── API Keys ───────────────────────────────────────────

export interface ApiKey {
  id: string
  prefix: string
  type: string
  projectId?: string
  createdAt: string
}

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await api.get<ApiKey[]>('/api-keys')
      return data
    },
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { type: string; projectId?: string }) => {
      const { data } = await api.post('/api-keys', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api-keys/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

// ─── Hosted Pages ───────────────────────────────────────

export function useHostedPage(projectId: string | undefined) {
  return useQuery({
    queryKey: ['hosted-page', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/page`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useUpsertHostedPage(projectId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.put(`/projects/${projectId}/page`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosted-page', projectId] })
    },
  })
}

export function useUpdateHostedPage(projectId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/projects/${projectId}/page`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosted-page', projectId] })
    },
  })
}

export function usePublishHostedPage(projectId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/projects/${projectId}/page/publish`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosted-page', projectId] })
    },
  })
}

export function useUnpublishHostedPage(projectId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/projects/${projectId}/page/unpublish`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosted-page', projectId] })
    },
  })
}

// ─── Integrations ───────────────────────────────────────

export function useIntegrations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['integrations', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/integrations`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateIntegration(projectId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post(`/projects/${projectId}/integrations`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] })
    },
  })
}

export function useUpdateIntegration(projectId: string | undefined, integrationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/projects/${projectId}/integrations/${integrationId}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] })
    },
  })
}

export function useDeleteIntegration(projectId: string | undefined, integrationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${projectId}/integrations/${integrationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] })
    },
  })
}

export function useTestIntegration(projectId: string | undefined, integrationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/projects/${projectId}/integrations/${integrationId}/test`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] })
    },
  })
}

// ─── Analytics ──────────────────────────────────────────

export function useAnalyticsOverview(projectId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', projectId, 'overview'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/analytics/overview`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useAnalyticsTimeseries(projectId: string | undefined, period = '7d', granularity = 'day') {
  return useQuery({
    queryKey: ['analytics', projectId, 'timeseries', period, granularity],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/analytics/timeseries`, {
        params: { period, granularity },
      })
      return data
    },
    enabled: !!projectId,
  })
}

export function useAnalyticsSources(projectId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', projectId, 'sources'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/analytics/sources`)
      return data
    },
    enabled: !!projectId,
  })
}

// ─── Notifications (In-App) ─────────────────────────────

export interface InAppNotification {
  id: string
  accountId: string
  title: string
  body: string
  type: string
  actionUrl?: string
  readAt: string | null
  createdAt: string
}

export function useNotificationInbox(opts: { unreadOnly?: boolean } = {}) {
  return useQuery<InAppNotification[]>({
    queryKey: ['notifications', 'inbox', opts.unreadOnly ? 'unread' : 'all'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/inbox', {
        params: { unreadOnly: opts.unreadOnly ? 'true' : 'false' },
      })
      return data
    },
    refetchInterval: 30_000,
  })
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/inbox/unread-count')
      return data
    },
    refetchInterval: 15_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/inbox/${id}/read`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/notifications/inbox/read-all')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/inbox/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// ─── Notification Preferences ───────────────────────────

export interface NotificationPreference {
  id: string | null
  event: string
  label: string
  channels: string[]
  enabled: boolean
}

export function useNotificationPreferences() {
  return useQuery<NotificationPreference[]>({
    queryKey: ['notifications', 'preferences'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/preferences')
      return data
    },
  })
}

export function useUpsertNotificationPreference() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { event: string; channels: string[]; enabled?: boolean }) => {
      const { data } = await api.post('/notifications/preferences', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] })
    },
  })
}

// ─── Notification Templates ─────────────────────────────

export interface NotificationTemplate {
  id: string
  name: string
  channel: string
  subject?: string
  body: string
  accountId?: string
  createdAt: string
  updatedAt: string
}

export function useNotificationTemplates() {
  return useQuery<NotificationTemplate[]>({
    queryKey: ['notifications', 'templates'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/templates')
      return data
    },
  })
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; channel: string; subject?: string; body: string }) => {
      const { data } = await api.post('/notifications/templates', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'templates'] })
    },
  })
}

export function useUpdateNotificationTemplate(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name?: string; channel?: string; subject?: string; body?: string }) => {
      const { data } = await api.patch(`/notifications/templates/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'templates'] })
    },
  })
}

export function useDeleteNotificationTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/templates/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'templates'] })
    },
  })
}

// ─── Referrals ──────────────────────────────────────────

export function useReferralLeaderboard(projectId: string | undefined) {
  return useQuery({
    queryKey: ['referrals', projectId, 'leaderboard'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/referrals/leaderboard`)
      return data
    },
    enabled: !!projectId,
  })
}

// ─── Admin ──────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats')
      return data
    },
  })
}

export function useAdminAccounts(params: { search?: string; plan?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['admin', 'accounts', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/accounts', { params })
      return data
    },
  })
}

export function useAdminAccount(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'account', id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/accounts/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useAdminUpdateAccount(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/admin/accounts/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'account', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminProjects(params: { search?: string; status?: string; accountId?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['admin', 'projects', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/projects', { params })
      return data
    },
  })
}

export function useAdminUpdateProject(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.patch(`/admin/projects/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminRecentSubscribers() {
  return useQuery({
    queryKey: ['admin', 'subscribers', 'recent'],
    queryFn: async () => {
      const { data } = await api.get('/admin/subscribers/recent')
      return data
    },
  })
}

export function useAdminFlaggedSubscribers() {
  return useQuery({
    queryKey: ['admin', 'subscribers', 'flagged'],
    queryFn: async () => {
      const { data } = await api.get('/admin/subscribers/flagged')
      return data
    },
  })
}

export function useAdminIntegrationHealth() {
  return useQuery({
    queryKey: ['admin', 'integrations', 'health'],
    queryFn: async () => {
      const { data } = await api.get('/admin/integrations/health')
      return data
    },
  })
}

export function useAdminNotificationQueue() {
  return useQuery({
    queryKey: ['admin', 'notifications', 'queue'],
    queryFn: async () => {
      const { data } = await api.get('/admin/notifications/queue')
      return data
    },
  })
}

export function useAdminSystemHealth() {
  return useQuery({
    queryKey: ['admin', 'system'],
    queryFn: async () => {
      const { data } = await api.get('/admin/system')
      return data
    },
  })
}

// ─── Platform Config ─────────────────────────────────────

export interface PlatformConfig {
  apiBaseUrl: string
  cdnBaseUrl: string
}

const PLATFORM_CONFIG_DEFAULTS: PlatformConfig = {
  apiBaseUrl: 'https://api.nexuswait.io',
  cdnBaseUrl: 'https://cdn.nexuswait.io',
}

export function usePlatformConfig() {
  return useQuery<PlatformConfig>({
    queryKey: ['platform-config'],
    queryFn: async () => {
      const { data } = await api.get<PlatformConfig>('/config')
      return data
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: PLATFORM_CONFIG_DEFAULTS,
  })
}

export function useAdminPlatformConfig() {
  return useQuery<PlatformConfig>({
    queryKey: ['admin', 'platform-config'],
    queryFn: async () => {
      const { data } = await api.get<PlatformConfig>('/admin/config')
      return data
    },
  })
}

export function useUpdatePlatformConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<PlatformConfig>) => {
      const { data } = await api.patch<PlatformConfig>('/admin/config', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'platform-config'] })
      queryClient.invalidateQueries({ queryKey: ['platform-config'] })
    },
  })
}

// ─── Public Pages ───────────────────────────────────────

export function usePublicPage(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-page', slug],
    queryFn: async () => {
      const { data } = await api.get(`/pages/${slug}`)
      return data
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePublicSubscriberCount(projectId: string | undefined) {
  return useQuery({
    queryKey: ['public-subscriber-count', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/subscribers/count`)
      return data
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  })
}

export function usePublicCreateSubscriber(projectId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post(`/projects/${projectId}/subscribers`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-subscriber-count', projectId] })
    },
  })
}

// ─── Helpers ────────────────────────────────────────────

export function getMutationErrorMessage(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>
  return err.response?.data?.message ?? 'Request failed'
}
