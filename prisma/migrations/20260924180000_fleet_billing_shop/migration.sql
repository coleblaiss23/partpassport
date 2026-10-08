-- Remap Plan enum: PILOT→STARTER, PRO→PROFESSIONAL; keep ENTERPRISE
ALTER TABLE "Organization" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "Organization" ALTER COLUMN "plan" TYPE TEXT USING (
  CASE
    WHEN "plan"::text = 'PILOT' THEN 'STARTER'
    WHEN "plan"::text = 'PRO' THEN 'PROFESSIONAL'
    ELSE "plan"::text
  END
);
DROP TYPE "Plan";
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
ALTER TABLE "Organization" ALTER COLUMN "plan" TYPE "Plan" USING "plan"::"Plan";
ALTER TABLE "Organization" ALTER COLUMN "plan" SET DEFAULT 'STARTER';

-- Organization billing / limits
ALTER TABLE "Organization" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "maxAircraft" INTEGER;
ALTER TABLE "Organization" ADD COLUMN "features" TEXT;

-- New enums
CREATE TYPE "ComplianceStatus" AS ENUM ('OPEN', 'COMPLIED', 'NOT_APPLICABLE', 'OVERDUE');
CREATE TYPE "LimitBasis" AS ENUM ('CALENDAR', 'HOURS', 'CYCLES');
CREATE TYPE "DocumentKind" AS ENUM ('LOGBOOK', 'INVOICE', 'CERTIFICATE', 'OTHER');
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'EXTRACTED', 'FAILED');
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
CREATE TYPE "InvoicePaymentStatus" AS ENUM ('PENDING', 'PAID', 'CHECK_RECEIVED', 'VOID');
CREATE TYPE "PaymentMethodHint" AS ENUM ('CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'CHECK', 'MANUAL');

-- Shop
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "faaRepairStationNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- Aircraft
CREATE TABLE "Aircraft" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tailNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "series" TEXT,
    "serialNumber" TEXT,
    "engineModel" TEXT,
    "airframeHours" DOUBLE PRECISION,
    "hobbsHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("id")
);

-- AircraftADStatus
CREATE TABLE "AircraftADStatus" (
    "id" TEXT NOT NULL,
    "aircraftId" TEXT NOT NULL,
    "safetyFlagId" TEXT NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'OPEN',
    "compliedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "notes" TEXT,
    "signedOffByUserId" TEXT,
    "signedOffByName" TEXT,
    "signedOffAt" TIMESTAMP(3),
    "certificateRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AircraftADStatus_pkey" PRIMARY KEY ("id")
);

-- LifeLimitedComponent
CREATE TABLE "LifeLimitedComponent" (
    "id" TEXT NOT NULL,
    "aircraftId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "limitBasis" "LimitBasis" NOT NULL,
    "installedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "intervalDays" INTEGER,
    "intervalHours" DOUBLE PRECISION,
    "intervalCycles" INTEGER,
    "currentHours" DOUBLE PRECISION,
    "currentCycles" INTEGER,
    "lastCompliedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifeLimitedComponent_pkey" PRIMARY KEY ("id")
);

-- WorkOrder (before DocumentUpload / Invoice FKs)
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shopId" TEXT,
    "aircraftId" TEXT,
    "number" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "assignedMechanicUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- DocumentUpload
CREATE TABLE "DocumentUpload" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "aircraftId" TEXT,
    "workOrderId" TEXT,
    "kind" "DocumentKind" NOT NULL DEFAULT 'OTHER',
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT,
    "extracted" TEXT,
    "errorMessage" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentUpload_pkey" PRIMARY KEY ("id")
);

-- Invoice
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shopId" TEXT,
    "aircraftId" TEXT,
    "workOrderId" TEXT,
    "number" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "paymentStatus" "InvoicePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "paymentMethodHint" "PaymentMethodHint",
    "paidAt" TIMESTAMP(3),
    "checkReceivedAt" TIMESTAMP(3),
    "customerEmail" TEXT,
    "lineItems" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- MechanicCertificate
CREATE TABLE "MechanicCertificate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "certificateType" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "ratings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MechanicCertificate_pkey" PRIMARY KEY ("id")
);

