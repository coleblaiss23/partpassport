-- CreateTable
CREATE TABLE "approved_vendors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approved_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approved_vendors_organizationId_isActive_idx" ON "approved_vendors"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "approved_vendors_organizationId_supplierName_idx" ON "approved_vendors"("organizationId", "supplierName");

-- CreateIndex
CREATE UNIQUE INDEX "approved_vendors_organizationId_supplierName_certificateNum_key" ON "approved_vendors"("organizationId", "supplierName", "certificateNumber");

-- AddForeignKey
ALTER TABLE "approved_vendors" ADD CONSTRAINT "approved_vendors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
