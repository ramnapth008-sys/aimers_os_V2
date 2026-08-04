/*
  Warnings:

  - A unique constraint covering the columns `[review_session_id,flashcard_id]` on the table `flashcard_reviews` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "flashcard_review_session_items" (
    "id" UUID NOT NULL,
    "review_session_id" UUID NOT NULL,
    "flashcard_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "flashcard_review_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flashcard_review_session_items_flashcard_id_idx" ON "flashcard_review_session_items"("flashcard_id");

-- CreateIndex
CREATE INDEX "flashcard_review_session_items_review_session_id_reviewed_a_idx" ON "flashcard_review_session_items"("review_session_id", "reviewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_review_session_items_review_session_id_flashcard__key" ON "flashcard_review_session_items"("review_session_id", "flashcard_id");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_review_session_items_review_session_id_sequence_n_key" ON "flashcard_review_session_items"("review_session_id", "sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_reviews_review_session_id_flashcard_id_key" ON "flashcard_reviews"("review_session_id", "flashcard_id");

-- AddForeignKey
ALTER TABLE "flashcard_review_session_items" ADD CONSTRAINT "flashcard_review_session_items_review_session_id_fkey" FOREIGN KEY ("review_session_id") REFERENCES "flashcard_review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_review_session_items" ADD CONSTRAINT "flashcard_review_session_items_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
