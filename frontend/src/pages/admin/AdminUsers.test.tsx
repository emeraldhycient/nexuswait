import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminUsers from './AdminUsers'
import { useAdminUsers } from '../../api/hooks'

vi.mock('../../api/hooks', () => ({
  useAdminUsers: vi.fn(),
}))

const mockedUseAdminUsers = useAdminUsers as ReturnType<typeof vi.fn>

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdminUsers', () => {
  it('renders loading state', () => {
    mockedUseAdminUsers.mockReturnValue({ data: undefined, isLoading: true, error: null })
    renderWithProviders(<AdminUsers />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders users table with data', () => {
    mockedUseAdminUsers.mockReturnValue({
      data: {
        data: [
          { id: 'u1', email: 'alice@test.com', firstName: 'Alice', lastName: 'Smith', roles: ['user'], provider: 'local', createdAt: '2025-06-15T10:00:00Z', account: { plan: 'spark' } },
          { id: 'u2', email: 'bob@test.com', firstName: 'Bob', lastName: null, roles: ['user', 'admin'], provider: 'google', createdAt: '2025-09-01T08:30:00Z', account: { plan: 'nexus' } },
        ],
        total: 2,
      },
      isLoading: false,
      error: null,
    })
    renderWithProviders(<AdminUsers />)
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('bob@test.com')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    mockedUseAdminUsers.mockReturnValue({ data: { data: [], total: 0 }, isLoading: false, error: null })
    renderWithProviders(<AdminUsers />)
    expect(screen.getByText('No users found.')).toBeInTheDocument()
  })

  it('renders search and filter inputs', () => {
    mockedUseAdminUsers.mockReturnValue({ data: { data: [], total: 0 }, isLoading: false, error: null })
    renderWithProviders(<AdminUsers />)
    expect(screen.getByPlaceholderText('Search by email or name...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockedUseAdminUsers.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Network error') })
    renderWithProviders(<AdminUsers />)
    expect(screen.getByText('Failed to load users.')).toBeInTheDocument()
  })
})
