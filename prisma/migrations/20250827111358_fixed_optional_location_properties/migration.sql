/*
  Warnings:

  - You are about to drop the column `location` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."events" DROP COLUMN "location",
ADD COLUMN     "locationId" TEXT;

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "rentalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "accessibilityInfo" TEXT,
    "description" TEXT,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
