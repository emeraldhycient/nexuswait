**NEXUSWAIT**

Product Requirements Document

Version 2.0

| **Document Owner** | Product Team |
| --- | --- |
| **Status** | Draft for Stakeholder Review |
| **Created** | March 11, 2026 |
| **Last Updated** | March 11, 2026 |
| **Classification** | Internal - Confidential |

**Table of Contents**

# 1\. Executive Summary

NexusWait is a SaaS platform that enables companies to build, manage, and optimize pre-launch waitlists. The platform provides three core delivery mechanisms: fully hosted waitlist landing pages, embeddable form components with submission integrations, and a headless REST API for teams that prefer to bring their own UI.

This PRD defines the complete product scope for NexusWait v2.0, which expands on the existing dashboard experience by adding hosted pages, form submission integrations, and a public API with BYOUI (Bring Your Own UI) support. The document covers all user-facing features, technical architecture, data models, API contracts, security requirements, and go-to-market considerations.

## 1.1 Problem Statement

Launching a new product requires validating demand before committing engineering resources to a full build. Existing solutions force teams into one of two extremes: expensive marketing platforms with poor developer ergonomics, or bare-bones email collectors that offer no referral mechanics, analytics, or integration capabilities. NexusWait bridges this gap by offering a modern, developer-friendly, and marketer-approved platform.

## 1.2 Vision

To become the default infrastructure layer for pre-launch demand capture, serving every team from solo indie hackers to enterprise product organizations, regardless of their technical sophistication.

## 1.3 Success Metrics

| **Metric** | **Current Baseline** | **6-Month Target** | **12-Month Target** |
| --- | --- | --- | --- |
| Monthly Active Waitlists (MAW) | 1,200 | 5,000 | 15,000 |
| Total Signups Processed | 420K / month | 2M / month | 8M / month |
| API-Driven Projects (BYOUI) | 0   | 800 | 4,000 |
| Hosted Page Conversion Rate | N/A | 32% | 38% |
| Monthly Recurring Revenue | \$48K | \$220K | \$750K |
| Net Promoter Score | 42  | 55  | 65  |
| Median Time-to-First-Signup | N/A | < 3 minutes | < 90 seconds |
| Platform Uptime | 99.9% | 99.95% | 99.99% |

# 2\. User Personas

## 2.1 Indie Maker - Maya

**Role:** Solo founder building a B2C mobile app

**Technical Skill:** Intermediate (comfortable with HTML, basic JavaScript)

**Goals:** Validate product-market fit before investing in development; grow an email list with zero budget; leverage viral referral mechanics to amplify reach organically.

**Pain Points:** Cannot justify \$200/month marketing tools; needs something live in under 5 minutes; wants beautiful defaults without needing a designer.

**NexusWait Solution:** Free-tier hosted page with built-in referral engine, one-click deploy, and pre-designed templates.

## 2.2 Startup Growth Lead - Jordan

**Role:** Head of Growth at a Series A SaaS startup (15 employees)

**Technical Skill:** Low-code / no-code comfortable, relies on engineering for API work

**Goals:** Capture demand for upcoming product line; integrate signups into existing Mailchimp and Slack workflows; track referral attribution for investor reporting.

**Pain Points:** Existing tools don't connect to the stack without custom code; analytics are surface-level; referral tracking is unreliable.

**NexusWait Solution:** Embeddable forms with native integrations for Mailchimp, Slack, Zapier, and HubSpot; advanced analytics dashboard with exportable reports.

## 2.3 Platform Engineer - Kai

**Role:** Senior engineer at a mid-stage startup building a developer platform

**Technical Skill:** Expert (full-stack, infrastructure background)

**Goals:** Embed waitlist capture into an existing Next.js marketing site without adopting third-party UI; pipe data into internal systems via webhooks; maintain full control over design, validation, and UX.

**Pain Points:** Refuses to use iframe embeds; needs raw API access; existing tools offer poor documentation and unreliable webhooks.

**NexusWait Solution:** Headless REST API with comprehensive docs, SDK libraries (JavaScript, Python), real-time webhooks, and zero UI opinions.

## 2.4 Enterprise Product Manager - Priya

**Role:** Senior PM at a Fortune 500 running internal beta programs

**Technical Skill:** Non-technical but data-literate

