-- Add reportsTo relation to Employee table
ALTER TABLE "Employee" ADD COLUMN "reportsToId" TEXT REFERENCES "Employee"("id");

-- Add index for better query performance
CREATE INDEX "Employee_reportsToId_idx" ON "Employee"("reportsToId");
