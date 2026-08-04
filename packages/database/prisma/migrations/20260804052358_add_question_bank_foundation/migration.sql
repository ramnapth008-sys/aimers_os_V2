-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CORRECT', 'MULTIPLE_CORRECT', 'INTEGER', 'ASSERTION_REASON');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionSourceType" AS ENUM ('PLATFORM', 'INSTITUTION', 'CUSTOM', 'PYQ', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "QuestionPracticeSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "QuestionPracticeItemStatus" AS ENUM ('UNANSWERED', 'CORRECT', 'INCORRECT', 'SKIPPED');

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "owner_organization_id" UUID,
    "subject_id" UUID NOT NULL,
    "chapter_id" UUID,
    "topic_id" UUID,
    "code" VARCHAR(120) NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'SINGLE_CORRECT',
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "stem" TEXT NOT NULL,
    "explanation" TEXT,
    "source_type" "QuestionSourceType" NOT NULL DEFAULT 'PLATFORM',
    "source_name" VARCHAR(200),
    "source_year" INTEGER,
    "marks" INTEGER NOT NULL DEFAULT 4,
    "negative_marks" INTEGER NOT NULL DEFAULT 1,
    "estimated_seconds" INTEGER NOT NULL DEFAULT 90,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "label" VARCHAR(10) NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_tags" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "question_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_tag_assignments" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "question_tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_tag_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_bookmarks" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_practice_sessions" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" "QuestionPracticeSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "answered_questions" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "incorrect_answers" INTEGER NOT NULL DEFAULT 0,
    "skipped_questions" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "accuracy_percent" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "question_practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_practice_items" (
    "id" UUID NOT NULL,
    "question_practice_session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "status" "QuestionPracticeItemStatus" NOT NULL DEFAULT 'UNANSWERED',
    "is_correct" BOOLEAN,
    "awarded_marks" INTEGER NOT NULL DEFAULT 0,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "answered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "question_practice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test_questions" (
    "id" UUID NOT NULL,
    "mock_test_section_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "marks" INTEGER NOT NULL DEFAULT 4,
    "negative_marks" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mock_test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_test_question_responses" (
    "id" UUID NOT NULL,
    "mock_test_attempt_id" UUID NOT NULL,
    "mock_test_question_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "is_correct" BOOLEAN,
    "awarded_marks" INTEGER NOT NULL DEFAULT 0,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "is_marked_for_review" BOOLEAN NOT NULL DEFAULT false,
    "answered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mock_test_question_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_code_key" ON "questions"("code");

-- CreateIndex
CREATE INDEX "questions_subject_id_status_idx" ON "questions"("subject_id", "status");

-- CreateIndex
CREATE INDEX "questions_chapter_id_status_idx" ON "questions"("chapter_id", "status");

-- CreateIndex
CREATE INDEX "questions_topic_id_status_idx" ON "questions"("topic_id", "status");

-- CreateIndex
CREATE INDEX "questions_difficulty_status_idx" ON "questions"("difficulty", "status");

-- CreateIndex
CREATE INDEX "questions_source_type_source_year_idx" ON "questions"("source_type", "source_year");

-- CreateIndex
CREATE INDEX "questions_owner_organization_id_status_idx" ON "questions"("owner_organization_id", "status");

-- CreateIndex
CREATE INDEX "question_options_question_id_is_correct_idx" ON "question_options"("question_id", "is_correct");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_question_id_label_key" ON "question_options"("question_id", "label");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_question_id_sequence_number_key" ON "question_options"("question_id", "sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "question_tags_slug_key" ON "question_tags"("slug");

-- CreateIndex
CREATE INDEX "question_tag_assignments_question_tag_id_idx" ON "question_tag_assignments"("question_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_tag_assignments_question_id_question_tag_id_key" ON "question_tag_assignments"("question_id", "question_tag_id");

-- CreateIndex
CREATE INDEX "question_bookmarks_question_id_idx" ON "question_bookmarks"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_bookmarks_student_profile_id_question_id_key" ON "question_bookmarks"("student_profile_id", "question_id");

-- CreateIndex
CREATE INDEX "question_practice_sessions_student_profile_id_status_starte_idx" ON "question_practice_sessions"("student_profile_id", "status", "started_at");

-- CreateIndex
CREATE INDEX "question_practice_sessions_completed_at_idx" ON "question_practice_sessions"("completed_at");

-- CreateIndex
CREATE INDEX "question_practice_items_question_id_status_idx" ON "question_practice_items"("question_id", "status");

-- CreateIndex
CREATE INDEX "question_practice_items_selected_option_id_idx" ON "question_practice_items"("selected_option_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_practice_items_question_practice_session_id_questi_key" ON "question_practice_items"("question_practice_session_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_practice_items_question_practice_session_id_sequen_key" ON "question_practice_items"("question_practice_session_id", "sequence_number");

-- CreateIndex
CREATE INDEX "mock_test_questions_question_id_idx" ON "mock_test_questions"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_questions_mock_test_section_id_question_id_key" ON "mock_test_questions"("mock_test_section_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_questions_mock_test_section_id_sequence_number_key" ON "mock_test_questions"("mock_test_section_id", "sequence_number");

-- CreateIndex
CREATE INDEX "mock_test_question_responses_mock_test_question_id_idx" ON "mock_test_question_responses"("mock_test_question_id");

-- CreateIndex
CREATE INDEX "mock_test_question_responses_selected_option_id_idx" ON "mock_test_question_responses"("selected_option_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_test_question_responses_mock_test_attempt_id_mock_test_key" ON "mock_test_question_responses"("mock_test_attempt_id", "mock_test_question_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_owner_organization_id_fkey" FOREIGN KEY ("owner_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tag_assignments" ADD CONSTRAINT "question_tag_assignments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tag_assignments" ADD CONSTRAINT "question_tag_assignments_question_tag_id_fkey" FOREIGN KEY ("question_tag_id") REFERENCES "question_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bookmarks" ADD CONSTRAINT "question_bookmarks_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bookmarks" ADD CONSTRAINT "question_bookmarks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_practice_sessions" ADD CONSTRAINT "question_practice_sessions_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_practice_items" ADD CONSTRAINT "question_practice_items_question_practice_session_id_fkey" FOREIGN KEY ("question_practice_session_id") REFERENCES "question_practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_practice_items" ADD CONSTRAINT "question_practice_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_practice_items" ADD CONSTRAINT "question_practice_items_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_questions" ADD CONSTRAINT "mock_test_questions_mock_test_section_id_fkey" FOREIGN KEY ("mock_test_section_id") REFERENCES "mock_test_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_questions" ADD CONSTRAINT "mock_test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_question_responses" ADD CONSTRAINT "mock_test_question_responses_mock_test_attempt_id_fkey" FOREIGN KEY ("mock_test_attempt_id") REFERENCES "mock_test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_question_responses" ADD CONSTRAINT "mock_test_question_responses_mock_test_question_id_fkey" FOREIGN KEY ("mock_test_question_id") REFERENCES "mock_test_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_test_question_responses" ADD CONSTRAINT "mock_test_question_responses_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
