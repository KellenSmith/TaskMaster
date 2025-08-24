/*
  Warnings:

  - You are about to drop the `ParticipantInEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReserveInEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ParticipantInEvent" DROP CONSTRAINT "ParticipantInEvent_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ParticipantInEvent" DROP CONSTRAINT "ParticipantInEvent_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ParticipantInEvent" DROP CONSTRAINT "ParticipantInEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReserveInEvent" DROP CONSTRAINT "ReserveInEvent_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReserveInEvent" DROP CONSTRAINT "ReserveInEvent_userId_fkey";

-- DropTable
DROP TABLE "public"."ParticipantInEvent";

-- DropTable
DROP TABLE "public"."ReserveInEvent";

-- CreateTable
CREATE TABLE "public"."EventParticipant" (
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("userId","eventId")
);

-- CreateTable
CREATE TABLE "public"."EventReserve" (
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "queueingSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventReserve_pkey" PRIMARY KEY ("userId","eventId")
);

-- AddForeignKey
ALTER TABLE "public"."EventParticipant" ADD CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventParticipant" ADD CONSTRAINT "EventParticipant_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventReserve" ADD CONSTRAINT "EventReserve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventReserve" ADD CONSTRAINT "EventReserve_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
