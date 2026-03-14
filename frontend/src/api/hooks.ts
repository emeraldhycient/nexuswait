import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const { token } = useAuth()
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects')
      return data
    },
    enabled: !!token,
  })
}

export function useProjectsPaginated(params: {
  search?: string; status?: string;
  page?: number; limit?: number;
  sortBy?: string; sortOrder?: string;
} = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['projects', 'paginated', params],
    queryFn: async () => {
      const qp = new URLSearchParams()
      if (params.search) qp.set('search', params.search)
      if (params.status) qp.set('status', params.status)
      if (params.page) qp.set('page', String(params.page))
      if (params.limit) qp.set('limit', String(params.limit))
      if (params.sortBy) qp.set('sortBy', params.sortBy)
      if (params.sortOrder) qp.set('sortOrder', params.sortOrder)
      const { data } = await api.get(`/projects/paginated?${qp}`)
      return data as { data: Project[]; total: number; page: number; limit: number }
    },
    enabled: !!token,
  })
}

export function useProject(id: string | undefined) {
  const { token } = useAuth()
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${id}`)
      return data
    },
    enabled: !!id && !!token,
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

export function useSubscribers(
  projectId: string | undefined,
  filters: { search?: string; source?: string; sort?: string } = {},
  opts: { enabled?: boolean } = {},
) {
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['subscribers', projectId, filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('limit', '50')
      if (filters.search) params.set('search', filters.search)
      if (filters.source) params.set('source', filters.source)
      if (filters.sort) params.set('sort', filters.sort)
      if (pageParam) params.set('cursor', pageParam)
      const { data } = await api.get(`/projects/${projectId}/subscribers?${params}`)
      return data as { data: unknown[]; nextCursor: string | null }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token && !!projectId && (opts.enabled !== false),
  })
}

export function useSubscriberCount(projectId: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['subscribers', projectId, 'count'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/subscribers/count`)
      return data
    },
    enabled: !!token && !!projectId,
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

export function useGoogleAuth() {
  const { setToken } = useAuth()
  return useMutation({
    mutationFn: async (accessToken: string) => {
      const { data } = await api.post<{ token?: string }>('/auth/google', { accessToken })
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
  const { token } = useAuth()
  return useQuery({
    queryKey: ['account'],
    queryFn: async () => {
      const { data } = await api.get('/account')
      return data
    },
    enabled: !!token,
  })
}

export function useBilling() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      const { data } = await api.get('/account/billing')
      return data
    },
    enabled: !!token,
  })
}

export function useCheckoutSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<{ url?: string }>('/payments/checkout/session', {
        ...body,
        successUrl: body.successUrl || `${window.location.origin}/dashboard/settings?billing=1&checkout=success`,
        cancelUrl: body.cancelUrl || `${window.location.origin}/dashboard/settings?billing=1&checkout=cancelled`,
      })
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
  const { token } = useAuth()
  return useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await api.get<ApiKey[]>('/api-keys')
      return data
    },
    enabled: !!token,
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
  const { token } = useAuth()
  return useQuery({
    queryKey: ['hosted-page', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/page`)
      return data
    },
    enabled: !!token && !!projectId,
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
  const { token } = useAuth()
  return useQuery({
    queryKey: ['integrations', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/integrations`)
      return data
    },
    enabled: !!token && !!projectId,
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
  const { token } = useAuth()
  return useQuery({
    queryKey: ['analytics', projectId, 'overview'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/analytics/overview`)
      return data
    },
    enabled: !!token && !!projectId,
  })
}

export function useAnalyticsTimeseries(projectId: string | undefined, period = '7d', granularity = 'day') {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['analytics', projectId, 'timeseries', period, granularity],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/analytics/timeseries`, {
        params: { period, granularity },
      })
      return data
    },
    enabled: !!token && !!projectId,
  })
}

