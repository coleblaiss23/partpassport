-- Component genealogy / life-limited tracking on serialized parts
ALTER TABLE "Part" ADD COLUMN "isLifeLimited" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Part" ADD COLUMN "totalTimeHours" DOUBLE PRECISION;
ALTER TABLE "Part" ADD COLUMN "totalCycles" INTEGER;
ALTER TABLE "Part" ADD COLUMN "lifeLimitHours" DOUBLE PRECISION;
ALTER TABLE "Part" ADD COLUMN "lifeLimitCycles" INTEGER;
