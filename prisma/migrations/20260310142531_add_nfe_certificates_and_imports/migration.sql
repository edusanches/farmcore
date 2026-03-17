-- CreateEnum
CREATE TYPE "NfeImportStatus" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- CreateTable
CREATE TABLE "farm_certificates" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "subjectName" TEXT,
    "serialNumber" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "pfxEncrypted" BYTEA NOT NULL,
    "pfxIv" TEXT NOT NULL,
    "pfxAuthTag" TEXT NOT NULL,
    "passwordEncrypted" BYTEA NOT NULL,
    "passwordIv" TEXT NOT NULL,
    "passwordAuthTag" TEXT NOT NULL,
    "lastNsu" TEXT NOT NULL DEFAULT '0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farm_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfe_imports" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "chaveAcesso" TEXT NOT NULL,
    "numero" TEXT,
    "serie" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "xmlContent" TEXT NOT NULL,
    "emitenteCnpj" TEXT,
    "emitenteNome" TEXT,
    "emitenteUf" TEXT,
    "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorProdutos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorFrete" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorDesconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "NfeImportStatus" NOT NULL DEFAULT 'PENDENTE',
    "supplierId" TEXT,
    "transactionId" TEXT,
    "purchaseId" TEXT,
    "rejectionReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfe_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfe_import_items" (
    "id" TEXT NOT NULL,
    "nfeImportId" TEXT NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT NOT NULL,
    "ncm" TEXT,
    "cfop" TEXT,
    "unidade" TEXT,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "nfe_import_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farm_certificates_farmId_key" ON "farm_certificates"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "nfe_imports_chaveAcesso_key" ON "nfe_imports"("chaveAcesso");

-- CreateIndex
CREATE UNIQUE INDEX "nfe_imports_transactionId_key" ON "nfe_imports"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "nfe_imports_purchaseId_key" ON "nfe_imports"("purchaseId");

-- CreateIndex
CREATE INDEX "nfe_imports_farmId_status_idx" ON "nfe_imports"("farmId", "status");

-- CreateIndex
CREATE INDEX "nfe_imports_farmId_dataEmissao_idx" ON "nfe_imports"("farmId", "dataEmissao");

-- AddForeignKey
ALTER TABLE "farm_certificates" ADD CONSTRAINT "farm_certificates_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfe_imports" ADD CONSTRAINT "nfe_imports_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfe_imports" ADD CONSTRAINT "nfe_imports_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfe_imports" ADD CONSTRAINT "nfe_imports_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfe_imports" ADD CONSTRAINT "nfe_imports_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfe_import_items" ADD CONSTRAINT "nfe_import_items_nfeImportId_fkey" FOREIGN KEY ("nfeImportId") REFERENCES "nfe_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
