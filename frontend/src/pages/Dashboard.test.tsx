import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './Dashboard'
import { useProjects, useSubscribers, useAnalyticsTimeseries } from '../api/hooks'
import { useAuth } from '../contexts/AuthContext'

vi.mock('../api/hooks', () => ({
  useProjects: vi.fn(),
  useSubscribers: vi.fn(),
  useAnalyticsTimeseries: vi.fn(),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockedUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockedUseProjects = useProjects as ReturnType<typeof vi.fn>
const mockedUseSubscribers = useSubscribers as ReturnType<typeof vi.fn>
const mockedUseAnalyticsTimeseries = useAnalyticsTimeseries as ReturnType<typeof vi.fn>

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

const sampleProjects = [
  { id: 'p1', name: 'Alpha Launch', status: 'active', _count: { subscribers: 120 } },
  { id: 'p2', name: 'Beta Waitlist', status: 'paused', _count: { subscribers: 45 } },
]

const sampleSubscribers = [
  { id: 's1', name: 'Alice Smith', email: 'alice@example.com', source: 'referral', createdAt: new Date().toISOString() },
  { id: 's2', name: 'Bob Jones', email: 'bob@example.com', source: 'direct', createdAt: new Date().toISOString() },
]

function setupMocks(overrides: {
  authLoading?: boolean
  isAuthenticated?: boolean
  projects?: typeof sampleProjects | []
  projectsLoading?: boolean
  projectsError?: Error | null
  subscribers?: typeof sampleSubscribers | []
} = {}) {
  const {
    authLoading = false,
    isAuthenticated = true,
    projects = sampleProjects,
    projectsLoading = false,
    projectsError = null,
    subscribers = sampleSubscribers,
  } = overrides

  mockedUseAuth.mockReturnValue({
    user: isAuthenticated ? { id: 'u1', email: 'test@test.com' } : null,
    token: isAuthenticated ? 'tok' : null,
    setToken: vi.fn(),
    logout: vi.fn(),
    loading: authLoading,
    isAuthenticated,
    isAdmin: false,
  })

  mockedUseProjects.mockReturnValue({
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  })

  mockedUseSubscribers.mockReturnValue({
    data: { pages: [{ data: subscribers, nextCursor: null }], pageParams: [undefined] },
  })

  mockedUseAnalyticsTimeseries.mockReturnValue({
    data: [
      { date: '2026-03-10T00:00:00.000Z', count: 5 },
      { date: '2026-03-11T00:00:00.000Z', count: 8 },
      { date: '2026-03-12T00:00:00.000Z', count: 3 },
    ],
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Dashboard', () => {
  it('renders loading state initially', () => {
    setupMocks({ authLoading: true })
    renderWithProviders(<Dashboard />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders dashboard heading and stat cards', () => {
    setupMocks()
    renderWithProviders(<Dashboard />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Total Signups')).toBeInTheDocument()
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
    expect(screen.getByText('Active Projects')).toBeInTheDocument()

    // Total signups = 120 + 45 = 165
    expect(screen.getByText('165')).toBeInTheDocument()
    // Active projects count
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders project list with names', () => {
    setupMocks()
    renderWithProviders(<Dashboard />)

    expect(screen.getByText('Alpha Launch')).toBeInTheDocument()
    expect(screen.getByText('Beta Waitlist')).toBeInTheDocument()
    expect(screen.getByText('120 signups')).toBeInTheDocument()
    expect(screen.getByText('45 signups')).toBeInTheDocument()
  })

  it('renders empty state when no projects', () => {
    setupMocks({ projects: [] })
    renderWithProviders(<Dashboard />)

    expect(
      screen.getByText('No projects yet. Create one to get started.'),
    ).toBeInTheDocument()
  })

  it('renders recent signups section', () => {
    setupMocks()
    renderWithProviders(<Dashboard />)

    expect(screen.getByText('Recent Signups')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })
})
