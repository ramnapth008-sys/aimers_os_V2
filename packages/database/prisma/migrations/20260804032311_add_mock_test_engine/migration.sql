-- CreateEnum
CREATE TYPE "MockTestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MockTestSourceType" AS ENUM ('PLATFORM', 'INSTITUTION', 'CUSTOM', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "MockTestScope" AS ENUM ('FULL_LENGTH', 'SUBJECT', 'CHAPTER', 'TOPIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MockTestAttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED', 'ABANDONED');

-- CreateTable
CREATE TABLE "mock_tests" (
    "id" UUID NOT NULL,
    "owner_organization_id" UUID,
    "syllabus_version_id" UUID,
    "code" VARCHAR(100),
    "title" VARCHAR(250) NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "source_type" "MockTestSourceType" NOT NULL DEFAULT 'PLATFORM',
    "scope" "MockTestScope" NOT NULL DEFAULT 'FULL_LENGTH',
    "status" "MockTestStatus" NOT NULL DEFAULT 'DRAFT',
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "total_marks" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER NOT NULL DEFAULT 180,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mock_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test_sections" (
    "id" UUID NOT NULL,
    "mock_test_id" UUID NOT NULL,
    "subject_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "total_marks" INTEGER NOT NULL DEFAULT 0,
    "marks_per_correct" INTEGER NOT NULL DEFAULT 4,
    "negative_marks_per_wrong" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mock_test_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test_topic_blueprints" (
    "id" UUID NOT NULL,
    "mock_test_section_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "planned_questions" INTEGER NOT NULL DEFAULT 0,
    "weightage_percent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mock_test_topic_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test_attempts" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "mock_test_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" "MockTestAttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "evaluated_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "attempted_questions" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "incorrect_answers" INTEGER NOT NULL DEFAULT 0,
    "unanswered_questions" INTEGER NOT NULL DEFAULT 0,
    "raw_score" INTEGER NOT NULL DEFAULT 0,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "accuracy_percent" INTEGER NOT NULL DEFAULT 0,
    "percentile" INTEGER,
    "rank" INTEGER,
    "rank_out_of" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mock_test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test_section_results" (
    "id" UUID NOT NULL,
    "mock_test_attempt_id" UUID NOT NULL,
    "mock_test_section_id" UUID NOT NULL,
    "attempted_questions" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "incorrect_answers" INTEGER NOT NULL DEFAULT 0,
    "unanswered_questions" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "max_score" INTEGER NOT NULL DEFAULT 0,
    "accuracy_percent" INTEGER NOT NULL DEFAULT 0,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mock_test_section_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test_topic_results" (
    "id" UUID NOT NULL,
    "mock_test_attempt_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "attempted_questions" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "incorrect_answers" INTEGER NOT NULL DEFAULT 0,
    "unanswered_questions" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "accuracy_percent" INTEGER NOT NULL DEFAULT 0,
    "is_weak" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mock_test_topic_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mock_tests_syllabus_version_id_status_idx" ON "mock_tests"("syllabus_version_id", "status");

-- CreateIndex
CREATE INDEX "mock_tests_owner_organization_id_status_idx" ON "mock_tests"("owner_organization_id", "status");

-- CreateIndex
CREATE INDEX "mock_tests_scope_status_idx" ON "mock_tests"("scope", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mock_tests_owner_organization_id_code_key" ON "mock_tests"("owner_organization_id", "code");

-- CreateIndex
CREATE INDEX "mock_test_sections_mock_test_id_idx" ON "mock_test_sections"("mock_test_id");

-- CreateIndex
CREATE INDEX "mock_test_sections_subject_id_idx" ON "mock_test_sections"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_sections_mock_test_id_sequence_number_key" ON "mock_test_sections"("mock_test_id", "sequence_number");

-- CreateIndex
CREATE INDEX "mock_test_topic_blueprints_topic_id_idx" ON "mock_test_topic_blueprints"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_topic_blueprints_mock_test_section_id_topic_id_key" ON "mock_test_topic_blueprints"("mock_test_section_id", "topic_id");

-- CreateIndex
CREATE INDEX "mock_test_attempts_student_profile_id_status_submitted_at_idx" ON "mock_test_attempts"("student_profile_id", "status", "submitted_at");

-- CreateIndex
CREATE INDEX "mock_test_attempts_mock_test_id_status_idx" ON "mock_test_attempts"("mock_test_id", "status");

-- CreateIndex
CREATE INDEX "mock_test_attempts_evaluated_at_idx" ON "mock_test_attempts"("evaluated_at");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_attempts_student_profile_id_mock_test_id_attempt__key" ON "mock_test_attempts"("student_profile_id", "mock_test_id", "attempt_number");

-- CreateIndex
CREATE INDEX "mock_test_section_results_mock_test_section_id_idx" ON "mock_test_section_results"("mock_test_section_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_section_results_mock_test_attempt_id_mock_test_se_key" ON "mock_test_section_results"("mock_test_attempt_id", "mock_test_section_id");

-- CreateIndex
CREATE INDEX "mock_test_topic_results_topic_id_is_weak_idx" ON "mock_test_topic_results"("topic_id", "is_weak");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_topic_results_mock_test_attempt_id_topic_id_key" ON "mock_test_topic_results"("mock_test_attempt_id", "topic_id");

-- AddForeignKey
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_owner_organization_id_fkey" FOREIGN KEY ("owner_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_syllabus_version_id_fkey" FOREIGN KEY ("syllabus_version_id") REFERENCES "syllabus_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_sections" ADD CONSTRAINT "mock_test_sections_mock_test_id_fkey" FOREIGN KEY ("mock_test_id") REFERENCES "mock_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_sections" ADD CONSTRAINT "mock_test_sections_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_topic_blueprints" ADD CONSTRAINT "mock_test_topic_blueprints_mock_test_section_id_fkey" FOREIGN KEY ("mock_test_section_id") REFERENCES "mock_test_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_topic_blueprints" ADD CONSTRAINT "mock_test_topic_blueprints_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_attempts" ADD CONSTRAINT "mock_test_attempts_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_attempts" ADD CONSTRAINT "mock_test_attempts_mock_test_id_fkey" FOREIGN KEY ("mock_test_id") REFERENCES "mock_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_section_results" ADD CONSTRAINT "mock_test_section_results_mock_test_attempt_id_fkey" FOREIGN KEY ("mock_test_attempt_id") REFERENCES "mock_test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_section_results" ADD CONSTRAINT "mock_test_section_results_mock_test_section_id_fkey" FOREIGN KEY ("mock_test_section_id") REFERENCES "mock_test_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_topic_results" ADD CONSTRAINT "mock_test_topic_results_mock_test_attempt_id_fkey" FOREIGN KEY ("mock_test_attempt_id") REFERENCES "mock_test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_topic_results" ADD CONSTRAINT "mock_test_topic_results_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
