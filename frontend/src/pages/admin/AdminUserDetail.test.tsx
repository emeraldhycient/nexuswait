import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminUserDetail from './AdminUserDetail'
import { useAdminUser, useAdminUpdateUser, useAdminDeleteUser, useAdminResetPassword } from '../../api/hooks'
import { useAuth } from '../../contexts/AuthContext'

vi.mock('../../api/hooks', () => ({
  useAdminUser: vi.fn(),
  useAdminUpdateUser: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isSuccess: false, isError: false })),
  useAdminDeleteUser: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false })),
  useAdminResetPassword: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isSuccess: false, isError: false })),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAdminUser = useAdminUser as ReturnType<typeof vi.fn>
const mockedUseAuth = useAuth as ReturnType<typeof vi.fn>

function renderWithProviders(userId = 'u1') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    user: { id: 'admin-1', email: 'admin@test.com' },
    token: 'tok',
    setToken: vi.fn(),
    logout: vi.fn(),
    loading: false,
    isAuthenticated: true,
    isAdmin: true,
  })
})

describe('AdminUserDetail', () => {
  it('renders loading state', () => {
    mockedUseAdminUser.mockReturnValue({ data: undefined, isLoading: true, error: null })
    renderWithProviders()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders user detail with account info', () => {
    mockedUseAdminUser.mockReturnValue({
      data: {
        id: 'u1', email: 'alice@test.com', firstName: 'Alice', lastName: 'Smith',
        roles: ['user'], provider: 'local', createdAt: '2025-06-15T10:00:00Z',
        accountId: 'acc-1',
        account: { id: 'acc-1', plan: 'spark', projects: [
          { id: 'p1', name: 'My Project', status: 'active', slug: 'my-project', _count: { subscribers: 42 } },
        ] },
      },
      isLoading: false,
      error: null,
    })
    renderWithProviders()
    expect(screen.getByText('User Detail')).toBeInTheDocument()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('My Project')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockedUseAdminUser.mockReturnValue({ data: undefined, isLoading: false, error: new Error('fail') })
    renderWithProviders()
    expect(screen.getByText('Failed to load user.')).toBeInTheDocument()
  })

  it('renders role management section', () => {
    mockedUseAdminUser.mockReturnValue({
      data: {
        id: 'u1', email: 'alice@test.com', firstName: 'Alice', lastName: 'Smith',
        roles: ['user'], provider: 'local', createdAt: '2025-06-15T10:00:00Z',
        accountId: 'acc-1',
        account: { id: 'acc-1', plan: 'spark', projects: [] },
      },
      isLoading: false,
      error: null,
    })
    renderWithProviders()
    expect(screen.getByText('Role Management')).toBeInTheDocument()
    expect(screen.getByText('Grant Admin')).toBeInTheDocument()
  })

  it('renders password reset section for local users', () => {
    mockedUseAdminUser.mockReturnValue({
      data: {
        id: 'u1', email: 'alice@test.com', firstName: 'Alice', lastName: 'Smith',
        roles: ['user'], provider: 'local', createdAt: '2025-06-15T10:00:00Z',
        accountId: 'acc-1',
        account: { id: 'acc-1', plan: 'spark', projects: [] },
      },
      isLoading: false,
      error: null,
    })
    renderWithProviders()
    expect(screen.getByText('Password Reset')).toBeInTheDocument()
    expect(screen.getByText('Reset Password')).toBeInTheDocument()
  })

  it('disables password reset for Google-only users', () => {
    mockedUseAdminUser.mockReturnValue({
      data: {
        id: 'u1', email: 'alice@test.com', firstName: 'Alice', lastName: 'Smith',
        roles: ['user'], provider: 'google', createdAt: '2025-06-15T10:00:00Z',
        accountId: 'acc-1',
        account: { id: 'acc-1', plan: 'spark', projects: [] },
      },
      isLoading: false,
      error: null,
    })
    renderWithProviders()
    expect(screen.getByText('This user signed in with Google only. Password reset is not available.')).toBeInTheDocument()
  })
})
