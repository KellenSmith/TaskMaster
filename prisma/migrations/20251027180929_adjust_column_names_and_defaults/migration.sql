/*
  Warnings:

  - You are about to drop the column `vat_percentage` on the `order_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."order_items" DROP COLUMN "vat_percentage",
ADD COLUMN     "vat_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