**Goals:** Gate access to internal beta features; segment enterprise users by department and role; integrate with SSO and internal identity providers.

**Pain Points:** Compliance requires data residency controls; needs audit logs; existing tools lack enterprise access controls.

**NexusWait Solution:** Nexus-tier plan with SSO, RBAC, audit logging, data residency options, and dedicated account management.

# 3\. Product Architecture Overview

NexusWait is structured around three delivery layers that share a unified backend. Each layer serves a distinct user persona and use case but converges on the same data model, analytics pipeline, and integration framework.

## 3.1 Three Delivery Layers

| **Layer** | **Target User** | **Key Characteristics** | **Technical Approach** |
| --- | --- | --- | --- |
| Hosted Pages | Non-technical founders, marketers | Full landing page with custom domain, SEO, OG meta, responsive design | Server-rendered pages on NexusWait CDN with visual editor |
| Embeddable Forms | Growth teams, low-code users | Drop-in widget for existing sites with form submit integrations | JavaScript SDK, iframe fallback, native third-party integrations |
| Headless API (BYOUI) | Engineers, developer platforms | Raw REST API, zero UI, full control over presentation | REST endpoints, API keys, webhooks, JS/Python SDKs |

## 3.2 System Architecture

The platform follows a layered architecture designed for horizontal scalability:

- **Edge Layer:** Cloudflare Workers for hosted page serving, form submission proxying, and bot detection at 200+ global PoPs.
- **API Gateway:** Rate limiting, authentication, request validation, and routing via a managed gateway layer.
- **Application Layer:** Stateless Node.js microservices for waitlist logic, referral engine, analytics processing, and integration dispatch.
- **Data Layer:** PostgreSQL (primary store), Redis (caching, rate limits, leaderboards), ClickHouse (analytics), S3 (asset storage).
- **Integration Bus:** Async event queue (SQS/SNS) for webhook delivery, email dispatch, and third-party sync with at-least-once delivery guarantees.

# 4\. Hosted Waitlist Pages

Hosted pages provide a fully managed landing page experience. Users can create, customize, and publish a waitlist landing page without writing any code. Pages are served from NexusWait's global CDN with automatic SSL, custom domain support, and built-in SEO optimization.

## 4.1 Page Builder

### 4.1.1 Visual Editor

The hosted page builder offers a real-time visual editor with the following capabilities:

- Drag-and-drop section ordering: hero, features, social proof, testimonials, FAQ, countdown timer, and custom HTML blocks.
- Live preview across desktop, tablet, and mobile breakpoints with pixel-accurate rendering.
- Theme engine with 12 pre-built themes (including the NexusWait futuristic dark theme) and full custom CSS override capability.
- Typography controls: selection from 200+ Google Fonts, custom font upload (WOFF2), font size/weight/line-height per section.
- Color system: primary, secondary, accent, background, and text colors with automatic contrast ratio validation (WCAG AA compliance).
- Background options: solid color, linear/radial gradient, image upload with overlay opacity, video background (Pulse tier and above).
- Animation presets: fade-in, slide-up, parallax scroll, and count-up number animations for social proof sections.

### 4.1.2 Form Configuration

Each hosted page includes a configurable signup form:

- Field types: email (required, always present), text, select/dropdown, number, phone (with country code validation), URL, textarea, checkbox, and date picker.
- Field validation: required/optional, regex patterns, min/max length, custom error messages per field.
- Anti-spam: integrated hCaptcha or Turnstile challenge (configurable), honeypot fields, time-based submission throttling.
- Double opt-in: optional email verification flow with customizable confirmation email template.
- Conditional fields: show/hide fields based on previous answers (e.g., show "Company Size" only if "Role" is "Founder").
- Custom success state: configurable thank-you message, redirect URL, referral share widget display, or confetti animation.

### 4.1.3 Custom Domain & SEO

- Custom domain mapping via CNAME or A record with automatic Let's Encrypt SSL provisioning.
- Configurable page title, meta description, OG image (auto-generated or custom upload), Twitter card metadata.
- Auto-generated sitemap.xml and robots.txt; canonical URL configuration to prevent duplicate content.
- Structured data (JSON-LD) output for search engine rich snippets.
- Page speed optimization: lazy-loaded images, critical CSS inlining, preconnect hints, 90+ Lighthouse score target.

