-- Add reset token fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetExpires" TIMESTAMP(3); 