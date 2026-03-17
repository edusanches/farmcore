-- CreateTable
CREATE TABLE "ndvi_readings" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mean" DOUBLE PRECISION NOT NULL,
    "min" DOUBLE PRECISION NOT NULL,
    "max" DOUBLE PRECISION NOT NULL,
    "stDev" DOUBLE PRECISION,
    "cloudCoverage" DOUBLE PRECISION,
    "sampleCount" INTEGER,
    "noDataCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ndvi_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ndvi_readings_areaId_date_idx" ON "ndvi_readings"("areaId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ndvi_readings_areaId_date_key" ON "ndvi_readings"("areaId", "date");

-- AddForeignKey
ALTER TABLE "ndvi_readings" ADD CONSTRAINT "ndvi_readings_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
