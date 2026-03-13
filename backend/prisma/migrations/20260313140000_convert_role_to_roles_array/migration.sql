-- AlterTable: Convert single role to roles array
-- Step 1: Add the new roles column as a UserRole array, defaulting to [user]
ALTER TABLE "User" ADD COLUMN "roles" "UserRole"[] NOT NULL DEFAULT ARRAY['user']::"UserRole"[];

-- Step 2: Copy existing single role value into the new roles array
UPDATE "User" SET "roles" = ARRAY["role"];

-- Step 3: Drop the old single role column
ALTER TABLE "User" DROP COLUMN "role";
