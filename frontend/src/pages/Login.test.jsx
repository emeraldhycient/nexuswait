import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import Login from './Login'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}))

vi.mock('../api/hooks', () => ({
  useLogin: () => ({
    mutate: vi.fn((_, opts) => {
      opts?.onSuccess?.()
    }),
    isPending: false,
    error: null,
  }),
  useGoogleAuth: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
  getMutationErrorMessage: vi.fn((e) => e?.message ?? 'Error'),
}))

describe('Login', () => {
  it('renders login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('has link to signup', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /create one/i })
    expect(link).toHaveAttribute('href', '/signup')
  })

  it('has link to forgot password', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /forgot password/i })
    expect(link).toHaveAttribute('href', '/forgot-password')
  })
})