## 4.2 Hosted Page Data Model

| **Field** | **Type** | **Description** | **Constraints** |
| --- | --- | --- | --- |
| id  | UUID v7 | Unique page identifier | Auto-generated, immutable |
| project_id | UUID | Foreign key to parent project | Required |
| slug | String | URL path segment | 3-64 chars, alphanumeric + hyphens, unique per account |
| custom_domain | String? | Custom domain (e.g., waitlist.acme.com) | Valid FQDN, verified via DNS |
| title | String | Browser tab / SEO title | Max 70 chars |
| meta_description | String? | SEO meta description | Max 160 chars |
| og_image_url | String? | Open Graph image URL | Valid URL, image < 5MB |
| theme_id | String | Reference to theme preset or "custom" | Required |
| theme_overrides | JSON | Custom CSS variables and section ordering | Max 50KB |
| sections | JSON\[\] | Ordered array of page section configurations | 1-20 sections |
| form_config | JSON | Field definitions, validation rules, spam settings | Required |
| success_config | JSON | Post-submit behavior (message, redirect, referral widget) | Required |
| status | Enum | draft, published, archived | Default: draft |
| published_at | Timestamp? | When page was last published | Null if draft |
| created_at | Timestamp | Creation timestamp | Auto-set, immutable |
| updated_at | Timestamp | Last modification timestamp | Auto-updated |

# 5\. Form Submit Integrations

Form submit integrations allow NexusWait to push signup data to external services in real time when a waitlist form is submitted. Integrations are configured per-project and can be stacked (multiple integrations fire on each submission).

## 5.1 Integration Architecture

All integrations follow an event-driven architecture:

- **Event Trigger:** A form submission event (waitlist.signup.created) is emitted to the integration bus.
- **Dispatch:** The bus fans out the event to all active integrations configured for that project.
- **Delivery:** Each integration adapter transforms the payload into the target service's expected format and delivers it.
- **Retry:** Failed deliveries are retried with exponential backoff (3 attempts, 1s/10s/60s delays). After exhaustion, the event is dead-lettered and an alert is sent to the project owner.

## 5.2 Native Integrations

| **Integration** | **Category** | **Capabilities** | **Auth Method** |
| --- | --- | --- | --- |
| Mailchimp | Email Marketing | Create/update contact, add to list/audience, apply tags based on waitlist fields, trigger automation | OAuth 2.0 |
| SendGrid | Transactional Email | Trigger single-send or automation, dynamic template data, suppression group management | API Key |
| Slack | Notifications | Post to channel on signup, configurable message template with field interpolation, thread on referral events | OAuth 2.0 (Bot) |
| Discord | Notifications | Webhook message to channel with embeds, role assignment via bot on referral milestones | Webhook URL |
| HubSpot | CRM | Create/update contact, create deal, set lifecycle stage, custom property mapping | OAuth 2.0 |
| Zapier | Automation | Trigger Zap on signup event, pass all fields as structured data | Webhook (Zapier Trigger URL) |
| Google Sheets | Data Export | Append row to configured sheet per signup, auto-create headers from form fields | OAuth 2.0 (Google) |
| Segment | Analytics/CDP | Identify call + track event, pass all fields as traits/properties | Write Key |
| Supabase | Database | Insert row into configured table, auto-map fields to columns, support for RLS policies | Service Role Key |
| Intercom | Messaging | Create/update lead, apply tags, trigger message sequence | OAuth 2.0 |
| Webhook (Custom) | Developer | HTTP POST to any endpoint, configurable headers, HMAC signature, payload template | HMAC Secret |

## 5.3 Webhook Specification

### 5.3.1 Delivery Format

Custom webhooks deliver a JSON payload via HTTP POST. The payload structure is stable and versioned:

POST {webhook_url}

Content-Type: application/json

X-NexusWait-Signature: sha256={hmac_hex}

X-NexusWait-Event: waitlist.signup.created

X-NexusWait-Delivery-Id: {uuid}

### 5.3.2 Webhook Events

