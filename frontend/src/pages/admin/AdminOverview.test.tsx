import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminOverview from './AdminOverview'
import { useAdminStats } from '../../api/hooks'

vi.mock('../../api/hooks', () => ({
  useAdminStats: vi.fn(),
}))

const mockedUseAdminStats = useAdminStats as ReturnType<typeof vi.fn>

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminOverview', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    mockedUseAdminStats.mockReturnValue({ data: undefined, isLoading: true, error: null })
    renderWithProviders(<AdminOverview />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders stat cards with data', () => {
    mockedUseAdminStats.mockReturnValue({
      data: {
        totalAccounts: 120,
        totalProjects: 45,
        totalSubscribers: 3400,
        totalUsers: 98,
        planBreakdown: [],
      },
      isLoading: false,
      error: null,
    })
    renderWithProviders(<AdminOverview />)
    expect(screen.getByText('Admin Overview')).toBeInTheDocument()
    expect(screen.getByText('Total Accounts')).toBeInTheDocument()
    expect(screen.getByText('Total Projects')).toBeInTheDocument()
    expect(screen.getByText('Total Subscribers')).toBeInTheDocument()
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('3,400')).toBeInTheDocument()
    expect(screen.getByText('98')).toBeInTheDocument()
  })

  it('renders plan distribution section', () => {
    mockedUseAdminStats.mockReturnValue({
      data: {
        totalAccounts: 10,
        totalProjects: 5,
        totalSubscribers: 100,
        totalUsers: 8,
        planBreakdown: [
          { plan: 'spark', _count: 60 },
          { plan: 'pulse', _count: 30 },
        ],
      },
      isLoading: false,
      error: null,
    })
    renderWithProviders(<AdminOverview />)
    expect(screen.getByText('Plan Distribution')).toBeInTheDocument()
    expect(screen.getByText('spark')).toBeInTheDocument()
    expect(screen.getByText('pulse')).toBeInTheDocument()
    expect(screen.getByText('60 accounts')).toBeInTheDocument()
    expect(screen.getByText('30 accounts')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockedUseAdminStats.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Server error') })
    renderWithProviders(<AdminOverview />)
    expect(screen.getByText('Failed to load admin stats.')).toBeInTheDocument()
  })
})
