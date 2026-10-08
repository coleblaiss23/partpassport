-- Cached FAA / ADS-B style N-number registry for fleet enrichment
CREATE TABLE "AircraftRegistry" (
    "id" TEXT NOT NULL,
    "tailNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "serialNumber" TEXT,
    "engineModel" TEXT,
    "series" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "rawPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AircraftRegistry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AircraftRegistry_tailNumber_key" ON "AircraftRegistry"("tailNumber");
CREATE INDEX "AircraftRegistry_make_model_idx" ON "AircraftRegistry"("make", "model");

-- Seed a few known GA / demo tails so enrichment works without a full FAA dump.
INSERT INTO "AircraftRegistry" ("id", "tailNumber", "make", "model", "year", "serialNumber", "engineModel", "series", "source", "updatedAt")
VALUES
  ('seed_reg_n4867w', 'N4867W', 'Rockwell International', '114', 1976, '14197', 'Lycoming IO-540-T4A5D', NULL, 'FAA', CURRENT_TIMESTAMP),
  ('seed_reg_n172sp', 'N172SP', 'Cessna', '172S', 2000, '172S8001', 'Lycoming IO-360-L2A', 'Skyhawk SP', 'MANUAL', CURRENT_TIMESTAMP),
  ('seed_reg_n738ms', 'N738MS', 'Cessna', '172N', 1978, '17271034', 'Lycoming O-320-H2AD', NULL, 'MANUAL', CURRENT_TIMESTAMP),
  ('seed_reg_n12345', 'N12345', 'Piper', 'PA-28-181', 1979, '28-7990123', 'Lycoming O-360-A4M', 'Archer', 'MANUAL', CURRENT_TIMESTAMP),
  ('seed_reg_n320aa', 'N320AA', 'Airbus', 'A320-214', 2005, 'MSN2500', 'CFM56-5B4', NULL, 'MANUAL', CURRENT_TIMESTAMP)
ON CONFLICT ("tailNumber") DO NOTHING;

-- Sample airframe AD rows so GA templates / N4867W demonstrate OPEN AD linking
-- (TOC ingest is transport-heavy; these fill the make/model matcher for demos).
INSERT INTO "SafetyFlag" ("id", "partNumber", "partNumberNorm", "source", "referenceId", "description", "issuedDate", "createdAt")
VALUES
  (
    'seed_ad_rockwell_114_a',
    '114',
    '114',
    'AD',
    'SAMPLE-76-23-01',
    'Manufacturer: Rockwell International | Applicability model: 114 | Sample AD for Commander 114 wing spar inspection (demo seed)',
    TIMESTAMP '1976-11-01 00:00:00',
    CURRENT_TIMESTAMP
  ),
  (
    'seed_ad_rockwell_114_b',
    '114',
    '114',
    'AD',
    'SAMPLE-2004-25-16',
    'Manufacturer: Rockwell International | Applicability model: 114 | Sample AD for fuel system inspection (demo seed)',
    TIMESTAMP '2004-12-01 00:00:00',
    CURRENT_TIMESTAMP
  ),
  (
    'seed_ad_cessna_172s',
    '172S',
    '172S',
    'AD',
    'SAMPLE-2001-06-17',
    'Manufacturer: Cessna | Applicability model: 172S | Sample AD for seat rail inspection (demo seed)',
    TIMESTAMP '2001-04-01 00:00:00',
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("source", "referenceId", "partNumberNorm") DO NOTHING;
