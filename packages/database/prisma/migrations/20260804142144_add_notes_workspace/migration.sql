-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'TRASHED');

-- CreateEnum
CREATE TYPE "NoteContentFormat" AS ENUM ('PLAIN_TEXT', 'MARKDOWN');

-- CreateEnum
CREATE TYPE "NoteSourceType" AS ENUM ('MANUAL', 'AI_GENERATED', 'VOICE_TRANSCRIPT', 'IMPORTED');

-- CreateTable
CREATE TABLE "note_folders" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "parent_folder_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(32),
    "icon" VARCHAR(64),
    "sequence_number" INTEGER NOT NULL DEFAULT 0,
    "is_expanded" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "note_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "folder_id" UUID,
    "subject_id" UUID,
    "chapter_id" UUID,
    "topic_id" UUID,
    "title" VARCHAR(240) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT,
    "content_format" "NoteContentFormat" NOT NULL DEFAULT 'MARKDOWN',
    "source_type" "NoteSourceType" NOT NULL DEFAULT 'MANUAL',
    "status" "NoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "character_count" INTEGER NOT NULL DEFAULT 0,
    "last_opened_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "trashed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_tags" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "color" VARCHAR(32),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "note_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_tag_assignments" (
    "note_id" UUID NOT NULL,
    "note_tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_tag_assignments_pkey" PRIMARY KEY ("note_id","note_tag_id")
);

-- CreateTable
CREATE TABLE "note_revisions" (
    "id" UUID NOT NULL,
    "note_id" UUID NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "content" TEXT NOT NULL,
    "content_format" "NoteContentFormat" NOT NULL,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "character_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_links" (
    "id" UUID NOT NULL,
    "source_note_id" UUID NOT NULL,
    "target_note_id" UUID NOT NULL,
    "label" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_folders_student_profile_id_sequence_number_idx" ON "note_folders"("student_profile_id", "sequence_number");

-- CreateIndex
CREATE INDEX "note_folders_parent_folder_id_idx" ON "note_folders"("parent_folder_id");

-- CreateIndex
CREATE INDEX "notes_student_profile_id_status_is_pinned_updated_at_idx" ON "notes"("student_profile_id", "status", "is_pinned", "updated_at");

-- CreateIndex
CREATE INDEX "notes_folder_id_status_updated_at_idx" ON "notes"("folder_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "notes_subject_id_idx" ON "notes"("subject_id");

-- CreateIndex
CREATE INDEX "notes_chapter_id_idx" ON "notes"("chapter_id");

-- CreateIndex
CREATE INDEX "notes_topic_id_idx" ON "notes"("topic_id");

-- CreateIndex
CREATE INDEX "note_tags_student_profile_id_idx" ON "note_tags"("student_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "note_tags_student_profile_id_name_key" ON "note_tags"("student_profile_id", "name");

-- CreateIndex
CREATE INDEX "note_tag_assignments_note_tag_id_idx" ON "note_tag_assignments"("note_tag_id");

-- CreateIndex
CREATE INDEX "note_revisions_note_id_created_at_idx" ON "note_revisions"("note_id", "created_at");

-- CreateIndex
CREATE INDEX "note_links_target_note_id_idx" ON "note_links"("target_note_id");

-- CreateIndex
CREATE UNIQUE INDEX "note_links_source_note_id_target_note_id_key" ON "note_links"("source_note_id", "target_note_id");

-- AddForeignKey
ALTER TABLE "note_folders" ADD CONSTRAINT "note_folders_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_folders" ADD CONSTRAINT "note_folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "note_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "note_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tag_assignments" ADD CONSTRAINT "note_tag_assignments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tag_assignments" ADD CONSTRAINT "note_tag_assignments_note_tag_id_fkey" FOREIGN KEY ("note_tag_id") REFERENCES "note_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_links" ADD CONSTRAINT "note_links_source_note_id_fkey" FOREIGN KEY ("source_note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_links" ADD CONSTRAINT "note_links_target_note_id_fkey" FOREIGN KEY ("target_note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
