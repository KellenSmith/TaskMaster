/*
  Warnings:

  - The values [DRAFT,PUBLISHED,CANCELLED] on the enum `EventStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,PAID,COMPLETED,CANCELLED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [BEFORE,DURING,AFTER] on the enum `TaskPhase` will be removed. If these variants are still used in the database, this will fail.
  - The values [TO_DO,IN_PROGRESS,IN_REVIEW,DONE] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [USER,ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventStatus_new" AS ENUM ('draft', 'published', 'cancelled');
ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "events" ALTER COLUMN "status" TYPE "EventStatus_new" USING ("status"::text::"EventStatus_new");
ALTER TYPE "EventStatus" RENAME TO "EventStatus_old";
ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
DROP TYPE "EventStatus_old";
ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('pending', 'paid', 'completed', 'cancelled');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskPhase_new" AS ENUM ('before', 'during', 'after');
ALTER TABLE "tasks" ALTER COLUMN "phase" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "phase" TYPE "TaskPhase_new" USING ("phase"::text::"TaskPhase_new");
ALTER TYPE "TaskPhase" RENAME TO "TaskPhase_old";
ALTER TYPE "TaskPhase_new" RENAME TO "TaskPhase";
DROP TYPE "TaskPhase_old";
ALTER TABLE "tasks" ALTER COLUMN "phase" SET DEFAULT 'before';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('toDo', 'inProgress', 'inReview', 'done');
ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'toDo';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('user', 'admin');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
COMMIT;

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "phase" SET DEFAULT 'before',
ALTER COLUMN "status" SET DEFAULT 'toDo';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
