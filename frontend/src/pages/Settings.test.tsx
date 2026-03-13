import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Settings from './Settings'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'u1',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'user',
      accountId: 'a1',
      account: { id: 'a1', plan: 'spark' },
      company: 'Acme Inc',
    },
  })),
}))

vi.mock('../api/hooks', () => ({
  useUpdateProfile: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  useChangePassword: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  useApiKeys: vi.fn(() => ({
    data: [{ id: 'k1', prefix: 'nw_sk_live_abc', type: 'secret' }],
    isLoading: false,
  })),
  useCreateApiKey: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  useRevokeApiKey: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  useBilling: vi.fn(() => ({ data: null, isLoading: false })),
  useCheckoutSession: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  usePlans: vi.fn(() => ({ data: [], isLoading: false })),
  useCancelSubscription: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  getMutationErrorMessage: vi.fn((e: unknown) => (e as Error)?.message ?? 'Error'),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Settings', () => {
  it('renders settings page with tabs', () => {
    renderWithProviders(<Settings />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Billing')).toBeInTheDocument()
  })

  it('shows profile tab by default with form fields', () => {
    renderWithProviders(<Settings />)
    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('Last Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Company')).toBeInTheDocument()
  })

  it('switches to security tab on click', () => {
    renderWithProviders(<Settings />)
    fireEvent.click(screen.getByText('Security'))
    expect(screen.getByText('Change Password')).toBeInTheDocument()
  })

  it('shows API keys section in security tab', () => {
    renderWithProviders(<Settings />)
    fireEvent.click(screen.getByText('Security'))
    expect(screen.getByText('API Keys')).toBeInTheDocument()
    expect(screen.getByText('nw_sk_live_abc...')).toBeInTheDocument()
  })

  it('switches to billing tab', () => {
    renderWithProviders(<Settings />)
    fireEvent.click(screen.getByText('Billing'))
    expect(screen.getByText('Current Plan')).toBeInTheDocument()
    expect(screen.getByText('Change Plan')).toBeInTheDocument()
  })
})
