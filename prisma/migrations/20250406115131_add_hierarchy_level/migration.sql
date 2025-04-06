-- DropForeignKey
ALTER TABLE "Commission" DROP CONSTRAINT "Commission_employeeId_fkey";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "hierarchyLevel" INTEGER NOT NULL DEFAULT 0;
