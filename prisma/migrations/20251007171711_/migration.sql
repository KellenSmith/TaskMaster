/*
  Warnings:

  - You are about to drop the column `userMembershipUser_id` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "userMembershipUser_id";
