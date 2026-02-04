/*
  Warnings:

  - A unique constraint covering the columns `[title_info_page_id]` on the table `text_contents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[content_info_page_id]` on the table `text_contents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."text_contents" ADD COLUMN     "content_info_page_id" TEXT,
ADD COLUMN     "title_info_page_id" TEXT;

-- CreateTable
CREATE TABLE "public"."info_pages" (
    "id" TEXT NOT NULL,
    "lowest_allowed_user_role" "public"."UserRole" DEFAULT 'admin',

    CONSTRAINT "info_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "text_contents_title_info_page_id_key" ON "public"."text_contents"("title_info_page_id");

-- CreateIndex
CREATE UNIQUE INDEX "text_contents_content_info_page_id_key" ON "public"."text_contents"("content_info_page_id");

-- AddForeignKey
ALTER TABLE "public"."text_contents" ADD CONSTRAINT "text_contents_title_info_page_id_fkey" FOREIGN KEY ("title_info_page_id") REFERENCES "public"."info_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."text_contents" ADD CONSTRAINT "text_contents_content_info_page_id_fkey" FOREIGN KEY ("content_info_page_id") REFERENCES "public"."info_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
