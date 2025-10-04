/*
  Warnings:

  - A unique constraint covering the columns `[payeeRef]` on the table `user_memberships` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."user_memberships" ADD COLUMN     "payeeRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_memberships_payeeRef_key" ON "public"."user_memberships"("payeeRef");
