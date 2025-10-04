-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "status" "public"."OrderStatus" NOT NULL DEFAULT 'pending';
