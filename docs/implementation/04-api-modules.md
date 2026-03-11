# 04 - API Modules

## API Versioning and Prefix

- All REST API routes are prefixed with `/v1` (e.g. `https://api.nexuswait.io/v1/projects`).
- In Nest, use a global prefix: `app.setGlobalPrefix('v1')` or mount all API routes under a `V1Controller` / module that re-exports route modules.

## Authentication

- **JWT (dashboard / web app):** `Authorization: Bearer <jwt>`. Issued on login; used for dashboard and account-scoped endpoints.
- **API Key (server / BYOUI):**
  - Secret key: `nw_sk_live_*` or `nw_sk_test_*` – full access to account/project resources.
  - Publishable key: `nw_pk_live_*` or `nw_pk_test_*` – create signups, read public project metadata only; no PII list, no delete, no config change.
- **Guards:** Implement `JwtAuthGuard` (for dashboard) and `ApiKeyAuthGuard` (for API key). For routes that accept both (e.g. get project), use a combined guard or two guards that allow either. Publishable key must be restricted to allowed endpoints (e.g. POST subscriber, GET project, GET subscriber count, GET referral link/leaderboard/tiers).

## Module and Endpoint Mapping

Endpoints below assume base path `/v1`. Auth column: JWT = dashboard; SK = secret key; PK = publishable key.

### Auth (no prefix beyond /v1)

- `POST /v1/auth/register` – body: email, password, name, etc. → create User + Account; return JWT. (JWT)
- `POST /v1/auth/login` – body: email, password → return JWT. (JWT)
- `POST /v1/auth/api-keys` – body: type (secret|publishable), projectId? → create API key; return full key once. (JWT)
- `GET /v1/auth/me` – current user/account. (JWT)

### Account

- `GET /v1/account` – account + plan (from Polar if linked). (JWT)
- `PATCH /v1/account` – update profile/settings. (JWT)
- `GET /v1/account/billing` – current plan, usage, next billing (for Settings > Billing). (JWT)

### Projects (PRD 6.3.1)

- `GET /v1/projects` – list projects for account. (JWT, SK)
- `POST /v1/projects` – create project. (JWT, SK)
- `GET /v1/projects/:id` – project details. (JWT, SK, PK)
- `PATCH /v1/projects/:id` – update project. (JWT, SK)
- `DELETE /v1/projects/:id` – archive (soft delete). (JWT, SK)

### Subscribers (PRD 6.3.2)

- `POST /v1/projects/:id/subscribers` – create subscriber (signup). (JWT, SK, PK)
- `GET /v1/projects/:id/subscribers` – list with filter/sort/pagination. (JWT, SK)
- `GET /v1/projects/:id/subscribers/count` – count. (JWT, SK, PK)
- `GET /v1/projects/:id/subscribers/:subId` – subscriber details + referral stats. (JWT, SK)
- `PATCH /v1/projects/:id/subscribers/:subId` – update. (JWT, SK)
- `DELETE /v1/projects/:id/subscribers/:subId` – remove. (JWT, SK)
- `POST /v1/projects/:id/subscribers/:subId/verify` – trigger/confirm verification. (JWT, SK)

### Referrals (PRD 6.3.3)

- `GET /v1/projects/:id/referrals` – list referral relationships. (JWT, SK)
- `GET /v1/projects/:id/referrals/leaderboard` – ranked referrers. (JWT, SK, PK)
- `GET /v1/projects/:id/subscribers/:subId/referral-link` – unique referral link. (JWT, SK, PK)
- `GET /v1/projects/:id/referral-tiers` – configured tiers. (JWT, SK, PK)

### Analytics (PRD 6.3.4)

- `GET /v1/projects/:id/analytics/overview` – total signups, conversion rate, referral rate. (JWT, SK)
- `GET /v1/projects/:id/analytics/timeseries` – signups over time (granularity: hourly/daily/weekly). (JWT, SK)
- `GET /v1/projects/:id/analytics/sources` – by source. (JWT, SK)
- `GET /v1/projects/:id/analytics/locations` – geographic. (JWT, SK)

### Integrations (PRD 6.3.5)

- `GET /v1/projects/:id/integrations` – list. (JWT, SK)
- `POST /v1/projects/:id/integrations` – add. (JWT, SK)
- `PATCH /v1/projects/:id/integrations/:intId` – update. (JWT, SK)
- `DELETE /v1/projects/:id/integrations/:intId` – remove. (JWT, SK)
- `POST /v1/projects/:id/integrations/:intId/test` – send test event. (JWT, SK)

### Hosted Page (PRD 6.3.6)

- `GET /v1/projects/:id/page` – get config. (JWT, SK)
- `PUT /v1/projects/:id/page` – create or replace. (JWT, SK)
- `PATCH /v1/projects/:id/page` – update. (JWT, SK)
- `POST /v1/projects/:id/page/publish` – publish. (JWT, SK)
- `POST /v1/projects/:id/page/unpublish` – unpublish. (JWT, SK)

### Notifications (admin / internal)

- `GET /v1/notifications/templates` – list templates (account-scoped or global). (JWT)
- `POST /v1/notifications/templates` – create template. (JWT)
- `PATCH /v1/notifications/templates/:id` – update. (JWT)
- `DELETE /v1/notifications/templates/:id` – delete. (JWT)
- Enqueue is internal (use case) – no direct public endpoint; signup/referral flows call application service.

### Payments (Polar)

- `POST /v1/checkout/session` – body: priceId or productId, successUrl, cancelUrl, customerEmail? → return checkout URL. (JWT)
- `POST /v1/webhooks/polar` – Polar webhook; verify signature; handle subscription.created/updated/cancelled; update account plan. (No auth; verify webhook secret.)

### Health

- `GET /v1/health` or `GET /health` – health check (DB, optional Redis).

## Response Envelope

- Success: `{ data: T }` or direct `T` for lists. Use consistent shape (e.g. always `{ data }` for single resource).
- Errors: HTTP status 4xx/5xx; body e.g. `{ statusCode, message, error? }`. Validation errors: 422 with field-level details.

## Idempotency and Pagination

- Idempotency: support `Idempotency-Key` header on mutating requests; store key and return same response within window.
- Pagination: cursor-based; query params e.g. `cursor`, `limit` (default 20, max 100).

## Summary

- All API under `/v1`; auth via JWT or API key (secret vs publishable); publishable key restricted to safe endpoints.
- Modules: Auth, Account, Projects, Subscribers, Referrals, Analytics, Integrations, HostedPages, Notifications (templates), Payments (checkout + Polar webhook).
- Endpoint list above is the single source of truth for route and auth matrix.
