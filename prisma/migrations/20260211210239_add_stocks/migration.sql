-- CreateEnum
CREATE TYPE "StockType" AS ENUM ('INSUMOS', 'PRODUCAO');

-- AlterTable
ALTER TABLE "crops" ADD COLUMN     "defaultInputStockId" TEXT;

-- CreateTable
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "StockType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stocks_farmId_name_key" ON "stocks"("farmId", "name");

-- AddForeignKey
ALTER TABLE "crops" ADD CONSTRAINT "crops_defaultInputStockId_fkey" FOREIGN KEY ("defaultInputStockId") REFERENCES "stocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
