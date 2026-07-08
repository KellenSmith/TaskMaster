/*
  Warnings:

  - You are about to drop the column `ticket_instructions` on the `organization_settings` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'payment_confirmed';

-- AlterTable
ALTER TABLE "organization_settings" DROP COLUMN "ticket_instructions",
ADD COLUMN     "payment_instructions" TEXT;
