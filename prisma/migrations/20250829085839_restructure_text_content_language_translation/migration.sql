/*
  Warnings:

  - You are about to drop the column `content` on the `text_contents` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `text_contents` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Language" AS ENUM ('english', 'swedish');

-- DropIndex
DROP INDEX "public"."text_contents_id_language_key";

-- AlterTable
ALTER TABLE "public"."text_contents" DROP COLUMN "content",
DROP COLUMN "language";

-- CreateTable
CREATE TABLE "public"."text_translations" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" "public"."Language" NOT NULL,
    "text_content_id" TEXT NOT NULL,

    CONSTRAINT "text_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "text_translations_language_text_content_id_key" ON "public"."text_translations"("language", "text_content_id");

-- AddForeignKey
ALTER TABLE "public"."text_translations" ADD CONSTRAINT "text_translations_text_content_id_fkey" FOREIGN KEY ("text_content_id") REFERENCES "public"."text_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
