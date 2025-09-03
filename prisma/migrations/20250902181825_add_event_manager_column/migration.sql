-- AlterEnum
ALTER TYPE "public"."EventStatus" ADD VALUE 'pending_approval';

-- AlterTable
ALTER TABLE "public"."organization_settings" ADD COLUMN     "event_manager_email" TEXT;
