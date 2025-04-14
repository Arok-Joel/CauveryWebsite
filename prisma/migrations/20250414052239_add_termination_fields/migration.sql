/*
  Warnings:

  - You are about to drop the column `leadsTeamId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `SoldPlot` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Commission" DROP CONSTRAINT "Commission_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "SoldPlot" DROP CONSTRAINT "SoldPlot_employeeId_fkey";

-- DropIndex
DROP INDEX "Employee_leadsTeamId_key";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "leadsTeamId",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "SoldPlot" DROP COLUMN "employeeId";

-- DropEnum
DROP TYPE "EmployeeStatus";

-- DropEnum
DROP TYPE "UserStatus";
