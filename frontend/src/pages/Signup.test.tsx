import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Signup from './Signup'
import { useRegister, getMutationErrorMessage } from '../api/hooks'

const mockMutate = vi.fn()

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}))

vi.mock('../api/hooks', () => ({
  useRegister: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
    isError: false,
  })),
  useGoogleAuth: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
  getMutationErrorMessage: vi.fn((e: unknown) =>
    (e as { message?: string })?.message ?? 'Error',
  ),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockedUseRegister = useRegister as ReturnType<typeof vi.fn>
const mockedGetMutationErrorMessage = getMutationErrorMessage as ReturnType<typeof vi.fn>

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
  mockedUseRegister.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    error: null,
    isError: false,
  })
})

describe('Signup', () => {
  it('renders signup form with all fields', () => {
    renderWithProviders(<Signup />)

    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Min 8 characters')).toBeInTheDocument()
  })

  it('renders "Create Account" heading', () => {
    renderWithProviders(<Signup />)

    expect(
      screen.getByRole('heading', { name: 'Create Account' }),
    ).toBeInTheDocument()
  })

  it('shows password strength indicator when typing', () => {
    renderWithProviders(<Signup />)

    const passwordInput = screen.getByPlaceholderText('Min 8 characters')

    // No strength label initially
    expect(screen.queryByText('Weak')).not.toBeInTheDocument()
    expect(screen.queryByText('Good')).not.toBeInTheDocument()
    expect(screen.queryByText('Strong')).not.toBeInTheDocument()

    // Type a short password (< 6 chars) => Weak
    fireEvent.change(passwordInput, { target: { value: 'abc' } })
    expect(screen.getByText('Weak')).toBeInTheDocument()

    // Type a medium password (>= 6 and < 10 chars) => Good
    fireEvent.change(passwordInput, { target: { value: 'abcdefgh' } })
    expect(screen.getByText('Good')).toBeInTheDocument()

    // Type a long password (>= 10 chars) => Strong
    fireEvent.change(passwordInput, { target: { value: 'abcdefghijk' } })
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })

  it('submits form with correct data', () => {
    renderWithProviders(<Signup />)

    fireEvent.change(screen.getByPlaceholderText('Jane Doe'), {
      target: { value: 'Jane Doe' },
    })
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), {
      target: { value: 'jane@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Min 8 characters'), {
      target: { value: 'securepass123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockMutate).toHaveBeenCalledWith(
      {
        email: 'jane@example.com',
        password: 'securepass123',
        firstName: 'Jane',
        lastName: 'Doe',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('shows error message on failure', () => {
    const errorObj = { message: 'Email already in use' }
    mockedUseRegister.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: errorObj,
      isError: true,
    })
    mockedGetMutationErrorMessage.mockReturnValue('Email already in use')

    renderWithProviders(<Signup />)

    expect(screen.getByText('Email already in use')).toBeInTheDocument()
  })

  it('shows loading state when pending', () => {
    mockedUseRegister.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
      isError: false,
    })

    renderWithProviders(<Signup />)

    expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
  })
})
