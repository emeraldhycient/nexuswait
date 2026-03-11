import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { api } from './client'
import { useAuth } from '../contexts/AuthContext'

export interface Project {
  id: string
  name: string
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

export function getMutationErrorMessage(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>
  return err.response?.data?.message ?? 'Request failed'
}
