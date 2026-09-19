-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "description" TEXT,
    "scrapped" BOOLEAN NOT NULL DEFAULT false,
    "currentOrgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartEvent" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "prevEventHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "certificateHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateCheck" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "extracted" TEXT NOT NULL,
    "redFlags" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyFlag" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "partNumberNorm" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serialRangeStart" TEXT,
    "serialRangeEnd" TEXT,
    "issuedDate" TIMESTAMP(3) NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_apiKeyHash_key" ON "Organization"("apiKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "Part_partNumber_serialNumber_key" ON "Part"("partNumber", "serialNumber");

-- CreateIndex
CREATE INDEX "PartEvent_partId_timestamp_idx" ON "PartEvent"("partId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PartEvent_partId_seq_key" ON "PartEvent"("partId", "seq");

-- CreateIndex
CREATE INDEX "CertificateCheck_organizationId_idx" ON "CertificateCheck"("organizationId");

-- CreateIndex
CREATE INDEX "SafetyFlag_partNumberNorm_idx" ON "SafetyFlag"("partNumberNorm");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyFlag_source_referenceId_partNumberNorm_key" ON "SafetyFlag"("source", "referenceId", "partNumberNorm");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_currentOrgId_fkey" FOREIGN KEY ("currentOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartEvent" ADD CONSTRAINT "PartEvent_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartEvent" ADD CONSTRAINT "PartEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateCheck" ADD CONSTRAINT "CertificateCheck_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
