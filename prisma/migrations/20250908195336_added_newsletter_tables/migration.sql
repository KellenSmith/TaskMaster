-- CreateEnum
CREATE TYPE "public"."NewsletterJobStatus" AS ENUM ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "public"."newsletter_jobs" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT,
    "recipients" JSONB NOT NULL,
    "cursor" INTEGER NOT NULL DEFAULT 0,
    "batchSize" INTEGER NOT NULL DEFAULT 250,
    "perRecipient" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."NewsletterJobStatus" NOT NULL DEFAULT 'pending',
    "lastRunAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_jobs_pkey" PRIMARY KEY ("id")
);
