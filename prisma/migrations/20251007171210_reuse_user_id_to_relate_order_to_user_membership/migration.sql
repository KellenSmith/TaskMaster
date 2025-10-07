-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_userMembershipUser_id_userMembershipMembership_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_userMembershipMembership_id_fkey" FOREIGN KEY ("user_id", "userMembershipMembership_id") REFERENCES "public"."user_memberships"("user_id", "membership_id") ON DELETE SET NULL ON UPDATE CASCADE;
