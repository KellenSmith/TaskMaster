-- CreateTable
CREATE TABLE "public"."skill_badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "skill_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_skill_badges" (
    "userId" TEXT NOT NULL,
    "skillBadgeId" TEXT NOT NULL,

    CONSTRAINT "user_skill_badges_pkey" PRIMARY KEY ("userId","skillBadgeId")
);

-- CreateTable
CREATE TABLE "public"."task_skill_badges" (
    "taskId" TEXT NOT NULL,
    "skillBadgeId" TEXT NOT NULL,

    CONSTRAINT "task_skill_badges_pkey" PRIMARY KEY ("taskId","skillBadgeId")
);

-- AddForeignKey
ALTER TABLE "public"."user_skill_badges" ADD CONSTRAINT "user_skill_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_skill_badges" ADD CONSTRAINT "user_skill_badges_skillBadgeId_fkey" FOREIGN KEY ("skillBadgeId") REFERENCES "public"."skill_badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_skill_badges" ADD CONSTRAINT "task_skill_badges_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_skill_badges" ADD CONSTRAINT "task_skill_badges_skillBadgeId_fkey" FOREIGN KEY ("skillBadgeId") REFERENCES "public"."skill_badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
