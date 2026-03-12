-- CreateTable
CREATE TABLE "platform_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "api_base_url" TEXT NOT NULL DEFAULT 'https://api.nexuswait.io',
    "cdn_base_url" TEXT NOT NULL DEFAULT 'https://cdn.nexuswait.io',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);
