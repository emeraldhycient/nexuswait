# 03 - Domain and Database

## Prisma Schema Overview

The following models align with the PRD and support accounts, projects, subscribers, referrals, integrations, hosted pages, notifications (templates + send records), API keys, and Polar billing.

### Core Models

- **Account** – Billing/tenant; has plan (Spark/Pulse/Nexus); optional Polar customer/subscription id.
- **User** – Belongs to Account; auth (email, hashed password); profile fields.
- **Project** – Belongs to Account; name, slug, status (active/paused/archived); optional redirect URL, webhook URL; referral/referral-tier config (JSON).
- **Subscriber** – Belongs to Project; email (unique per project), optional name and metadata (JSON); referral_code (unique per project); referrer_id (self-reference); verified_at (double opt-in); source (e.g. direct, referral); created_at.
- **Referral** – Referrer subscriber_id, referred subscriber_id, project_id; created_at (or derive from Subscriber.referrer_id).
- **Integration** – project_id, type (enum: mailchimp, sendgrid, slack, webhook, …), display_name, config (JSON, encrypted at app layer if required), field_mapping (JSON), events (string[]), enabled; last_triggered_at, failure_count.
- **HostedPage** – project_id (1:1 or 1:many per PRD); slug, custom_domain, title, meta_description, og_image_url, theme_id, theme_overrides (JSON), sections (JSON), form_config (JSON), success_config (JSON), status (draft/published/archived), published_at; created_at, updated_at.
- **NotificationTemplate** – name, channel (email, etc.), subject (optional), body (with placeholders); account_id or global.
- **Notification** – template_id, recipient (email or id), payload (JSON), status (pending | sent | failed | dead_letter), attempts (int), max_attempts (default 3), next_retry_at, last_error (text), sent_at; created_at, updated_at.
- **ApiKey** – account_id or user_id; key_hash (bcrypt), prefix (e.g. nw_sk_live_abc… for display); type (secret | publishable); project_id (optional, for scoped keys). Full key shown only at creation.
- **PolarSubscription** – account_id, polar_subscription_id, polar_customer_id, plan (spark | pulse | nexus), status; synced from Polar webhooks.

### Enums (Prisma)

- ProjectStatus: active, paused, archived
- HostedPageStatus: draft, published, archived
- NotificationStatus: pending, sent, failed, dead_letter
- ApiKeyType: secret, publishable
- PlanTier: spark, pulse, nexus, enterprise

### Entity and Repository Interfaces (Domain)

- **Entities:** Project, Subscriber, Account, User, NotificationTemplate, Notification, Integration, HostedPage, ApiKey, etc. Can be simple interfaces or classes with no framework deps.
- **Ports (interfaces):**
  - `IProjectRepository`: findById, findByAccount, create, update, delete (soft).
  - `ISubscriberRepository`: create, findByProject, findById, update, delete, getCount.
  - `IAccountRepository`, `IUserRepository`: auth and billing.
  - `INotificationTemplateRepository`: CRUD by id/account.
  - `INotificationRepository`: create, findPendingForRetry, updateStatus.
  - `INotificationQueue`: enqueue(notification) – abstract over Bull or in-memory.
  - `IReferralRepository` / logic: referral links, leaderboard, tiers (can be part of Subscriber/Project).

Implement these in infrastructure with Prisma (e.g. `PrismaProjectRepository` implements `IProjectRepository`).

### Migrations

- After editing `prisma/schema.prisma`, run:
  - `npx prisma generate`
  - `npx prisma migrate dev --name <description>`
- Never edit migration files by hand unless fixing a broken migration.

### Indexes

- Subscriber: (project_id, email) unique; (project_id, referral_code) unique; index on referrer_id, created_at.
- Notification: status, next_retry_at for worker queries.
- ApiKey: prefix or key_hash lookup; account_id, project_id.
- Integration: project_id, enabled.

## Summary

- One Prisma schema covers accounts, users, projects, subscribers, referrals, integrations, hosted pages, notification templates, notifications (with status/retry fields), API keys, and Polar subscription mapping.
- Domain defines entities and repository/queue ports; infrastructure implements them with Prisma.
