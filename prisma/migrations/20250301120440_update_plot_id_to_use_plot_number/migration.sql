/*
  Warnings:

  - A unique constraint covering the columns `[plotNumber]` on the table `plots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "plots_plotNumber_key" ON "plots"("plotNumber");
