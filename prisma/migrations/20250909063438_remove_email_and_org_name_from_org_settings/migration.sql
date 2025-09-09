/*
  Warnings:

  - You are about to drop the column `organization_email` on the `organization_settings` table. All the data in the column will be lost.
  - You are about to drop the column `organization_name` on the `organization_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."organization_settings" DROP COLUMN "organization_email",
DROP COLUMN "organization_name";
