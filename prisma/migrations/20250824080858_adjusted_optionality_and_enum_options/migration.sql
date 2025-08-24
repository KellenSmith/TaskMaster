/*
  Warnings:

  - The values [earlyBird] on the enum `TicketType` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `maxParticipants` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startTime` on table `tasks` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endTime` on table `tasks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TicketType_new" AS ENUM ('volunteer', 'standard');
ALTER TABLE "public"."tickets" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "public"."tickets" ALTER COLUMN "type" TYPE "public"."TicketType_new" USING ("type"::text::"public"."TicketType_new");
ALTER TYPE "public"."TicketType" RENAME TO "TicketType_old";
ALTER TYPE "public"."TicketType_new" RENAME TO "TicketType";
DROP TYPE "public"."TicketType_old";
ALTER TABLE "public"."tickets" ALTER COLUMN "type" SET DEFAULT 'standard';
COMMIT;

-- AlterTable
ALTER TABLE "public"."events" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "description" DROP DEFAULT,
ALTER COLUMN "maxParticipants" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."products" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "description" DROP DEFAULT,
ALTER COLUMN "stock" DROP DEFAULT,
ALTER COLUMN "imageUrl" DROP NOT NULL,
ALTER COLUMN "imageUrl" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."tasks" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "startTime" SET NOT NULL,
ALTER COLUMN "endTime" SET NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "description" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "firstName" DROP DEFAULT,
ALTER COLUMN "surName" DROP NOT NULL,
ALTER COLUMN "surName" DROP DEFAULT,
ALTER COLUMN "phone" DROP DEFAULT;
