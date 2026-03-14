import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Resources from './Resources'
import { usePlatformConfig } from '../api/hooks'

vi.mock('../api/hooks', () => ({
  usePlatformConfig: vi.fn(),
}))

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}))

const mockedUsePlatformConfig = usePlatformConfig as ReturnType<typeof vi.fn>

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

beforeEach(() => {
  vi.clearAllMocks()
  mockedUsePlatformConfig.mockReturnValue({
    data: { apiBaseUrl: 'https://api.nexuswait.com', cdnBaseUrl: 'https://cdn.nexuswait.com' },
  })
})

describe('Resources', () => {
  it('renders the page heading', () => {
    renderWithProviders(<Resources />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Resources')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Documentation')
  })

  it('renders quick link cards with correct destinations', () => {
    renderWithProviders(<Resources />)

    const apiDocsLink = screen.getByText('API Docs').closest('a')
    expect(apiDocsLink).toHaveAttribute('href', '/dashboard/api')

    const embedLink = screen.getByText('Embed Widget').closest('a')
    expect(embedLink).toHaveAttribute('href', '/dashboard/embed')

    const communityLink = screen.getByText('Community').closest('a')
    expect(communityLink).toHaveAttribute('href', '/contact')
  })

  it('renders all four documentation categories', () => {
    renderWithProviders(<Resources />)

    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('API Reference')).toBeInTheDocument()
    expect(screen.getByText('Integrations')).toBeInTheDocument()
    expect(screen.getByText('Video Tutorials')).toBeInTheDocument()
  })

  it('renders documentation article links pointing to real routes', () => {
    renderWithProviders(<Resources />)

    // Getting Started articles
    const quickstart = screen.getByText('Quickstart Guide').closest('a')
    expect(quickstart).toHaveAttribute('href', '/signup')

    const embedForms = screen.getByText('Embedding Waitlist Forms').closest('a')
    expect(embedForms).toHaveAttribute('href', '/dashboard/embed')

    // API Reference articles
    const authKeys = screen.getByText('Authentication & API Keys').closest('a')
    expect(authKeys).toHaveAttribute('href', '/dashboard/api')

    // Integrations articles
    const webhooks = screen.getByText('Custom Webhooks').closest('a')
    expect(webhooks).toHaveAttribute('href', '/dashboard/integrations')
  })

  it('renders featured guides with correct links', () => {
    renderWithProviders(<Resources />)

    expect(screen.getByText('The Ultimate Pre-Launch Playbook')).toBeInTheDocument()
    expect(screen.getByText('12 min read')).toBeInTheDocument()

    const tutorialGuide = screen.getByText('Building a Waitlist with Next.js + NexusWait').closest('a')
    expect(tutorialGuide).toHaveAttribute('href', '/dashboard/embed')
  })

  it('renders the API code preview with platform config URL', () => {
    renderWithProviders(<Resources />)

    expect(screen.getByText(/api\.nexuswait\.com/)).toBeInTheDocument()
    expect(screen.getByText(/View full API docs/)).toBeInTheDocument()
  })

  it('uses fallback URL when platform config is not available', () => {
    mockedUsePlatformConfig.mockReturnValue({ data: undefined })
    renderWithProviders(<Resources />)

    expect(screen.getByText(/api\.nexuswait\.com/)).toBeInTheDocument()
  })

  it('does not contain any nexuswait.io references', () => {
    renderWithProviders(<Resources />)

    const html = document.body.innerHTML
    expect(html).not.toContain('nexuswait.io')
  })

  it('filters documentation by search term', () => {
    renderWithProviders(<Resources />)

    const searchInput = screen.getByPlaceholderText('Search docs, guides, API...')
    fireEvent.change(searchInput, { target: { value: 'webhook' } })

    // Should show Webhook Events and Custom Webhooks
    expect(screen.getByText('Webhook Events')).toBeInTheDocument()
    expect(screen.getByText('Custom Webhooks')).toBeInTheDocument()

    // Should NOT show unrelated categories
    expect(screen.queryByText('Getting Started')).not.toBeInTheDocument()
    expect(screen.queryByText('Video Tutorials')).not.toBeInTheDocument()
  })

  it('shows no results message for unmatched search', () => {
    renderWithProviders(<Resources />)

    const searchInput = screen.getByPlaceholderText('Search docs, guides, API...')
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } })

    expect(screen.getByText(/No results for/)).toBeInTheDocument()
    expect(screen.getByText('Clear search')).toBeInTheDocument()
  })

  it('clears search when clear button is clicked', () => {
    renderWithProviders(<Resources />)

    const searchInput = screen.getByPlaceholderText('Search docs, guides, API...')
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } })

    expect(screen.getByText(/No results for/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Clear search'))

    // All categories should be back
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('API Reference')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    renderWithProviders(<Resources />)

    expect(screen.getByPlaceholderText('Search docs, guides, API...')).toBeInTheDocument()
  })
})
