/*
  Warnings:

  - You are about to drop the `plots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sold_plots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "plots" DROP CONSTRAINT "plots_layoutId_fkey";

-- DropForeignKey
ALTER TABLE "sold_plots" DROP CONSTRAINT "sold_plots_plotId_fkey";

-- DropTable
DROP TABLE "plots";

-- DropTable
DROP TABLE "sold_plots";

-- CreateTable
CREATE TABLE "SoldPlot" (
    "id" TEXT NOT NULL,
    "plotNumber" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "plotAddress" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "dimensions" TEXT NOT NULL,
    "facing" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "aadhaarNumber" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plotId" TEXT NOT NULL,

    CONSTRAINT "SoldPlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "plotNumber" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "plotAddress" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "dimensions" TEXT NOT NULL,
    "facing" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "images" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "layoutId" TEXT,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SoldPlot_plotId_key" ON "SoldPlot"("plotId");

-- CreateIndex
CREATE UNIQUE INDEX "Plot_plotNumber_key" ON "Plot"("plotNumber");

-- AddForeignKey
ALTER TABLE "SoldPlot" ADD CONSTRAINT "SoldPlot_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
