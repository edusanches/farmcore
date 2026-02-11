-- CreateEnum
CREATE TYPE "FarmRole" AS ENUM ('OWNER', 'MANAGER', 'ACCOUNTANT', 'WORKER', 'VIEWER');

-- CreateEnum
CREATE TYPE "PlantingType" AS ENUM ('CANA_PLANTA', 'SOQUEIRA', 'OUTRO');

-- CreateEnum
CREATE TYPE "CropStatus" AS ENUM ('PLANEJADA', 'EM_ANDAMENTO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('A_FAZER', 'EM_PROGRESSO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "InputCategory" AS ENUM ('HERBICIDA', 'INSETICIDA', 'FUNGICIDA', 'FERTILIZANTE', 'ADJUVANTE', 'SEMENTE', 'COMBUSTIVEL', 'OUTRO');

-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('KG', 'L', 'T', 'UNIDADE', 'SACO', 'ML', 'G');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDENTE', 'PAGO', 'RECEBIDO', 'CANCELADO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('RASCUNHO', 'CONFIRMADA', 'RECEBIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "document" TEXT,
    "totalArea" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "role" "FarmRole" NOT NULL DEFAULT 'WORKER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sizeHa" DOUBLE PRECISION NOT NULL,
    "geojson" JSONB,
    "color" TEXT DEFAULT '#22c55e',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crops" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plantingType" "PlantingType" NOT NULL DEFAULT 'CANA_PLANTA',
    "variety" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "CropStatus" NOT NULL DEFAULT 'PLANEJADA',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_areas" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "sizeHa" DOUBLE PRECISION,

    CONSTRAINT "crop_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_types" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtypes" TEXT[],
    "icon" TEXT DEFAULT 'activity',
    "color" TEXT DEFAULT '#22c55e',

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "activityTypeId" TEXT NOT NULL,
    "subtype" TEXT,
    "cropId" TEXT,
    "team" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ActivityStatus" NOT NULL DEFAULT 'A_FAZER',
    "totalHa" DOUBLE PRECISION,
    "notes" TEXT,
    "costOverride" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_areas" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "sizeHa" DOUBLE PRECISION,

    CONSTRAINT "activity_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inputs" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InputCategory" NOT NULL,
    "unit" "UnitOfMeasure" NOT NULL DEFAULT 'L',
    "manufacturer" TEXT,
    "activeAgent" TEXT,
    "description" TEXT,
    "minStock" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_entries" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "inputId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "batch" TEXT,
    "unitCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "input_usages" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "inputId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "ratePerHa" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "input_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soil_analyses" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "sampleDate" TIMESTAMP(3) NOT NULL,
    "labName" TEXT,
    "labReportId" TEXT,
    "depth" TEXT DEFAULT '0-20',
    "year" INTEGER NOT NULL,
    "pH" DOUBLE PRECISION,
    "pHType" TEXT DEFAULT 'CaCl2',
    "organicMatter" DOUBLE PRECISION,
    "phosphorus" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "calcium" DOUBLE PRECISION,
    "magnesium" DOUBLE PRECISION,
    "aluminum" DOUBLE PRECISION,
    "hPlusAl" DOUBLE PRECISION,
    "sumOfBases" DOUBLE PRECISION,
    "ctc" DOUBLE PRECISION,
    "baseSaturation" DOUBLE PRECISION,
    "aluminumSaturation" DOUBLE PRECISION,
    "sulfur" DOUBLE PRECISION,
    "boron" DOUBLE PRECISION,
    "copper" DOUBLE PRECISION,
    "iron" DOUBLE PRECISION,
    "manganese" DOUBLE PRECISION,
    "zinc" DOUBLE PRECISION,
    "clayPercent" DOUBLE PRECISION,
    "siltPercent" DOUBLE PRECISION,
    "sandPercent" DOUBLE PRECISION,
    "textureClass" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soil_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT,
    "agency" TEXT,
    "accountNumber" TEXT,
    "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_categories" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "parentId" TEXT,
    "color" TEXT DEFAULT '#6366f1',
    "icon" TEXT,

    CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDENTE',
    "categoryId" TEXT,
    "bankAccountId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "competenceDate" TIMESTAMP(3),
    "documentNumber" TEXT,
    "supplierId" TEXT,
    "purchaseId" TEXT,
    "harvestId" TEXT,
    "parentId" TEXT,
    "installmentNumber" INTEGER,
    "totalInstallments" INTEGER,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'RASCUNHO',
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "invoiceKey" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freightAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "inputId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "UnitOfMeasure" NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvests" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "totalTons" DOUBLE PRECISION NOT NULL,
    "yieldTonsHa" DOUBLE PRECISION,
    "tch" DOUBLE PRECISION,
    "atr" DOUBLE PRECISION,
    "brix" DOUBLE PRECISION,
    "pol" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "purity" DOUBLE PRECISION,
    "salePrice" DOUBLE PRECISION,
    "buyerName" TEXT,
    "ticketNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_records" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tempMin" DOUBLE PRECISION,
    "tempMax" DOUBLE PRECISION,
    "rainfall" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "windSpeed" DOUBLE PRECISION,
    "source" TEXT DEFAULT 'MANUAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "farm_memberships_userId_farmId_key" ON "farm_memberships"("userId", "farmId");

-- CreateIndex
CREATE UNIQUE INDEX "areas_farmId_name_key" ON "areas"("farmId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "crop_areas_cropId_areaId_key" ON "crop_areas"("cropId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_farmId_name_key" ON "activity_types"("farmId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "activities_farmId_code_key" ON "activities"("farmId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "activity_areas_activityId_areaId_key" ON "activity_areas"("activityId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "inputs_farmId_name_key" ON "inputs"("farmId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "input_usages_activityId_inputId_key" ON "input_usages"("activityId", "inputId");

-- CreateIndex
CREATE UNIQUE INDEX "financial_categories_farmId_name_type_key" ON "financial_categories"("farmId", "name", "type");

-- CreateIndex
CREATE INDEX "transactions_farmId_type_status_idx" ON "transactions"("farmId", "type", "status");

-- CreateIndex
CREATE INDEX "transactions_farmId_dueDate_idx" ON "transactions"("farmId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_farmId_name_key" ON "suppliers"("farmId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_farmId_code_key" ON "purchases"("farmId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "weather_records_farmId_date_key" ON "weather_records"("farmId", "date");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_memberships" ADD CONSTRAINT "farm_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_memberships" ADD CONSTRAINT "farm_memberships_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crops" ADD CONSTRAINT "crops_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_areas" ADD CONSTRAINT "crop_areas_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_areas" ADD CONSTRAINT "crop_areas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_types" ADD CONSTRAINT "activity_types_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_areas" ADD CONSTRAINT "activity_areas_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_areas" ADD CONSTRAINT "activity_areas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inputs" ADD CONSTRAINT "inputs_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_entries" ADD CONSTRAINT "inventory_entries_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_entries" ADD CONSTRAINT "inventory_entries_inputId_fkey" FOREIGN KEY ("inputId") REFERENCES "inputs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "input_usages" ADD CONSTRAINT "input_usages_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "input_usages" ADD CONSTRAINT "input_usages_inputId_fkey" FOREIGN KEY ("inputId") REFERENCES "inputs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soil_analyses" ADD CONSTRAINT "soil_analyses_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soil_analyses" ADD CONSTRAINT "soil_analyses_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "financial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "financial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "harvests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_inputId_fkey" FOREIGN KEY ("inputId") REFERENCES "inputs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
