-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "max_retry_attempts" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "plan_config" (
    "id" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "monthly_price_cents" INTEGER NOT NULL,
    "yearly_price_cents" INTEGER NOT NULL,
    "max_projects" INTEGER,
    "max_subscribers_month" INTEGER,
    "max_integrations" INTEGER,
    "features" TEXT[],
    "polar_product_id_monthly" TEXT,
    "polar_product_id_yearly" TEXT,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "cta_text" TEXT NOT NULL DEFAULT 'Get Started',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_delivery_log" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "response_status" INTEGER,
    "response_body" TEXT,
    "duration_ms" INTEGER,
    "error" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_delivery_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_config_tier_key" ON "plan_config"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_event_id_key" ON "webhook_event"("event_id");

-- CreateIndex
CREATE INDEX "webhook_event_event_type_idx" ON "webhook_event"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_delivery_log_idempotency_key_key" ON "webhook_delivery_log"("idempotency_key");

-- CreateIndex
CREATE INDEX "webhook_delivery_log_integration_id_created_at_idx" ON "webhook_delivery_log"("integration_id", "created_at");

-- AddForeignKey
ALTER TABLE "webhook_delivery_log" ADD CONSTRAINT "webhook_delivery_log_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
