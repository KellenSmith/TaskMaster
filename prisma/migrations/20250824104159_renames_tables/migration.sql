/*
  Warnings:

  - You are about to drop the `EventParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventReserve` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."EventParticipant" DROP CONSTRAINT "EventParticipant_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventParticipant" DROP CONSTRAINT "EventParticipant_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventParticipant" DROP CONSTRAINT "EventParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventReserve" DROP CONSTRAINT "EventReserve_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventReserve" DROP CONSTRAINT "EventReserve_userId_fkey";

-- DropTable
DROP TABLE "public"."EventParticipant";

-- DropTable
DROP TABLE "public"."EventReserve";

-- CreateTable
CREATE TABLE "public"."event_participants" (
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("userId","eventId")
);

-- CreateTable
CREATE TABLE "public"."event_reserves" (
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "queueingSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reserves_pkey" PRIMARY KEY ("userId","eventId")
);

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_reserves" ADD CONSTRAINT "event_reserves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_reserves" ADD CONSTRAINT "event_reserves_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