export function useAnalyticsSources(projectId: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['analytics', projectId, 'sources'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/analytics/sources`)
      return data
    },
    enabled: !!token && !!projectId,
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
  const { token } = useAuth()
  return useQuery<InAppNotification[]>({
    queryKey: ['notifications', 'inbox', opts.unreadOnly ? 'unread' : 'all'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/inbox', {
        params: { unreadOnly: opts.unreadOnly ? 'true' : 'false' },
      })
      return data
    },
    refetchInterval: 30_000,
    enabled: !!token,
  })
}

export function useUnreadCount() {
  const { token } = useAuth()
  return useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/inbox/unread-count')
      return data
    },
    refetchInterval: 15_000,
    enabled: !!token,
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
  const { token } = useAuth()
  return useQuery<NotificationPreference[]>({
    queryKey: ['notifications', 'preferences'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/preferences')
      return data
    },
    enabled: !!token,
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
  const { token } = useAuth()
  return useQuery<NotificationTemplate[]>({
    queryKey: ['notifications', 'templates'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/templates')
      return data
    },
    enabled: !!token,
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
  const { token } = useAuth()
  return useQuery({
    queryKey: ['referrals', projectId, 'leaderboard'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/referrals/leaderboard`)
      return data
    },
    enabled: !!token && !!projectId,
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

export function useAdminAccounts(params: { search?: string; plan?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}) {
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

export function useAdminProjects(params: { search?: string; status?: string; accountId?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'projects', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/projects', { params })
      return data
    },
  })
}

export function useAdminProject(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'project', id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/projects/${id}`)
      return data
    },
    enabled: !!id,
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'project', id] })
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

export function useAdminSubscribers(params: { search?: string; source?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'subscribers', 'list', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/subscribers', { params })
      return data
    },
  })
}

export function useAdminFailedIntegrationsPaginated(params: { search?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'integrations', 'failed', 'paginated', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/integrations/failed', { params: { ...params, paginated: 'true' } })
      return data
    },
  })
}

export function useAdminFailedNotifications(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['admin', 'notifications', 'failed', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/notifications/failed', { params })
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

export function useAdminFailedIntegrations() {
  return useQuery({
    queryKey: ['admin', 'integrations', 'failed'],
    queryFn: async () => {
      const { data } = await api.get('/admin/integrations/failed')
      return data
    },
  })
}

export function useAdminRetryIntegration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/admin/integrations/${id}/retry`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] })
    },
  })
}

export function useAdminNotificationTemplates() {
  return useQuery({
    queryKey: ['admin', 'notifications', 'templates'],
    queryFn: async () => {
      const { data } = await api.get('/admin/notifications/templates')
      return data
    },
  })
}

// ─── Admin Users ─────────────────────────────────────────

