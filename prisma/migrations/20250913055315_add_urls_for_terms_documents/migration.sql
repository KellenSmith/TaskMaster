-- AlterTable
ALTER TABLE "public"."organization_settings" ADD COLUMN     "privacy_policy_english_url" TEXT,
ADD COLUMN     "privacy_policy_swedish_url" TEXT,
ADD COLUMN     "terms_of_membership_english_url" TEXT,
ADD COLUMN     "terms_of_membership_swedish_url" TEXT,
ADD COLUMN     "terms_of_purchase_english_url" TEXT,
ADD COLUMN     "terms_of_purchase_swedish_url" TEXT;
