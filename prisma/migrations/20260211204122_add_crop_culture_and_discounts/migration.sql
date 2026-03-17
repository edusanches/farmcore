-- AlterTable
ALTER TABLE "crops" ADD COLUMN     "culture" TEXT NOT NULL DEFAULT 'CANA_DE_ACUCAR',
ADD COLUMN     "grossWeightDiscounts" JSONB,
ADD COLUMN     "measurementUnit" TEXT,
ADD COLUMN     "netWeightDiscounts" JSONB;