export function useAdminUsers(params: { search?: string; role?: string; accountId?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/users', { params })
      return data
    },
  })
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/users/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useAdminUpdateUser(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { firstName?: string; lastName?: string; email?: string; roles?: string[] }) => {
      const { data } = await api.patch(`/admin/users/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminDeleteUser(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/admin/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminResetPassword(id: string | undefined) {
  return useMutation({
    mutationFn: async (body: { temporaryPassword: string }) => {
      const { data } = await api.post(`/admin/users/${id}/reset-password`, body)
      return data
    },
  })
}

export function useAdminAccountSubscribers(accountId: string | undefined, params: { search?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'account-subscribers', accountId, params],
    queryFn: async () => {
      const { data } = await api.get(`/admin/accounts/${accountId}/subscribers`, { params })
      return data
    },
    enabled: !!accountId,
  })
}

export function useAdminGlobalSearch(q: string) {
  return useQuery({
    queryKey: ['admin', 'search', q],
    queryFn: async () => {
      const { data } = await api.get('/admin/search', { params: { q } })
      return data
    },
    enabled: q.length >= 2,
  })
}

// ─── User-scoped Search ─────────────────────────────────

export interface SearchResults {
  projects: { id: string; name: string; status: string }[]
  subscribers: { id: string; email: string; name: string | null; projectId: string }[]
  integrations: { id: string; displayName: string; type: string; projectId: string }[]
}

export function useSearch(q: string) {
  const { token } = useAuth()
  return useQuery<SearchResults>({
    queryKey: ['search', q],
    queryFn: async () => {
      const { data } = await api.get<SearchResults>('/projects/search/all', { params: { q } })
      return data
    },
    enabled: !!token && q.length >= 2,
  })
}

// ─── Platform Config ─────────────────────────────────────

export interface PlatformConfig {
  apiBaseUrl: string
  cdnBaseUrl: string
}

const PLATFORM_CONFIG_DEFAULTS: PlatformConfig = {
  apiBaseUrl: 'https://api.nexuswait.com',
  cdnBaseUrl: 'https://cdn.nexuswait.com',
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

// ─── Plans (Public) ─────────────────────────────────────

export interface PlanConfig {
  id: string
  tier: string
  displayName: string
  description: string | null
  monthlyPriceCents: number
  yearlyPriceCents: number
  maxProjects: number | null
  maxSubscribersMonth: number | null
  maxIntegrations: number | null
  features: string[]
  polarProductIdMonthly: string | null
  polarProductIdYearly: string | null
  highlight: boolean
  ctaText: string
  sortOrder: number
}

export function usePlans() {
  return useQuery<PlanConfig[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await api.get<PlanConfig[]>('/plans')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Admin Plans ────────────────────────────────────────

export function useAdminPlans() {
  return useQuery<PlanConfig[]>({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      const { data } = await api.get<PlanConfig[]>('/admin/plans')
      return data
    },
  })
}

export function useAdminUpsertPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ tier, ...body }: { tier: string } & Record<string, unknown>) => {
      const { data } = await api.put(`/admin/plans/${tier}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}

export function useAdminDeletePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tier: string) => {
      await api.delete(`/admin/plans/${tier}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}

// ─── Cancel Subscription ────────────────────────────────

export function useCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payments/cancel')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] })
      queryClient.invalidateQueries({ queryKey: ['account'] })
    },
  })
}

// ─── Admin Delivery Logs ────────────────────────────────

export interface DeliveryLog {
  id: string
  integrationId: string
  event: string
  payload: unknown
  idempotencyKey: string
  responseStatus: number | null
  responseBody: string | null
  durationMs: number | null
  error: string | null
  success: boolean
  createdAt: string
}

export function useAdminDeliveryLogs(integrationId: string | undefined, page = 1, limit = 25, sortBy?: string, sortOrder?: string) {
  return useQuery<{ data: DeliveryLog[]; total: number; page: number; limit: number }>({
    queryKey: ['admin', 'delivery-logs', integrationId, page, sortBy, sortOrder],
    queryFn: async () => {
      const { data } = await api.get(`/admin/integrations/${integrationId}/delivery-logs`, {
        params: { page, limit, sortBy, sortOrder },
      })
      return data as { data: DeliveryLog[]; total: number; page: number; limit: number }
    },
    enabled: !!integrationId,
  })
}

export function useAdminRetriggerDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (logId: string) => {
      const { data } = await api.post(`/admin/delivery-logs/${logId}/retrigger`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-logs'] })
    },
  })
}

// ─── Admin Webhook Events ───────────────────────────────

export interface WebhookEvent {
  id: string
  eventId: string
  eventType: string
  payload: unknown
  status: string
  error: string | null
  createdAt: string
}

export function useAdminWebhookEvents(page = 1, limit = 25, sortBy?: string, sortOrder?: string) {
  return useQuery<{ data: WebhookEvent[]; total: number; page: number; limit: number }>({
    queryKey: ['admin', 'webhook-events', page, sortBy, sortOrder],
    queryFn: async () => {
      const { data } = await api.get('/admin/webhook-events', {
        params: { page, limit, sortBy, sortOrder },
      })
      return data as { data: WebhookEvent[]; total: number; page: number; limit: number }
    },
  })
}

// ─── Admin Integration Config ───────────────────────────

export function useAdminUpdateIntegrationConfig(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { maxRetryAttempts: number }) => {
      const { data } = await api.patch(`/admin/integrations/${id}/config`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] })
    },
  })
}

// ─── Helpers ────────────────────────────────────────────

export function getMutationErrorMessage(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>
  return err.response?.data?.message ?? 'Request failed'
}
