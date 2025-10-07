-- DropForeignKey
ALTER TABLE "public"."event_participants" DROP CONSTRAINT "event_participants_order_id_fkey";

-- AlterTable
ALTER TABLE "public"."event_participants" ALTER COLUMN "order_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
