-- AlterTable
ALTER TABLE "events" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'to do';
