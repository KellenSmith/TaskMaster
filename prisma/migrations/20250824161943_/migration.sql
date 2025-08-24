/*
  Warnings:

  - The primary key for the `event_participants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `eventId` on the `event_participants` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."event_participants" DROP CONSTRAINT "event_participants_eventId_fkey";

-- AlterTable
ALTER TABLE "public"."event_participants" DROP CONSTRAINT "event_participants_pkey",
DROP COLUMN "eventId",
ADD CONSTRAINT "event_participants_pkey" PRIMARY KEY ("userId", "ticketId");
