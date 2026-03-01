-- 1) Add the new id column as nullable first
ALTER TABLE "event_participants"
ADD COLUMN "id" TEXT;

-- 2) Backfill existing rows using a deterministic value derived from the old composite key
UPDATE "event_participants"
SET "id" = json_build_array("user_id", "ticket_id")::text
WHERE "id" IS NULL;

-- 3) Make id required now that existing rows are populated
ALTER TABLE "event_participants"
ALTER COLUMN "id" SET NOT NULL;

-- 4) Replace old composite primary key with id primary key
ALTER TABLE "event_participants"
DROP CONSTRAINT "event_participants_pkey",
ADD CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id");
