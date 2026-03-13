-- AlterTable: make password_hash nullable for OAuth users
ALTER TABLE "User" ALTER COLUMN "password_hash" DROP NOT NULL;

-- AddColumn: Google OAuth identifier
ALTER TABLE "User" ADD COLUMN "google_id" TEXT;

-- AddColumn: auth provider (local or google)
ALTER TABLE "User" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'local';

-- AddColumn: avatar URL from Google profile
ALTER TABLE "User" ADD COLUMN "avatar_url" TEXT;

-- CreateIndex: unique constraint on google_id
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");
