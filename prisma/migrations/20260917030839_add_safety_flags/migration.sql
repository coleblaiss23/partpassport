-- CreateTable
CREATE TABLE "SafetyFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partNumber" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serialRangeStart" TEXT,
    "serialRangeEnd" TEXT,
    "issuedDate" DATETIME NOT NULL,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SafetyFlag_partNumber_idx" ON "SafetyFlag"("partNumber");
