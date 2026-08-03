-- CreateEnum
CREATE TYPE "AcademicProgrammeType" AS ENUM ('SCHOOL', 'HIGHER_SECONDARY', 'ENTRANCE_EXAM', 'UNIVERSITY', 'PROFESSIONAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AcademicCatalogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AcademicEnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LearningProgressState" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TopicMasteryLevel" AS ENUM ('NOT_ASSESSED', 'BEGINNER', 'DEVELOPING', 'PROFICIENT', 'MASTERED');

-- CreateTable
CREATE TABLE "education_boards" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "country" VARCHAR(2) NOT NULL DEFAULT 'IN',
    "status" "AcademicCatalogStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "education_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_programmes" (
    "id" UUID NOT NULL,
    "board_id" UUID,
    "owner_organization_id" UUID,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "AcademicProgrammeType" NOT NULL,
    "status" "AcademicCatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "academic_programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_versions" (
    "id" UUID NOT NULL,
    "programme_id" UUID NOT NULL,
    "version_code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "valid_from" DATE,
    "valid_to" DATE,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" "AcademicCatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "syllabus_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "status" "AcademicCatalogStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_subjects" (
    "id" UUID NOT NULL,
    "syllabus_version_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "weightage" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "syllabus_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_units" (
    "id" UUID NOT NULL,
    "syllabus_subject_id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "academic_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "description" TEXT,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "estimated_minutes" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "description" TEXT,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "estimated_minutes" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "syllabus_version_id" UUID NOT NULL,
    "status" "AcademicEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_progress" (
    "id" UUID NOT NULL,
    "student_enrollment_id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "state" "LearningProgressState" NOT NULL DEFAULT 'NOT_STARTED',
    "completion_percent" INTEGER NOT NULL DEFAULT 0,
    "revision_count" INTEGER NOT NULL DEFAULT 0,
    "question_attempts" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "last_studied_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chapter_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_mastery" (
    "id" UUID NOT NULL,
    "student_enrollment_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "level" "TopicMasteryLevel" NOT NULL DEFAULT 'NOT_ASSESSED',
    "mastery_score" INTEGER NOT NULL DEFAULT 0,
    "confidence_score" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "last_assessed_at" TIMESTAMPTZ(6),
    "next_review_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "topic_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "education_boards_code_key" ON "education_boards"("code");

-- CreateIndex
CREATE INDEX "education_boards_status_idx" ON "education_boards"("status");

-- CreateIndex
CREATE UNIQUE INDEX "academic_programmes_code_key" ON "academic_programmes"("code");

-- CreateIndex
CREATE INDEX "academic_programmes_board_id_status_idx" ON "academic_programmes"("board_id", "status");

-- CreateIndex
CREATE INDEX "academic_programmes_owner_organization_id_status_idx" ON "academic_programmes"("owner_organization_id", "status");

-- CreateIndex
CREATE INDEX "academic_programmes_type_status_idx" ON "academic_programmes"("type", "status");

-- CreateIndex
CREATE INDEX "syllabus_versions_programme_id_status_idx" ON "syllabus_versions"("programme_id", "status");

-- CreateIndex
CREATE INDEX "syllabus_versions_status_is_default_idx" ON "syllabus_versions"("status", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_versions_programme_id_version_code_key" ON "syllabus_versions"("programme_id", "version_code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "subjects_status_idx" ON "subjects"("status");

-- CreateIndex
CREATE INDEX "syllabus_subjects_subject_id_idx" ON "syllabus_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_subjects_syllabus_version_id_subject_id_key" ON "syllabus_subjects"("syllabus_version_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_subjects_syllabus_version_id_sequence_number_key" ON "syllabus_subjects"("syllabus_version_id", "sequence_number");

-- CreateIndex
CREATE INDEX "academic_units_syllabus_subject_id_idx" ON "academic_units"("syllabus_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_units_syllabus_subject_id_code_key" ON "academic_units"("syllabus_subject_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_units_syllabus_subject_id_sequence_number_key" ON "academic_units"("syllabus_subject_id", "sequence_number");

-- CreateIndex
CREATE INDEX "chapters_unit_id_idx" ON "chapters"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_unit_id_code_key" ON "chapters"("unit_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_unit_id_sequence_number_key" ON "chapters"("unit_id", "sequence_number");

-- CreateIndex
CREATE INDEX "topics_chapter_id_idx" ON "topics"("chapter_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_chapter_id_code_key" ON "topics"("chapter_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "topics_chapter_id_sequence_number_key" ON "topics"("chapter_id", "sequence_number");

-- CreateIndex
CREATE INDEX "student_enrollments_student_profile_id_status_idx" ON "student_enrollments"("student_profile_id", "status");

-- CreateIndex
CREATE INDEX "student_enrollments_syllabus_version_id_status_idx" ON "student_enrollments"("syllabus_version_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_student_profile_id_syllabus_version_id_key" ON "student_enrollments"("student_profile_id", "syllabus_version_id");

-- CreateIndex
CREATE INDEX "chapter_progress_student_enrollment_id_state_idx" ON "chapter_progress"("student_enrollment_id", "state");

-- CreateIndex
CREATE INDEX "chapter_progress_chapter_id_idx" ON "chapter_progress"("chapter_id");

-- CreateIndex
CREATE INDEX "chapter_progress_last_studied_at_idx" ON "chapter_progress"("last_studied_at");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_progress_student_enrollment_id_chapter_id_key" ON "chapter_progress"("student_enrollment_id", "chapter_id");

-- CreateIndex
CREATE INDEX "topic_mastery_student_enrollment_id_level_idx" ON "topic_mastery"("student_enrollment_id", "level");

-- CreateIndex
CREATE INDEX "topic_mastery_topic_id_idx" ON "topic_mastery"("topic_id");

-- CreateIndex
CREATE INDEX "topic_mastery_next_review_at_idx" ON "topic_mastery"("next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "topic_mastery_student_enrollment_id_topic_id_key" ON "topic_mastery"("student_enrollment_id", "topic_id");

-- AddForeignKey
ALTER TABLE "academic_programmes" ADD CONSTRAINT "academic_programmes_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "education_boards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_programmes" ADD CONSTRAINT "academic_programmes_owner_organization_id_fkey" FOREIGN KEY ("owner_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_versions" ADD CONSTRAINT "syllabus_versions_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "academic_programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_subjects" ADD CONSTRAINT "syllabus_subjects_syllabus_version_id_fkey" FOREIGN KEY ("syllabus_version_id") REFERENCES "syllabus_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_subjects" ADD CONSTRAINT "syllabus_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_units" ADD CONSTRAINT "academic_units_syllabus_subject_id_fkey" FOREIGN KEY ("syllabus_subject_id") REFERENCES "syllabus_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "academic_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_syllabus_version_id_fkey" FOREIGN KEY ("syllabus_version_id") REFERENCES "syllabus_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