| **Event** | **Trigger** | **Payload Includes** |
| --- | --- | --- |
| waitlist.signup.created | New subscriber added | Subscriber object, form fields, source, referrer info |
| waitlist.signup.verified | Email double opt-in confirmed | Subscriber object, verification timestamp |
| waitlist.signup.referred | Subscriber referred a new signup | Referrer object, referred subscriber, referral count |
| waitlist.signup.milestone | Subscriber reached a referral tier | Subscriber object, tier name, reward details |
| waitlist.signup.deleted | Subscriber removed or unsubscribed | Subscriber ID, deletion reason |
| project.status.changed | Project published, paused, or archived | Project ID, old status, new status |

### 5.3.3 Signature Verification

All webhook deliveries include an HMAC-SHA256 signature in the X-NexusWait-Signature header. The signature is computed over the raw request body using the project's webhook secret. Recipients must verify the signature before processing the payload to prevent spoofing. SDKs include a built-in verifyWebhookSignature() helper.

## 5.4 Integration Configuration Data Model

| **Field** | **Type** | **Description** |
| --- | --- | --- |
| id  | UUID v7 | Unique integration instance identifier |
| project_id | UUID | Parent project |
| type | Enum | mailchimp, sendgrid, slack, discord, hubspot, zapier, google_sheets, segment, supabase, intercom, webhook |
| display_name | String | User-assigned label (e.g., "Marketing Slack Channel") |
| config | JSON (encrypted) | Service-specific configuration (API keys, list IDs, channel IDs, etc.) |
| field_mapping | JSON | Maps NexusWait form fields to target service fields |
| events | String\[\] | Which events trigger this integration |
| enabled | Boolean | Active or paused |
| last_triggered_at | Timestamp? | Last successful delivery timestamp |
| failure_count | Integer | Consecutive failures (resets on success) |
| created_at | Timestamp | Creation timestamp |

# 6\. API & Bring Your Own UI (BYOUI)

The NexusWait API is a RESTful HTTP API that provides full programmatic access to all platform capabilities. It is the foundation layer that powers both the hosted pages and embeddable forms, and is exposed directly for teams that want complete control over their frontend.

## 6.1 Design Principles

- RESTful resource-oriented design with predictable URL structure.
- JSON request and response bodies with consistent envelope format.
- Idempotency keys supported on all mutating operations.
- Cursor-based pagination for list endpoints.
- Standard HTTP status codes: 200/201/204 for success, 400/401/403/404/409/422/429 for client errors, 500/502/503 for server errors.
- Rate limiting via token bucket: 100 requests/second for standard keys, 500/s for enterprise.
- Versioned via URL path prefix (currently /v1). Breaking changes require a major version bump.

## 6.2 Authentication

The API supports two authentication mechanisms:

- **Secret Key (server-side):** Prefixed nw_sk_live_or nw_sk_test_. Passed via Authorization: Bearer {key} header. Has full access to the project's resources. Must never be exposed client-side.
- **Publishable Key (client-side):** Prefixed nw_pk_live_or nw_pk_test_. Can be safely embedded in frontend code. Limited to creating signups and reading public project metadata. Cannot read subscriber PII, delete resources, or modify project configuration.

## 6.3 Core API Endpoints

### 6.3.1 Projects

| **Method** | **Endpoint** | **Description** | **Auth** |
| --- | --- | --- | --- |
| GET | /v1/projects | List all projects for the authenticated account | Secret Key |
| POST | /v1/projects | Create a new project | Secret Key |
| GET | /v1/projects/:id | Get project details | Secret / Publishable |
| PATCH | /v1/projects/:id | Update project settings | Secret Key |
| DELETE | /v1/projects/:id | Archive a project (soft delete) | Secret Key |

### 6.3.2 Subscribers

| **Method** | **Endpoint** | **Description** | **Auth** |
| --- | --- | --- | --- |
| POST | /v1/projects/:id/subscribers | Create a new subscriber (signup) | Secret / Publishable |
| GET | /v1/projects/:id/subscribers | List subscribers with filtering, sorting, pagination | Secret Key |
| GET | /v1/projects/:id/subscribers/:sub_id | Get subscriber details including referral stats | Secret Key |
| PATCH | /v1/projects/:id/subscribers/:sub_id | Update subscriber metadata or tags | Secret Key |
| DELETE | /v1/projects/:id/subscribers/:sub_id | Remove subscriber | Secret Key |
| GET | /v1/projects/:id/subscribers/count | Get subscriber count (public-safe) | Secret / Publishable |
| POST | /v1/projects/:id/subscribers/:sub_id/verify | Trigger or confirm email verification | Secret Key |

