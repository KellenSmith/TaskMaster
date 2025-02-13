/*
  Warnings:

  - You are about to drop the column `status` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[passwordSalt]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passwordSalt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "status",
ADD COLUMN     "hashedPassword" TEXT,
ADD COLUMN     "passwordSalt" TEXT NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'user',
ALTER COLUMN "membershipRenewedAt" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordSalt_key" ON "users"("passwordSalt");
