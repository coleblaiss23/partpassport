-- AVL metadata, inventory custody, compliance expirations, audit share links
ALTER TABLE "Part" ADD COLUMN IF NOT EXISTS "custodyStatus" TEXT NOT NULL DEFAULT 'QUARANTINE';
ALTER TABLE "Part" ADD COLUMN IF NOT EXISTS "birthCertificateHash" TEXT;

CREATE INDEX IF NOT EXISTS "Part_currentOrgId_custodyStatus_idx" ON "Part"("currentOrgId", "custodyStatus");
CREATE INDEX IF NOT EXISTS "Part_currentOrgId_isLifeLimited_idx" ON "Part"("currentOrgId", "isLifeLimited");

ALTER TABLE "approved_vendors" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "approved_vendors" ADD COLUMN IF NOT EXISTS "ratings" TEXT;
CREATE INDEX IF NOT EXISTS "approved_vendors_organizationId_expiresAt_idx" ON "approved_vendors"("organizationId", "expiresAt");

CREATE TABLE IF NOT EXISTS "ComplianceItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ComplianceItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ComplianceItem_organizationId_expiresAt_idx" ON "ComplianceItem"("organizationId", "expiresAt");
CREATE INDEX IF NOT EXISTS "ComplianceItem_organizationId_category_idx" ON "ComplianceItem"("organizationId", "category");

DO $$ BEGIN
  ALTER TABLE "ComplianceItem" ADD CONSTRAINT "ComplianceItem_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "AuditShare" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "packageType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "encPayload" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),
    CONSTRAINT "AuditShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuditShare_tokenHash_key" ON "AuditShare"("tokenHash");
CREATE INDEX IF NOT EXISTS "AuditShare_organizationId_createdAt_idx" ON "AuditShare"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditShare_expiresAt_idx" ON "AuditShare"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "AuditShare" ADD CONSTRAINT "AuditShare_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
