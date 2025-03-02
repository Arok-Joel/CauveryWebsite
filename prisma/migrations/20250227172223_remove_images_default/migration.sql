/*
  Warnings:

  - Made the column `images` on table `Plot` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Plot" ALTER COLUMN "images" SET NOT NULL,
ALTER COLUMN "images" DROP DEFAULT;
