-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_verified_at" TIMESTAMP(3);

-- Backfill: mark all existing users as verified so they aren't locked out
UPDATE "User" SET "email_verified_at" = "created_at" WHERE "email_verified_at" IS NULL;
