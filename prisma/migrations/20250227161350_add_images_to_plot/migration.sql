/*
  Warnings:

  - You are about to drop the `PlotImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlotImage" DROP CONSTRAINT "PlotImage_plotId_fkey";

-- AlterTable
ALTER TABLE "Plot" ADD COLUMN     "images" JSONB DEFAULT '[]';

-- DropTable
DROP TABLE "PlotImage";
