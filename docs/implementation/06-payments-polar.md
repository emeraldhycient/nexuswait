# 06 - Payments (Polar.sh)

## Overview

- **Checkout:** Backend creates a Polar checkout session (product/price IDs from env), returns redirect URL. Frontend redirects user to Polar to pay.
- **Webhooks:** Backend receives Polar events (subscription.created, subscription.updated, subscription.cancelled); verifies signature; updates account’s plan and subscription id in DB.
- **Mapping:** Polar product/price IDs map to NexusWait plans: Spark (free), Pulse, Nexus (and optionally Enterprise).

## Checkout Session

- **Endpoint:** `POST /v1/checkout/session` (auth: JWT).
- **Body:** e.g. `{ priceId or productId, successUrl, cancelUrl, customerEmail?, metadata?: { accountId } }`.
- **Backend:** Call Polar API to create checkout session (use Polar SDK or REST). Store `external_customer_id` = accountId (or userId) so webhook can find account. Return `{ url: string }` (redirect URL).
- **Frontend:** Redirect user to `url`; on return to successUrl, show “Thank you” and refresh billing state (e.g. GET /v1/account/billing).

## Polar Webhook

- **Endpoint:** `POST /v1/webhooks/polar` (no JWT; verify Polar signature).
- **Verification:** Use Polar webhook secret to verify request signature (e.g. HMAC or Polar’s documented method). Reject if invalid.
- **Events:** Handle at least:
  - `subscription.created` – create or update PolarSubscription; set account.plan from product/price mapping; set polar_subscription_id, polar_customer_id.
  - `subscription.updated` – update status and plan if changed.
  - `subscription.cancelled` (or equivalent) – set subscription status cancelled; optionally downgrade account to Spark.
- **Idempotency:** Use Polar event id to avoid duplicate processing.

## DB Mapping

- **Account:** fields `plan` (spark | pulse | nexus | enterprise), optional `polar_customer_id`, `polar_subscription_id` (or use separate PolarSubscription table and join).
- **PolarSubscription (optional but recommended):** account_id, polar_subscription_id, polar_customer_id, plan, status (active/cancelled/past_due etc), current_period_end; updated by webhook.

## Plan Mapping

- Env: POLAR_PRODUCT_ID_SPARK (or price), POLAR_PRODUCT_ID_PULSE, POLAR_PRODUCT_ID_NEXUS.
- Map Polar product/price from webhook payload to NexusWait plan; set account.plan and usage limits accordingly.

## Billing UI (Settings)

- `GET /v1/account/billing`: returns current plan, usage (signups count, projects count), next billing date, and optionally a “customer portal” URL from Polar so user can update payment method or cancel. Frontend “Change Plan” / “Update Payment Method” can redirect to Polar checkout or customer portal.

## Summary

- Checkout: POST /v1/checkout/session → Polar session → return URL; frontend redirects.
- Webhook: POST /v1/webhooks/polar → verify → update account plan and subscription state.
- Map Polar products to Spark/Pulse/Nexus; expose billing and portal via GET /v1/account/billing.
