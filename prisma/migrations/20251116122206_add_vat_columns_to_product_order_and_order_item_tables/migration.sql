-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "vat_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "total_vat_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "vat_percentage" INTEGER NOT NULL DEFAULT 6;

-- Data migration for VAT columns
-- Step 1: Update vat_percentage for products with memberships to 0
UPDATE "public"."products"
SET "vat_percentage" = 0
WHERE "id" IN (
    SELECT "product_id"
    FROM "public"."memberships"
);

-- Step 2: Calculate and update vat_amount for order items
-- Formula: vat_amount = (price * vat_percentage / 100)
UPDATE "public"."order_items" oi
SET "vat_amount" = ROUND(CAST(oi.price * p.vat_percentage / 100.0 AS numeric), 2)
FROM "public"."products" p
WHERE oi.product_id = p.id;

-- Step 3: Calculate and update total_vat_amount for orders
-- Sum up the vat_amount * quantity for all items in each order
UPDATE "public"."orders" o
SET "total_vat_amount" = COALESCE(
    (
        SELECT ROUND(CAST(SUM(oi.vat_amount * oi.quantity) AS numeric), 2)
        FROM "public"."order_items" oi
        WHERE oi.order_id = o.id
    ),
    0.0
);
