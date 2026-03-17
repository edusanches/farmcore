-- DropForeignKey
ALTER TABLE "soil_analyses" DROP CONSTRAINT "soil_analyses_areaId_fkey";

-- AlterTable
ALTER TABLE "soil_analyses" ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "sampleId" TEXT,
ALTER COLUMN "areaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "soil_analyses" ADD CONSTRAINT "soil_analyses_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
