-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('draft', 'published', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('toDo', 'inProgress', 'inReview', 'done');

-- CreateEnum
CREATE TYPE "public"."TaskPhase" AS ENUM ('before', 'during', 'after');

-- CreateEnum
CREATE TYPE "public"."TicketType" AS ENUM ('volunteer', 'standard');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('pending', 'paid', 'shipped', 'completed', 'cancelled', 'error');

-- CreateTable
CREATE TABLE "public"."organization_settings" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL DEFAULT 'Task Master',
    "organizationEmail" TEXT NOT NULL DEFAULT 'kellensmith407@gmail.com',
    "remindMembershipExpiresInDays" INTEGER NOT NULL DEFAULT 7,
    "purgeMembersAfterDaysUnvalidated" INTEGER NOT NULL DEFAULT 180,
    "memberApplicationPrompt" TEXT,
    "defaultTaskShiftLength" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'member',
    "consentToNewsletters" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT,
    "surName" TEXT,
    "pronoun" TEXT DEFAULT 'they/them',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_credentials" (
    "id" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "maxParticipants" INTEGER NOT NULL,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'draft',
    "hostId" TEXT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_participants" (
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("userId","ticketId")
);

-- CreateTable
CREATE TABLE "public"."event_reserves" (
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "queueingSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reserves_pkey" PRIMARY KEY ("userId","eventId")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" TEXT NOT NULL,
    "phase" "public"."TaskPhase" NOT NULL DEFAULT 'before',
    "name" TEXT NOT NULL,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'toDo',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assigneeId" TEXT,
    "reviewerId" TEXT,
    "eventId" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" INTEGER,
    "unlimitedStock" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."memberships" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 365,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tickets" (
    "id" TEXT NOT NULL,
    "type" "public"."TicketType" NOT NULL DEFAULT 'standard',
    "productId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'pending',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "paymentRequestId" TEXT,
    "payeeRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."text_contents" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT DEFAULT 'organization',

    CONSTRAINT "text_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organizationName_key" ON "public"."organization_settings"("organizationName");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "public"."users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_userId_key" ON "public"."user_credentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_productId_key" ON "public"."memberships"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "user_memberships_userId_key" ON "public"."user_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_productId_key" ON "public"."tickets"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_paymentRequestId_key" ON "public"."orders"("paymentRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_payeeRef_key" ON "public"."orders"("payeeRef");

-- CreateIndex
CREATE UNIQUE INDEX "text_contents_id_language_key" ON "public"."text_contents"("id", "language");

-- AddForeignKey
ALTER TABLE "public"."user_credentials" ADD CONSTRAINT "user_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_reserves" ADD CONSTRAINT "event_reserves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_reserves" ADD CONSTRAINT "event_reserves_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_memberships" ADD CONSTRAINT "user_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_memberships" ADD CONSTRAINT "user_memberships_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
