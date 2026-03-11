# 05 - Notification System

## Components

1. **Templates** – Stored in DB; define channel, subject, body with placeholders (e.g. `{{email}}`, `{{referralLink}}`).
2. **Notification records** – One row per send attempt: templateId, recipient, payload (JSON), status, attempts, nextRetryAt, lastError.
3. **Retry worker** – Processes pending/retryable notifications with exponential backoff; marks dead_letter after max attempts and can alert project owner.
4. **Enqueue API** – Use cases (e.g. signup, referral milestone) call an application service that creates a notification record and pushes to queue (or marks pending for worker poll).

## NotificationTemplate (DB)

- id, name, channel (e.g. email), subject (optional), body (text or HTML with placeholders).
- Scoped to account_id or global (account_id nullable).
- CRUD via admin API (see 04-api-modules.md).

## Notification (DB)

- id, template_id, recipient (email or identifier), payload (JSON for placeholder substitution).
- status: pending | sent | failed | dead_letter.
- attempts (int, default 0), max_attempts (default 3), next_retry_at, last_error (text), sent_at.
- created_at, updated_at.
- Optional: project_id, account_id for “alert project owner” on dead_letter.

## Retry Policy

- Delays: 1s, 10s, 60s (exponential backoff: attempt 1 → 1s, 2 → 10s, 3 → 60s).
- Max attempts: 3. After third failure: set status to dead_letter; optionally enqueue an “alert project owner” notification or call webhook.
- Worker selects rows where (status = pending OR (status = failed AND next_retry_at <= now)) AND attempts < max_attempts. Process in batches; after send attempt, update attempts, next_retry_at, status, last_error, sent_at.

## Flow

1. **Enqueue:** Use case (e.g. CreateSubscriber) calls `NotificationService.enqueue(templateKeyOrId, recipient, payload)`. Implementation: create Notification row (status pending), then add job to queue (or leave for worker to poll by next_retry_at).
2. **Worker:** Picks job (or polls DB), loads template, substitutes placeholders from payload, calls email/send adapter. On success: status = sent, sent_at = now. On failure: status = failed, attempts++, next_retry_at = now + delay, last_error = message. If attempts >= max_attempts: status = dead_letter; optionally trigger alert.
3. **Send adapter:** Interface (e.g. `ISendNotification`) with method `send(to, subject, body)` or similar. Implementation can use SendGrid, Resend, or SMTP.

## Integration Points

- **Signup confirmation (double opt-in):** After creating subscriber, if project has double_opt_in, enqueue notification with template e.g. `signup_confirm` and payload { email, confirmLink, ... }.
- **Referral milestone:** When referrer’s count crosses a tier, enqueue notification with template e.g. `referral_milestone` and payload { email, tierName, rewardDetails, ... }.
- **Dead-letter alert:** When a notification becomes dead_letter, enqueue internal “alert project owner” (or webhook) so owner can be notified (per PRD).

## Summary

- Templates in DB; notifications in DB with status and retry fields.
- Retry: 1s, 10s, 60s; max 3 attempts; then dead_letter + optional alert.
- Use cases enqueue via application service; worker processes queue/DB and uses send adapter; no direct send in use cases.
