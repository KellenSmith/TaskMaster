/*
  Warnings:

  - The `recipients` column on the `newsletter_jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."newsletter_jobs" DROP COLUMN "recipients",
ADD COLUMN     "recipients" TEXT[];