### 6.3.3 Referrals

| **Method** | **Endpoint** | **Description** | **Auth** |
| --- | --- | --- | --- |
| GET | /v1/projects/:id/referrals | List referral relationships | Secret Key |
| GET | /v1/projects/:id/referrals/leaderboard | Ranked referrer leaderboard | Secret / Publishable |
| GET | /v1/projects/:id/subscribers/:sub_id/referral-link | Get unique referral link for a subscriber | Secret / Publishable |
| GET | /v1/projects/:id/referral-tiers | List configured referral tiers and rewards | Secret / Publishable |

### 6.3.4 Analytics

| **Method** | **Endpoint** | **Description** | **Auth** |
| --- | --- | --- | --- |
| GET | /v1/projects/:id/analytics/overview | Aggregate stats: total signups, conversion rate, referral rate | Secret Key |
| GET | /v1/projects/:id/analytics/timeseries | Signup counts over time (hourly, daily, weekly granularity) | Secret Key |
| GET | /v1/projects/:id/analytics/sources | Breakdown by traffic source | Secret Key |
| GET | /v1/projects/:id/analytics/locations | Geographic distribution of signups | Secret Key |

### 6.3.5 Integrations

| **Method** | **Endpoint** | **Description** | **Auth** |
| --- | --- | --- | --- |
| GET | /v1/projects/:id/integrations | List configured integrations | Secret Key |
| POST | /v1/projects/:id/integrations | Add new integration | Secret Key |
| PATCH | /v1/projects/:id/integrations/:int_id | Update integration config | Secret Key |
| DELETE | /v1/projects/:id/integrations/:int_id | Remove integration | Secret Key |
| POST | /v1/projects/:id/integrations/:int_id/test | Send test event to integration | Secret Key |

### 6.3.6 Hosted Pages

| **Method** | **Endpoint** | **Description** | **Auth** |
| --- | --- | --- | --- |
| GET | /v1/projects/:id/page | Get hosted page configuration | Secret Key |
| PUT | /v1/projects/:id/page | Create or replace hosted page config | Secret Key |
| PATCH | /v1/projects/:id/page | Update hosted page settings | Secret Key |
| POST | /v1/projects/:id/page/publish | Publish draft to production CDN | Secret Key |
| POST | /v1/projects/:id/page/unpublish | Take page offline | Secret Key |

## 6.4 BYOUI Implementation Guide

The Bring Your Own UI pattern enables developers to build entirely custom waitlist experiences using only the NexusWait API. This is the recommended approach for teams with existing marketing sites who want full design control.

### 6.4.1 Client-Side Flow

The standard BYOUI flow for capturing signups from a custom frontend:

- Frontend renders a custom form with any fields mapped to the project's form configuration.
- On submit, the frontend sends a POST request to /v1/projects/:id/subscribers using the publishable key.
- The API validates the submission, applies bot detection, and returns the created subscriber object (or a 422 error with field-level validation details).
- The frontend displays a success state, optionally including the subscriber's referral link from the response.
- For double opt-in projects, the API automatically sends a verification email; the frontend should display instructions to the user.

### 6.4.2 SDK Libraries

Official SDK libraries wrap the REST API with typed interfaces and built-in best practices:

| **SDK** | **Install** | **Key Features** |
| --- | --- | --- |
| JavaScript / TypeScript | npm install @nexuswait/sdk | Tree-shakeable, works in browser + Node.js, automatic retry, TypeScript types for all resources |
| Python | pip install nexuswait | Sync and async clients, Pydantic models, webhook signature verification |
| React Hook | npm install @nexuswait/react | useNexusWait() hook with form state management, submission handling, referral link generation |

### 6.4.3 Example: React BYOUI Implementation

The following pseudocode demonstrates a typical BYOUI integration using the React hook:

import { useNexusWait } from '@nexuswait/react';

function WaitlistForm() {

const { submit, status, referralLink, error } = useNexusWait({

projectId: 'prj_abc123',

publishableKey: 'nw_pk_live_...',

});

// Render your own UI, call submit({ email, name, ... })

// Handle status: 'idle' | 'loading' | 'success' | 'error'

// Display referralLink after success for viral sharing

}

