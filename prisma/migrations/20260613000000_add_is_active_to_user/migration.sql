-- Add isActive column to User (default false = pending approval)
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

-- All existing users are already active
UPDATE "User" SET "isActive" = true;
