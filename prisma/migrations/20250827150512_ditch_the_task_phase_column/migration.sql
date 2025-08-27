/*
  Warnings:

  - You are about to drop the column `phase` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."tasks" DROP COLUMN "phase";

-- DropEnum
DROP TYPE "public"."TaskPhase";