-- WebhookEndpoint
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastDeliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- Indexes & uniques
CREATE INDEX "Shop_organizationId_active_idx" ON "Shop"("organizationId", "active");

CREATE UNIQUE INDEX "Aircraft_organizationId_tailNumber_key" ON "Aircraft"("organizationId", "tailNumber");
CREATE INDEX "Aircraft_organizationId_idx" ON "Aircraft"("organizationId");
CREATE INDEX "Aircraft_tailNumber_idx" ON "Aircraft"("tailNumber");

CREATE UNIQUE INDEX "AircraftADStatus_aircraftId_safetyFlagId_key" ON "AircraftADStatus"("aircraftId", "safetyFlagId");
CREATE INDEX "AircraftADStatus_aircraftId_status_idx" ON "AircraftADStatus"("aircraftId", "status");
CREATE INDEX "AircraftADStatus_safetyFlagId_idx" ON "AircraftADStatus"("safetyFlagId");

CREATE INDEX "LifeLimitedComponent_aircraftId_idx" ON "LifeLimitedComponent"("aircraftId");
CREATE INDEX "LifeLimitedComponent_organizationId_dueAt_idx" ON "LifeLimitedComponent"("organizationId", "dueAt");
CREATE INDEX "LifeLimitedComponent_organizationId_category_idx" ON "LifeLimitedComponent"("organizationId", "category");

CREATE UNIQUE INDEX "WorkOrder_organizationId_number_key" ON "WorkOrder"("organizationId", "number");
CREATE INDEX "WorkOrder_organizationId_status_idx" ON "WorkOrder"("organizationId", "status");
CREATE INDEX "WorkOrder_aircraftId_idx" ON "WorkOrder"("aircraftId");
CREATE INDEX "WorkOrder_shopId_idx" ON "WorkOrder"("shopId");

CREATE INDEX "DocumentUpload_organizationId_createdAt_idx" ON "DocumentUpload"("organizationId", "createdAt");
CREATE INDEX "DocumentUpload_aircraftId_idx" ON "DocumentUpload"("aircraftId");
CREATE INDEX "DocumentUpload_workOrderId_idx" ON "DocumentUpload"("workOrderId");
CREATE INDEX "DocumentUpload_status_idx" ON "DocumentUpload"("status");

CREATE UNIQUE INDEX "Invoice_stripePaymentIntentId_key" ON "Invoice"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Invoice_stripeCheckoutSessionId_key" ON "Invoice"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "Invoice_organizationId_number_key" ON "Invoice"("organizationId", "number");
CREATE INDEX "Invoice_organizationId_paymentStatus_idx" ON "Invoice"("organizationId", "paymentStatus");
CREATE INDEX "Invoice_aircraftId_idx" ON "Invoice"("aircraftId");
CREATE INDEX "Invoice_workOrderId_idx" ON "Invoice"("workOrderId");
CREATE INDEX "Invoice_shopId_idx" ON "Invoice"("shopId");

CREATE UNIQUE INDEX "MechanicCertificate_organizationId_certificateNumber_key" ON "MechanicCertificate"("organizationId", "certificateNumber");
CREATE INDEX "MechanicCertificate_organizationId_clerkUserId_idx" ON "MechanicCertificate"("organizationId", "clerkUserId");
CREATE INDEX "MechanicCertificate_organizationId_expiresAt_idx" ON "MechanicCertificate"("organizationId", "expiresAt");

CREATE INDEX "WebhookEndpoint_organizationId_active_idx" ON "WebhookEndpoint"("organizationId", "active");

-- Foreign keys
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Aircraft" ADD CONSTRAINT "Aircraft_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AircraftADStatus" ADD CONSTRAINT "AircraftADStatus_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AircraftADStatus" ADD CONSTRAINT "AircraftADStatus_safetyFlagId_fkey" FOREIGN KEY ("safetyFlagId") REFERENCES "SafetyFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LifeLimitedComponent" ADD CONSTRAINT "LifeLimitedComponent_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LifeLimitedComponent" ADD CONSTRAINT "LifeLimitedComponent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MechanicCertificate" ADD CONSTRAINT "MechanicCertificate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