## 6.5 Rate Limiting & Quotas

| **Plan** | **API Rate Limit** | **Webhooks / min** | **Max Integrations / Project** | **SDK Support** |
| --- | --- | --- | --- | --- |
| Spark (Free) | 10 req/s | 10  | 2   | JavaScript only |
| Pulse | 100 req/s | 100 | 10  | All SDKs |
| Nexus | 500 req/s | Unlimited | Unlimited | All SDKs + Priority |
| Enterprise | Custom | Custom | Custom | All + Dedicated |

# 7\. Referral Engine

The referral engine is a core differentiator for NexusWait. It enables viral growth loops where existing waitlist subscribers incentivize new signups through unique referral links.

## 7.1 Referral Flow

- Upon signup, each subscriber receives a unique referral link containing their referral code (e.g., nexuswait.io/project-slug?ref=ABC123).
- When a new user visits the waitlist via this referral link, the referral code is captured and stored in a cookie (30-day expiry) and URL parameter.
- When the referred user signs up, the system creates a referral relationship: referrer → referred.
- The referrer's referral count is incremented. If the count crosses a tier threshold, a milestone event is triggered.
- Both the referrer and referred subscriber can receive configurable rewards (priority access, exclusive content, discount codes).

## 7.2 Referral Tier Configuration

| **Field** | **Type** | **Description** |
| --- | --- | --- |
| tier_name | String | Display name (e.g., "Gold") |
| min_referrals | Integer | Minimum referral count to enter this tier |
| max_referrals | Integer? | Upper bound (null = unlimited) |
| reward_type | Enum | priority_access, discount_code, custom_message, webhook_trigger, badge |
| reward_config | JSON | Type-specific config: discount percentage, message text, webhook URL, badge image URL |
| notification_template | String? | Custom email template ID to notify the referrer on tier achievement |

## 7.3 Fraud Prevention

- Duplicate detection: same email, device fingerprint, or IP within a configurable window (default 24 hours) is flagged and not counted.
- Velocity checks: more than N signups from the same referral link within M minutes triggers a review hold.
- Device fingerprinting: browser fingerprint (canvas, WebGL, audio context) is hashed and stored for cross-reference.
- Self-referral prevention: referrer cannot refer their own email or any email previously associated with the same device fingerprint.
- Manual review queue: flagged signups appear in the dashboard for manual approve/reject.

# 8\. Analytics & Reporting

## 8.1 Dashboard Metrics

| **Metric** | **Description** | **Granularity** |
| --- | --- | --- |
| Total Signups | Cumulative subscriber count | Real-time |
| Signups Over Time | Time-series chart of signup volume | Hourly / Daily / Weekly |
| Conversion Rate | Page views to signups ratio (hosted pages) | Daily |
| Referral Rate | Percentage of signups that came via referral | Daily |
| Referral Multiplier | Average referrals per subscriber | Daily |
| Top Sources | Traffic source breakdown (direct, social, referral, organic) | Daily |
| Geographic Distribution | Signups by country and city | Daily |
| Device & Browser | Signups by device type, OS, and browser | Daily |
| Form Drop-off | Field-by-field abandonment rate | Daily |
| Referral Leaderboard | Ranked list of top referrers with counts | Real-time |

## 8.2 Data Export

- CSV export: download subscriber list with all fields, referral data, and metadata.
- Scheduled reports: daily or weekly summary emails with key metrics (Pulse tier and above).
- API access: all analytics available via the /analytics endpoints for custom dashboards.
- Segment integration: automatic event forwarding to Segment for downstream analytics tools.

# 9\. Security & Compliance

## 9.1 Data Protection

- All data encrypted at rest (AES-256) and in transit (TLS 1.3).
- PII (email, name, phone) is encrypted at the application layer with per-tenant encryption keys.
- API keys are hashed (bcrypt) and stored as prefixed partial values; full keys are shown only once at creation.
- Integration credentials (OAuth tokens, API keys) are encrypted with a dedicated KMS key and stored in a separate secrets vault.
- Subscriber data is logically isolated per account with row-level security policies in PostgreSQL.

