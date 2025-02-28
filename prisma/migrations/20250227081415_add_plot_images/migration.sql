-- CreateTable
CREATE TABLE "PlotImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plotId" TEXT NOT NULL,

    CONSTRAINT "PlotImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlotImage" ADD CONSTRAINT "PlotImage_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
