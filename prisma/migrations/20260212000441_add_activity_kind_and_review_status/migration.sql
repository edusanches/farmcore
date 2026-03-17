-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('PLANEJADO', 'REALIZADO');

-- AlterEnum
ALTER TYPE "ActivityStatus" ADD VALUE 'REVISAR';

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "kind" "ActivityKind" NOT NULL DEFAULT 'REALIZADO',
ADD COLUMN     "plannedActivityId" TEXT,
ADD COLUMN     "stockId" TEXT;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_plannedActivityId_fkey" FOREIGN KEY ("plannedActivityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "stocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
