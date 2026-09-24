-- Admin-managed tutorial / training videos
CREATE TABLE IF NOT EXISTS "TutorialVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "embedUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "duration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TutorialVideo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TutorialVideo_published_sortOrder_idx" ON "TutorialVideo"("published", "sortOrder");
CREATE INDEX IF NOT EXISTS "TutorialVideo_category_idx" ON "TutorialVideo"("category");

INSERT INTO "TutorialVideo" ("id", "title", "description", "embedUrl", "category", "sortOrder", "published", "duration", "createdAt", "updatedAt")
SELECT 'seed_avl_bulk',
  'AVL bulk import walkthrough',
  'Map Vendor Name, Cert Number, Expiration Date, and Ratings from a CSV export and import your approved repair stations.',
  '',
  'AVL', 10, true, '5:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "TutorialVideo" WHERE id = 'seed_avl_bulk');

INSERT INTO "TutorialVideo" ("id", "title", "description", "embedUrl", "category", "sortOrder", "published", "duration", "createdAt", "updatedAt")
SELECT 'seed_intake_8130',
  '8130-3 certificate intake',
  'Drop an Authorized Release Certificate into Intake, review Deterministic OCR findings, and read the AVL PASS / FAIL badge.',
  '',
  'INTAKE', 20, true, '6:30', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "TutorialVideo" WHERE id = 'seed_intake_8130');

INSERT INTO "TutorialVideo" ("id", "title", "description", "embedUrl", "category", "sortOrder", "published", "duration", "createdAt", "updatedAt")
SELECT 'seed_audit_share',
  'Encrypted audit package sharing',
  'Generate a temporary read-only link for FAA auditors or airline customers from Tools → Audit share.',
  '',
  'AUDIT_SHARE', 30, true, '4:15', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "TutorialVideo" WHERE id = 'seed_audit_share');
