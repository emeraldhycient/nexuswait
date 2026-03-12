import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminAccounts from './AdminAccounts'
import { useAdminAccounts } from '../../api/hooks'

vi.mock('../../api/hooks', () => ({
  useAdminAccounts: vi.fn(),
}))

const mockedUseAdminAccounts = useAdminAccounts as ReturnType<typeof vi.fn>

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminAccounts', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    mockedUseAdminAccounts.mockReturnValue({ data: undefined, isLoading: true, error: null })
    renderWithProviders(<AdminAccounts />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders accounts table with data', () => {
    mockedUseAdminAccounts.mockReturnValue({
      data: {
        data: [
          {
            id: 'a1',
            email: 'alice@example.com',
            plan: 'pulse',
            _count: { projects: 3, subscribers: 150 },
            createdAt: '2025-06-15T10:00:00Z',
          },
          {
            id: 'a2',
            email: 'bob@example.com',
            plan: 'spark',
            _count: { projects: 1, subscribers: 20 },
            createdAt: '2025-09-01T08:30:00Z',
          },
        ],
        total: 2,
      },
      isLoading: false,
      error: null,
    })
    renderWithProviders(<AdminAccounts />)
    expect(screen.getByText('Accounts')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()

    // Table column headers
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Plan')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Subscribers')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    mockedUseAdminAccounts.mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      error: null,
    })
    renderWithProviders(<AdminAccounts />)
    expect(screen.getByText('No accounts found.')).toBeInTheDocument()
  })

  it('renders search and filter inputs', () => {
    mockedUseAdminAccounts.mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      error: null,
    })
    renderWithProviders(<AdminAccounts />)
    expect(screen.getByPlaceholderText('Search by email...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Plans')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockedUseAdminAccounts.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Network error') })
    renderWithProviders(<AdminAccounts />)
    expect(screen.getByText('Failed to load accounts.')).toBeInTheDocument()
  })
})
