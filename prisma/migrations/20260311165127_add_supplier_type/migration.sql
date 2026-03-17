-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('PRODUTOS', 'SERVICOS', 'OUTRO');

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "type" "SupplierType" NOT NULL DEFAULT 'OUTRO';
