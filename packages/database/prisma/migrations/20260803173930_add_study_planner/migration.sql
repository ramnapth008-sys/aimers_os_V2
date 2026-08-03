-- CreateEnum
CREATE TYPE "StudyPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StudyTaskType" AS ENUM ('STUDY', 'REVISION', 'PRACTICE', 'LECTURE', 'MOCK_TEST', 'OTHER');

-- CreateEnum
CREATE TYPE "StudyTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StudyTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "StudySessionStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "study_plans" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "StudyPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_tasks" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "study_plan_id" UUID,
    "subject_id" UUID,
    "chapter_id" UUID,
    "topic_id" UUID,
    "title" VARCHAR(250) NOT NULL,
    "description" TEXT,
    "type" "StudyTaskType" NOT NULL DEFAULT 'STUDY',
    "status" "StudyTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "StudyTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "scheduled_for" TIMESTAMPTZ(6),
    "due_at" TIMESTAMPTZ(6),
    "estimated_minutes" INTEGER NOT NULL DEFAULT 30,
    "actual_minutes" INTEGER NOT NULL DEFAULT 0,
    "completion_percent" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ(6),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "study_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "study_task_id" UUID,
    "chapter_id" UUID,
    "topic_id" UUID,
    "status" "StudySessionStatus" NOT NULL DEFAULT 'PLANNED',
    "planned_start_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "planned_minutes" INTEGER NOT NULL DEFAULT 30,
    "duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "focus_minutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_plans_student_profile_id_status_idx" ON "study_plans"("student_profile_id", "status");

-- CreateIndex
CREATE INDEX "study_plans_start_date_end_date_idx" ON "study_plans"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "study_tasks_student_profile_id_status_scheduled_for_idx" ON "study_tasks"("student_profile_id", "status", "scheduled_for");

-- CreateIndex
CREATE INDEX "study_tasks_student_profile_id_due_at_idx" ON "study_tasks"("student_profile_id", "due_at");

-- CreateIndex
CREATE INDEX "study_tasks_study_plan_id_sort_order_idx" ON "study_tasks"("study_plan_id", "sort_order");

-- CreateIndex
CREATE INDEX "study_tasks_subject_id_idx" ON "study_tasks"("subject_id");

-- CreateIndex
CREATE INDEX "study_tasks_chapter_id_idx" ON "study_tasks"("chapter_id");

-- CreateIndex
CREATE INDEX "study_tasks_topic_id_idx" ON "study_tasks"("topic_id");

-- CreateIndex
CREATE INDEX "study_sessions_student_profile_id_status_planned_start_at_idx" ON "study_sessions"("student_profile_id", "status", "planned_start_at");

-- CreateIndex
CREATE INDEX "study_sessions_student_profile_id_started_at_idx" ON "study_sessions"("student_profile_id", "started_at");

-- CreateIndex
CREATE INDEX "study_sessions_study_task_id_idx" ON "study_sessions"("study_task_id");

-- CreateIndex
CREATE INDEX "study_sessions_chapter_id_idx" ON "study_sessions"("chapter_id");

-- CreateIndex
CREATE INDEX "study_sessions_topic_id_idx" ON "study_sessions"("topic_id");

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_study_task_id_fkey" FOREIGN KEY ("study_task_id") REFERENCES "study_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
