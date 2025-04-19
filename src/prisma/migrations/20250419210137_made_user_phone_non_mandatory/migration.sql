-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone" DROP DEFAULT;
