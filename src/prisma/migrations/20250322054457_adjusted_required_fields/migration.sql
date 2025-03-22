-- AlterTable
ALTER TABLE "events" ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "description" SET DEFAULT '',
ALTER COLUMN "endTime" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone" SET DEFAULT '',
ALTER COLUMN "pronoun" SET DEFAULT '';
