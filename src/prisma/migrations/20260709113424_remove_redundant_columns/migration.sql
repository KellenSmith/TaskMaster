/*
  Warnings:

  - You are about to drop the column `payeeRef` on the `user_memberships` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_token` on the `user_memberships` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_memberships_payeeRef_key";

-- AlterTable
ALTER TABLE "user_memberships" DROP COLUMN "payeeRef",
DROP COLUMN "subscription_token";
