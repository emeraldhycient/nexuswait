# 07 - Frontend Integration

## Axios Instance

- **Location:** e.g. `frontend/src/api/client.js` or `axios.js`.
- **Base URL:** From `import.meta.env.VITE_API_BASE_URL` (e.g. `http://localhost:3000/v1`). Fallback for dev: `http://localhost:3000/v1`.
- **Request interceptor:** Attach `Authorization: Bearer <token>` when token is present (from auth context or storage). Optional: attach API key for BYOUI flows (usually publishable key from project settings).
- **Response interceptor:** On 401, clear token and redirect to `/login` (and set auth context to logged out). On 4xx/5xx, optionally normalize error body for TanStack Query / UI.

## Auth Context

- **Location:** `frontend/src/contexts/AuthContext.jsx` (or .tsx).
- **State:** user (or null), token (or null), loading.
- **Actions:** login(email, password), register(payload), logout(), setToken(token).
- **Persistence:** Store token in localStorage (or sessionStorage) and restore on load; validate with GET /v1/auth/me. If 401 on me, clear token and set user null.
- **Provider:** Wrap app (or routes that need auth) with AuthProvider. Expose useAuth() for token and user.

## TanStack Query

- **Setup:** Install `@tanstack/react-query`. Wrap app with `QueryClientProvider` and create `QueryClient` with default options (e.g. staleTime, retry).
- **QueryClientProvider:** Place above router in `main.jsx` so all routes can use hooks.

## API Hooks Pattern

- **Location:** `frontend/src/api/hooks/` or `frontend/src/hooks/api/`.
- **Convention:** One hook per resource or action. Use `useQuery` for GET and `useMutation` for POST/PATCH/DELETE. Call the Axios instance (which already has base URL and auth).
- **Examples:**
  - `useProjects()` – useQuery(['projects'], () => api.get('/projects')).
  - `useProject(id)` – useQuery(['project', id], () => api.get(\`/projects/${id}\`), { enabled: !!id }).
  - `useCreateProject()` – useMutation((body) => api.post('/projects', body)); onSuccess invalidate ['projects'] and optionally navigate to new project.
  - `useSubscribers(projectId)` – useQuery(['subscribers', projectId], () => api.get(\`/projects/${projectId}/subscribers\`), { enabled: !!projectId }).
  - `useCreateSubscriber(projectId)` – useMutation((body) => api.post(\`/projects/${projectId}/subscribers\`, body)).
  - `useAccount()`, `useBilling()` – for Settings and dashboard.
  - `useLogin()` – useMutation(loginApi); onSuccess set token and user in context.
  - `useRegister()` – useMutation(registerApi); onSuccess set token and user.

## Error Handling

- Centralized: In Axios response interceptor, on 401 call logout and redirect to /login.
- Per-query: useMutation onError to show toast or inline error; useQuery error state for UI (e.g. “Failed to load projects”).

## Usage in Pages

- Dashboard: useProjects(); render list; link to /dashboard/project/:id.
- CreateProject: useCreateProject(); on submit call mutate(payload); onSuccess navigate to \`/dashboard/project/${data.id}\`.
- ViewProject: useProject(id), useSubscribers(id), useAnalyticsOverview(id); pass id from useParams().
- Login/Signup: useLogin/useRegister; onSuccess update auth context and navigate to /dashboard.
- Settings > Billing: useBilling(); “Change Plan” / “Update Payment Method” open Polar checkout URL or customer portal (from billing response or separate endpoint).

## Summary

- Single Axios instance with base URL and auth interceptor; 401 → logout and redirect.
- Auth context holds token and user; persisted and validated with /auth/me.
- TanStack Query for all server state; hooks (useProjects, useCreateProject, etc.) call Axios and invalidate/redirect as needed.
