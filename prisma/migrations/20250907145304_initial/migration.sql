-- CreateEnum
CREATE TYPE "public"."Language" AS ENUM ('swedish', 'english');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('pending', 'validated');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('draft', 'pending_approval', 'published', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('toDo', 'inProgress', 'inReview', 'done');

-- CreateEnum
CREATE TYPE "public"."TicketType" AS ENUM ('volunteer', 'standard');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('pending', 'paid', 'shipped', 'completed', 'cancelled', 'error');

-- CreateTable
CREATE TABLE "public"."organization_settings" (
    "id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL DEFAULT 'Task Master',
    "organization_email" TEXT NOT NULL DEFAULT 'kellensmith407@gmail.com',
    "logo_url" TEXT,
    "remind_membership_expires_in_days" INTEGER NOT NULL DEFAULT 7,
    "purge_members_after_days_unvalidated" INTEGER NOT NULL DEFAULT 180,
    "default_task_shift_length" INTEGER NOT NULL DEFAULT 2,
    "member_application_prompt" TEXT,
    "ticket_instructions" TEXT,
    "event_manager_email" TEXT,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."text_contents" (
    "id" TEXT NOT NULL,
    "category" TEXT DEFAULT 'organization',

    CONSTRAINT "text_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."text_translations" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" "public"."Language" NOT NULL,
    "text_content_id" TEXT NOT NULL,

    CONSTRAINT "text_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'pending',
    "role" "public"."UserRole" NOT NULL DEFAULT 'member',
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "first_name" TEXT,
    "sur_name" TEXT,
    "pronoun" TEXT DEFAULT 'they/them',
    "phone" TEXT,
    "consent_to_newsletters" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "rental_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "accessibility_info" TEXT,
    "description" TEXT,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "location_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "max_participants" INTEGER NOT NULL,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'draft',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "host_id" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_participants" (
    "user_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("user_id","ticket_id")
);

-- CreateTable
CREATE TABLE "public"."event_reserves" (
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "queueing_since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reserves_pkey" PRIMARY KEY ("user_id","event_id")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'toDo',
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignee_id" TEXT,
    "reviewer_id" TEXT,
    "event_id" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skill_badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,

    CONSTRAINT "skill_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_skill_badges" (
    "user_id" TEXT NOT NULL,
    "skill_badge_id" TEXT NOT NULL,

    CONSTRAINT "user_skill_badges_pkey" PRIMARY KEY ("user_id","skill_badge_id")
);

-- CreateTable
CREATE TABLE "public"."task_skill_badges" (
    "task_id" TEXT NOT NULL,
    "skill_badge_id" TEXT NOT NULL,

    CONSTRAINT "task_skill_badges_pkey" PRIMARY KEY ("task_id","skill_badge_id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" INTEGER,
    "unlimited_stock" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."memberships" (
    "product_id" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 365,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "public"."user_memberships" (
    "user_id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("user_id","membership_id")
);

-- CreateTable
CREATE TABLE "public"."tickets" (
    "product_id" TEXT NOT NULL,
    "type" "public"."TicketType" NOT NULL DEFAULT 'standard',
    "event_id" TEXT NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'pending',
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "payment_request_id" TEXT,
    "payee_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_id","product_id")
);

-- CreateTable
CREATE TABLE "public"."verification_token" (
    "identifier" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" BIGINT,
    "id_token" TEXT,
    "scope" TEXT,
    "session_state" TEXT,
    "token_type" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "sessionToken" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "text_translations_language_text_content_id_key" ON "public"."text_translations"("language", "text_content_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "public"."users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "user_memberships_user_id_key" ON "public"."user_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_payment_request_id_key" ON "public"."orders"("payment_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_payee_ref_key" ON "public"."orders"("payee_ref");

-- AddForeignKey
ALTER TABLE "public"."text_translations" ADD CONSTRAINT "text_translations_text_content_id_fkey" FOREIGN KEY ("text_content_id") REFERENCES "public"."text_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_reserves" ADD CONSTRAINT "event_reserves_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_reserves" ADD CONSTRAINT "event_reserves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_skill_badges" ADD CONSTRAINT "user_skill_badges_skill_badge_id_fkey" FOREIGN KEY ("skill_badge_id") REFERENCES "public"."skill_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_skill_badges" ADD CONSTRAINT "user_skill_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_skill_badges" ADD CONSTRAINT "task_skill_badges_skill_badge_id_fkey" FOREIGN KEY ("skill_badge_id") REFERENCES "public"."skill_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_skill_badges" ADD CONSTRAINT "task_skill_badges_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_memberships" ADD CONSTRAINT "user_memberships_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_memberships" ADD CONSTRAINT "user_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
