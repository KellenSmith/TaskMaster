-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "vat_percentage" INTEGER NOT NULL DEFAULT 6;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "total_vat_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
