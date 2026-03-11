# 09 - Testing

## Backend Tests

### Scope

- **Domain:** Pure logic (e.g. referral tier resolution from count, validation rules). No DB, no HTTP. Unit tests in `*.spec.ts` next to the logic or in `domain/__tests__/`.
- **Application (use cases):** Test with mocked repositories and ports. Example: CreateProject use case – mock IProjectRepository.create, assert it was called with correct data; mock IAccountRepository for plan limits. No real DB.
- **Controllers:** Test with mocked application services (e.g. ProjectsController calls CreateProjectService; mock the service, send HTTP request, assert status and response shape). Use Nest testing module (Test.createTestingModule) and override providers.
- **Notifications:** Retry logic and backoff calculation (e.g. nextRetryAt from attempt number) in unit tests; worker “process one notification” with mocked send adapter – assert status updates and nextRetryAt.

### Location and Commands

- **Location:** `backend/src/**/*.spec.ts` next to the file under test, or `backend/test/` for integration-style controller tests.
- **Runner:** Jest (default with Nest). Run: `pnpm test` or `pnpm run test:watch`.
- **Coverage:** Aim for use cases and controllers; domain logic fully covered.

### Examples

- `project.repository.spec.ts` – if any domain logic in repo, test it; else repo tests can be integration with test DB.
- `create-project.service.spec.ts` – mock IProjectRepository, IAccountRepository; call CreateProjectService.execute(); assert repository create called and return value.
- `projects.controller.spec.ts` – mock CreateProjectService; POST /v1/projects with body; expect 201 and body to match created project shape.
- `notification-retry.spec.ts` – given notification with attempts=1, assert nextRetryAt is ~10s later; given attempts=3, assert status set to dead_letter.

## Frontend Tests

### Scope

- **Critical path:** Auth (login/signup flow with mocked API); project list and create (Dashboard, CreateProject) with mocked API; one or two key dashboard pages (e.g. ViewProject with mocked useProject/useSubscribers).
- **Hooks:** Test API hooks with mocked Axios (or MSW). Assert useQuery/useMutation call correct endpoints and handle success/error.

### Location and Commands

- **Location:** `frontend/src/**/*.test.jsx` or `frontend/src/**/__tests__/*.test.jsx`; or colocate `*.test.jsx` next to component.
- **Runner:** Vitest or Jest; React Testing Library for components. Run: `pnpm test` in frontend.

### Setup

- Mock Axios: jest.mock('axios') or vi.mock('.../api/client') and return resolved promises.
- Mock TanStack Query: wrap component in QueryClientProvider with fresh client; or mock useQuery/useMutation return values.
- Mock router: MemoryRouter and navigate mock for “after login redirect” or “after create project redirect”.

### Examples

- Login.test.jsx: render Login, fill email/password, submit; assert login API called; mock success and assert redirect to /dashboard or setUser called.
- useProjects.test.jsx: with mocked axios.get resolving to { data: [project] }, render hook, assert data and no error.
- Dashboard.test.jsx: mock useProjects to return projects; render Dashboard; assert project list and link to /dashboard/project/:id.

## Summary

- Backend: domain (pure), use cases (mocked repos), controllers (mocked services), notification retry logic.
- Frontend: auth flow, project list/create, and selected pages with mocked API; hooks tested with mocked HTTP.
- Tests live next to code or in __tests__; run with pnpm test in backend and frontend.
