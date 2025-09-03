-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
