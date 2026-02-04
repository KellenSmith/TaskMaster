/*
  Warnings:

  - You are about to drop the column `unlimited_stock` on the `products` table. All the data in the column will be lost.

*/
-- Data migration
UPDATE "products"
SET "stock" = NULL
WHERE "unlimited_stock" = TRUE;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "unlimited_stock";