## 9.2 Compliance

| **Requirement** | **Status** | **Details** |
| --- | --- | --- |
| GDPR | Compliant | Data deletion API, consent tracking, right-to-export, DPA available |
| CCPA | Compliant | Do-not-sell header support, deletion requests, privacy policy template |
| SOC 2 Type II | In Progress | Audit scheduled Q3 2026, targeting certification by Q4 2026 |
| HIPAA | Not Applicable | Platform does not process PHI; enterprise customers with specific needs can use API-only mode with their own compliant storage |

## 9.3 Access Control

- Role-Based Access Control (RBAC): Owner, Admin, Editor, Viewer roles with granular permissions per project.
- SSO support: SAML 2.0 and OIDC for enterprise plans with directory sync (Okta, Azure AD, Google Workspace).
- Audit log: all configuration changes, API key operations, and data access events are logged with actor, timestamp, and IP address.
- Session management: configurable session timeout, concurrent session limits, and forced logout capability.

# 10\. Non-Functional Requirements

## 10.1 Performance

| **Requirement** | **Target** | **Measurement** |
| --- | --- | --- |
| Hosted page load (TTFB) | < 100ms globally | Synthetic monitoring from 10+ regions |
| API response time (p50) | < 50ms | Internal APM |
| API response time (p99) | < 200ms | Internal APM |
| Webhook delivery (p50) | < 500ms from event | Delivery log timestamps |
| Form submission processing | < 150ms end-to-end | Client-side measurement |
| Dashboard data freshness | < 5 seconds for real-time metrics | Event pipeline lag monitoring |

## 10.2 Scalability

- Horizontal auto-scaling for all application services based on CPU and request count.
- Database read replicas for analytics queries; write primary with automated failover.
- CDN edge caching for hosted pages with instant purge on publish.
- Event bus designed for 100,000+ events/minute sustained throughput.
- Multi-region deployment: primary in us-east-1, failover in eu-west-1 (enterprise).

## 10.3 Reliability

- 99.95% uptime SLA for Pulse tier; 99.99% for Nexus/Enterprise.
- Automated database backups every 6 hours with 90-day retention and point-in-time recovery.
- Zero-downtime deployments via blue-green deployment strategy.
- Circuit breakers on all external integration calls to prevent cascade failures.
- Chaos engineering program: monthly game days to test failure scenarios.

# 11\. Phased Roadmap

## 11.1 Phase 1 - Foundation (Q2 2026)

Goal: Launch core hosted pages, form integrations, and public API.

- Hosted page builder with 4 templates, custom domain, SEO configuration
- Form submit integrations: Mailchimp, Slack, Webhook, Zapier
- Public REST API v1 with publishable and secret key auth
- JavaScript SDK and React hook (@nexuswait/sdk, @nexuswait/react)
- Updated dashboard with hosted page management and integration configuration
- Documentation site with API reference, quickstart guides, and integration tutorials

## 11.2 Phase 2 - Growth (Q3 2026)

Goal: Expand integrations, add A/B testing, and launch Python SDK.

- Additional integrations: HubSpot, SendGrid, Google Sheets, Segment, Intercom, Discord
- A/B testing for hosted pages: test headlines, form fields, CTA copy, and themes
- Python SDK with sync/async support
- Advanced referral tiers with custom reward types (discount codes, badge images)
- Scheduled CSV exports and automated weekly report emails
- Embeddable form widget (non-iframe) with 3 layout options

## 11.3 Phase 3 - Enterprise (Q4 2026)

Goal: Enterprise readiness with SSO, audit logs, and compliance certifications.

- SSO (SAML 2.0 / OIDC) with directory sync
- Granular RBAC with custom role definitions
- Audit logging with exportable logs and SIEM integration
- SOC 2 Type II certification
- Data residency options (US, EU, APAC)
- Supabase native integration for developer-first teams
- White-label mode: fully custom domain, remove all NexusWait branding, custom email sender domain
- Dedicated account management and custom SLA agreements

# 12\. Pricing Model

