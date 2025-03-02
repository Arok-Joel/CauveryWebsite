/*
  Warnings:

  - You are about to drop the `Plot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Plot" DROP CONSTRAINT "Plot_layoutId_fkey";

-- DropTable
DROP TABLE "Plot";

-- CreateTable
CREATE TABLE "sold_plots" (
    "id" TEXT NOT NULL,
    "plotNumber" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "plotAddress" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
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

    CONSTRAINT "sold_plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plots" (
    "id" TEXT NOT NULL,
    "plotNumber" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "plotAddress" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "dimensions" TEXT NOT NULL,
    "facing" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "coordinates" JSONB,
    "images" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "layoutId" TEXT,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sold_plots_plotId_key" ON "sold_plots"("plotId");

-- AddForeignKey
ALTER TABLE "sold_plots" ADD CONSTRAINT "sold_plots_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plots" ADD CONSTRAINT "plots_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
