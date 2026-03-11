# 01 - Clean Architecture

## Overview

NexusWait backend follows Clean Architecture: domain at the centre, application use cases, infrastructure adapters, and presentation (HTTP) on the outside. Dependencies point inward; domain has no framework dependencies.

## Layers

### 1. Domain

- **Location:** `backend/src/domain/` (or entities/interfaces colocated per module).
- **Contents:** Entities (Project, Subscriber, Account, NotificationTemplate, Notification, etc.) and **port interfaces** (repository interfaces, notification sender, payment provider).
- **Rules:** No Nest, Prisma, or HTTP. Pure TypeScript; only language types and domain types.

### 2. Application (Use Cases)

- **Location:** `backend/src/application/` or `backend/src/modules/<module>/application/`.
- **Contents:** Application services / use cases (e.g. CreateProject, CreateSubscriber, EnqueueNotification, ProcessNotificationRetry). Each use case depends only on **ports** (interfaces), not concrete repositories or external services.
- **Rules:** No Prisma, no Axios. Inject repositories and external services via interfaces.

### 3. Infrastructure

- **Location:** `backend/src/infrastructure/` or `backend/src/modules/<module>/infrastructure/`.
- **Contents:** Prisma repositories (implementing domain repository interfaces), Polar API client, email/send adapter, notification queue and worker (e.g. Bull/BullMQ or in-process queue with retry).
- **Rules:** Implements ports defined in domain/application. Depends on Prisma, external APIs, Redis (if used for queue).

### 4. Presentation

- **Location:** `backend/src/presentation/` or `backend/src/modules/<module>/presentation/` or Nest controllers under `backend/src/`.
- **Contents:** Nest controllers, DTOs (class-validator), guards (JWT, API key), pipes (validation). Controllers are thin: parse request, call one use case, return response.
- **Rules:** Depends on application layer (use cases). No direct Prisma or repository access in controllers.

## Folder Structure (Nest-Oriented)

Two valid approaches:

**Option A – Layer-first (recommended for clarity):**

```
backend/src/
  domain/
    entities/
    ports/
  application/
    use-cases/
  infrastructure/
    persistence/     # Prisma + repositories
    polar/
    notifications/
  presentation/
    controllers/
    dto/
    guards/
  app.module.ts
```

**Option B – Module-first:**

```
backend/src/
  modules/
    auth/
      domain/
      application/
      infrastructure/
      presentation/
    projects/
      ...
    subscribers/
      ...
  app.module.ts
```

Use one consistently. Ports live in domain (or in each module’s domain); use cases in application; Prisma and external clients in infrastructure; controllers in presentation.

## Dependency Rules

- **Presentation** → Application (use cases), DTOs.
- **Application** → Domain (entities, ports). Use cases receive repository and service **interfaces** (ports).
- **Infrastructure** → Domain (implements ports), Prisma client, external SDKs.
- **Domain** → Nothing (no imports from other layers).

Nest’s DI binds port interfaces to concrete implementations (e.g. `IProjectRepository` → `PrismaProjectRepository`) in module definitions.

## Nest Module Mapping

| Nest Module      | Domain / Application                      | Infrastructure                    |
|------------------|--------------------------------------------|-----------------------------------|
| AuthModule       | Login, Register, IssueApiKey               | Prisma User/Account, JWT          |
| AccountsModule   | GetAccount, UpdateBilling                  | Prisma, Polar client              |
| ProjectsModule   | CreateProject, GetProject, ListProjects    | PrismaProjectRepository           |
| SubscribersModule| CreateSubscriber, ListSubscribers          | Prisma, NotificationQueue port    |
| ReferralsModule  | Referral logic, leaderboard                | Prisma                            |
| AnalyticsModule  | Overview, timeseries, sources, locations  | Prisma (aggregations)              |
| IntegrationsModule| CRUD integrations, test delivery          | Prisma, webhook sender            |
| HostedPagesModule| CRUD page config, publish/unpublish       | Prisma                            |
| NotificationsModule | Template CRUD, enqueue, retry worker  | Prisma, queue, email adapter       |
| WebhooksModule   | Outgoing delivery with HMAC                | HTTP client, Prisma (config)      |
| PaymentsModule   | CreateCheckoutSession, HandlePolarWebhook  | Polar client, Prisma              |

## Summary

- **Domain:** Entities + port interfaces; no framework.
- **Application:** Use cases depending only on ports.
- **Infrastructure:** Prisma, Polar, queue, email; implements ports.
- **Presentation:** Controllers, DTOs, guards; calls use cases only.
