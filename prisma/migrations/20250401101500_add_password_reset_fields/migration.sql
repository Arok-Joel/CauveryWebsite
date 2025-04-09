-- Add reset token fields to User table
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN "resetExpires" TIMESTAMP(3); 