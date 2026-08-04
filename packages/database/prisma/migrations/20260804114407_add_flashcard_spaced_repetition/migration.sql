-- CreateEnum
CREATE TYPE "FlashcardDeckStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FlashcardStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FlashcardSourceType" AS ENUM ('MANUAL', 'QUESTION_BANK', 'MOCK_TEST', 'PLATFORM');

-- CreateEnum
CREATE TYPE "FlashcardLearningState" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING', 'MASTERED');

-- CreateEnum
CREATE TYPE "FlashcardReviewRating" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

-- CreateEnum
CREATE TYPE "FlashcardReviewSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "flashcard_decks" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "subject_id" UUID,
    "chapter_id" UUID,
    "topic_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(30),
    "status" "FlashcardDeckStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" UUID NOT NULL,
    "deck_id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "chapter_id" UUID,
    "topic_id" UUID,
    "source_question_id" UUID,
    "source_type" "FlashcardSourceType" NOT NULL DEFAULT 'MANUAL',
    "status" "FlashcardStatus" NOT NULL DEFAULT 'ACTIVE',
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "hint" TEXT,
    "mnemonic" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_schedules" (
    "id" UUID NOT NULL,
    "flashcard_id" UUID NOT NULL,
    "state" "FlashcardLearningState" NOT NULL DEFAULT 'NEW',
    "due_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interval_days" INTEGER NOT NULL DEFAULT 0,
    "schedule_step" INTEGER NOT NULL DEFAULT 0,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lapse_count" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "flashcard_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_review_sessions" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "deck_id" UUID,
    "status" "FlashcardReviewSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "total_cards" INTEGER NOT NULL DEFAULT 0,
    "reviewed_cards" INTEGER NOT NULL DEFAULT 0,
    "again_count" INTEGER NOT NULL DEFAULT 0,
    "hard_count" INTEGER NOT NULL DEFAULT 0,
    "good_count" INTEGER NOT NULL DEFAULT 0,
    "easy_count" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "flashcard_review_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_reviews" (
    "id" UUID NOT NULL,
    "review_session_id" UUID NOT NULL,
    "flashcard_id" UUID NOT NULL,
    "rating" "FlashcardReviewRating" NOT NULL,
    "previous_state" "FlashcardLearningState" NOT NULL,
    "new_state" "FlashcardLearningState" NOT NULL,
    "previous_interval_days" INTEGER NOT NULL DEFAULT 0,
    "new_interval_days" INTEGER NOT NULL DEFAULT 0,
    "response_seconds" INTEGER NOT NULL DEFAULT 0,
    "reviewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flashcard_decks_student_profile_id_status_idx" ON "flashcard_decks"("student_profile_id", "status");

-- CreateIndex
CREATE INDEX "flashcard_decks_subject_id_idx" ON "flashcard_decks"("subject_id");

-- CreateIndex
CREATE INDEX "flashcard_decks_chapter_id_idx" ON "flashcard_decks"("chapter_id");

-- CreateIndex
CREATE INDEX "flashcard_decks_topic_id_idx" ON "flashcard_decks"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_decks_student_profile_id_name_key" ON "flashcard_decks"("student_profile_id", "name");

-- CreateIndex
CREATE INDEX "flashcards_student_profile_id_status_idx" ON "flashcards"("student_profile_id", "status");

-- CreateIndex
CREATE INDEX "flashcards_deck_id_status_idx" ON "flashcards"("deck_id", "status");

-- CreateIndex
CREATE INDEX "flashcards_subject_id_idx" ON "flashcards"("subject_id");

-- CreateIndex
CREATE INDEX "flashcards_chapter_id_idx" ON "flashcards"("chapter_id");

-- CreateIndex
CREATE INDEX "flashcards_topic_id_idx" ON "flashcards"("topic_id");

-- CreateIndex
CREATE INDEX "flashcards_source_question_id_idx" ON "flashcards"("source_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "flashcards_deck_id_source_question_id_key" ON "flashcards"("deck_id", "source_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_schedules_flashcard_id_key" ON "flashcard_schedules"("flashcard_id");

-- CreateIndex
CREATE INDEX "flashcard_schedules_state_due_at_idx" ON "flashcard_schedules"("state", "due_at");

-- CreateIndex
CREATE INDEX "flashcard_schedules_due_at_idx" ON "flashcard_schedules"("due_at");

-- CreateIndex
CREATE INDEX "flashcard_review_sessions_student_profile_id_status_started_idx" ON "flashcard_review_sessions"("student_profile_id", "status", "started_at");

-- CreateIndex
CREATE INDEX "flashcard_review_sessions_deck_id_status_idx" ON "flashcard_review_sessions"("deck_id", "status");

-- CreateIndex
CREATE INDEX "flashcard_reviews_review_session_id_reviewed_at_idx" ON "flashcard_reviews"("review_session_id", "reviewed_at");

-- CreateIndex
CREATE INDEX "flashcard_reviews_flashcard_id_reviewed_at_idx" ON "flashcard_reviews"("flashcard_id", "reviewed_at");

-- CreateIndex
CREATE INDEX "flashcard_reviews_rating_reviewed_at_idx" ON "flashcard_reviews"("rating", "reviewed_at");

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_source_question_id_fkey" FOREIGN KEY ("source_question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_schedules" ADD CONSTRAINT "flashcard_schedules_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_review_sessions" ADD CONSTRAINT "flashcard_review_sessions_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_review_sessions" ADD CONSTRAINT "flashcard_review_sessions_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_review_session_id_fkey" FOREIGN KEY ("review_session_id") REFERENCES "flashcard_review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