| **Feature** | **Spark (Free)** | **Pulse (\$29/mo)** | **Nexus (\$99/mo)** | **Enterprise** |
| --- | --- | --- | --- | --- |
| Projects | 1   | 10  | Unlimited | Unlimited |
| Signups / month | 500 | 25,000 | Unlimited | Unlimited |
| Hosted Pages | 1 (NexusWait branding) | 10 (custom branding) | Unlimited (white-label) | Unlimited (white-label) |
| Custom Domains | No  | Yes | Yes | Yes |
| Form Integrations | Webhook only | All native | All native + priority | All + custom |
| API Access | Publishable key only | Full API | Full API | Full API |
| Rate Limit | 10 req/s | 100 req/s | 500 req/s | Custom |
| SDKs | JavaScript | All | All | All + dedicated |
| Referral Engine | Basic (1 tier) | Advanced (5 tiers) | Advanced (unlimited tiers) | Advanced + custom |
| Analytics | Basic | Advanced + funnels | Full suite + exports | Full + SIEM |
| A/B Testing | No  | Yes | Yes | Yes |
| SSO / RBAC | No  | No  | Yes | Yes + custom roles |
| Audit Logs | No  | No  | 90 days | Custom retention |
| Support | Community | Priority email | Dedicated Slack | Dedicated AM + SLA |

# 13\. Risks & Mitigations

| **Risk** | **Likelihood** | **Impact** | **Mitigation Strategy** |
| --- | --- | --- | --- |
| Bot/spam abuse on free tier | High | Medium | Rate limiting, hCaptcha, device fingerprinting, honeypot fields; automatic suspension of projects exceeding abuse thresholds |
| Third-party integration downtime | Medium | High | Circuit breakers, retry queues with DLQ, integration health dashboard, fallback notification to project owner |
| Data breach / PII exposure | Low | Critical | Application-layer encryption, per-tenant keys, regular penetration testing, bug bounty program, SOC 2 audit |
| API adoption slower than projected | Medium | Medium | Invest in SDK DX, comprehensive docs, video tutorials, developer community (Discord), launch on Hacker News / ProductHunt |
| Hosted page performance degradation under load | Low | High | Edge caching with Cloudflare, static pre-rendering, auto-scaling, synthetic monitoring with < 100ms TTFB alerting |
| Competitor feature parity | Medium | Medium | Focus on developer experience and referral engine as differentiators; maintain fast shipping cadence; build community moat |

# 14\. Appendices

## 14.1 Glossary

| **Term** | **Definition** |
| --- | --- |
| BYOUI | Bring Your Own UI - using the NexusWait API without any NexusWait-rendered frontend components |
| Hosted Page | A fully managed landing page served from NexusWait's CDN with visual editor customization |
| Publishable Key | A client-safe API key that can be embedded in frontend code; limited to signup creation and public data |
| Secret Key | A server-side API key with full access to all API resources; must never be exposed client-side |
| Referral Tier | A threshold-based reward level that subscribers achieve by referring others to the waitlist |
| Integration Bus | The async event queue system that dispatches signup events to configured third-party integrations |
| DLQ (Dead Letter Queue) | A queue for events that failed delivery after all retry attempts; available for manual reprocessing |
| HMAC Signature | A cryptographic hash used to verify webhook payload authenticity using a shared secret |

## 14.2 Document Revision History

| **Version** | **Date** | **Author** | **Changes** |
| --- | --- | --- | --- |
| 1.0 | January 15, 2026 | Product Team | Initial PRD covering dashboard, project management, and basic analytics |
| 1.5 | February 20, 2026 | Product Team | Added referral engine specification and integration framework |
| 2.0 | March 11, 2026 | Product Team | Added hosted pages, form submit integrations, API/BYOUI specification, security requirements, and phased roadmap |

## 14.3 Open Questions

| **#** | **Question** | **Owner** | **Status** |
| --- | --- | --- | --- |
| 1   | Should we support custom email sender domains on Pulse tier or restrict to Nexus? | Product | Open |
| 2   | What is the maximum hosted page size (sections/assets) before we require CDN sharding? | Engineering | Under Review |
| 3   | Do we need a separate GraphQL API or is REST sufficient for all personas? | Engineering | Deferred to Phase 3 |
| 4   | Should A/B test results be accessible via the public API or dashboard-only? | Product | Open |
| 5   | How do we handle GDPR data deletion requests for referral chains (cascading deletes)? | Legal / Engineering | Under Review |

**END OF DOCUMENT**