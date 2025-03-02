/*
  Warnings:

  - You are about to drop the column `endTIme` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `endTime` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "endTIme",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL;
