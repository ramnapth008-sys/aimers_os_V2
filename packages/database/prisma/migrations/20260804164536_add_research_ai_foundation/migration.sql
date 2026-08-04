-- CreateEnum
CREATE TYPE "ResearchProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResearchSourceType" AS ENUM ('WEB_PAGE', 'PDF', 'BOOK', 'VIDEO', 'NOTE', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ResearchSourceStatus" AS ENUM ('SAVED', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResearchMessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ResearchMindMapNodeType" AS ENUM ('ROOT', 'QUESTION', 'CONCEPT', 'EVIDENCE', 'SOURCE', 'NOTE', 'CONCLUSION');

-- CreateTable
CREATE TABLE "research_projects" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "subject_id" UUID,
    "chapter_id" UUID,
    "topic_id" UUID,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT,
    "research_question" TEXT,
    "status" "ResearchProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "color" VARCHAR(32),
    "icon" VARCHAR(64),
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "last_opened_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "research_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_sources" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "research_project_id" UUID NOT NULL,
    "source_note_id" UUID,
    "type" "ResearchSourceType" NOT NULL,
    "status" "ResearchSourceStatus" NOT NULL DEFAULT 'SAVED',
    "title" VARCHAR(300) NOT NULL,
    "url" TEXT,
    "author" VARCHAR(240),
    "publisher" VARCHAR(240),
    "published_at" TIMESTAMPTZ(6),
    "accessed_at" TIMESTAMPTZ(6),
    "raw_content" TEXT,
    "summary" TEXT,
    "citation_text" TEXT,
    "citation_key" VARCHAR(120),
    "reliability_score" INTEGER,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "processing_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "research_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_source_excerpts" (
    "id" UUID NOT NULL,
    "research_source_id" UUID NOT NULL,
    "quote" TEXT NOT NULL,
    "note" TEXT,
    "locator" VARCHAR(160),
    "page_number" INTEGER,
    "start_offset" INTEGER,
    "end_offset" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "research_source_excerpts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_threads" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "research_project_id" UUID NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "research_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_messages" (
    "id" UUID NOT NULL,
    "research_thread_id" UUID NOT NULL,
    "role" "ResearchMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" VARCHAR(120),
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_citations" (
    "id" UUID NOT NULL,
    "research_message_id" UUID NOT NULL,
    "research_source_id" UUID NOT NULL,
    "research_source_excerpt_id" UUID,
    "label" VARCHAR(120),
    "quote" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_mind_map_nodes" (
    "id" UUID NOT NULL,
    "research_project_id" UUID NOT NULL,
    "research_source_id" UUID,
    "note_id" UUID,
    "type" "ResearchMindMapNodeType" NOT NULL DEFAULT 'CONCEPT',
    "title" VARCHAR(240) NOT NULL,
    "content" TEXT,
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" VARCHAR(32),
    "sequence_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "research_mind_map_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_mind_map_edges" (
    "id" UUID NOT NULL,
    "research_project_id" UUID NOT NULL,
    "source_node_id" UUID NOT NULL,
    "target_node_id" UUID NOT NULL,
    "label" VARCHAR(160),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_mind_map_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "research_projects_student_profile_id_status_is_pinned_updat_idx" ON "research_projects"("student_profile_id", "status", "is_pinned", "updated_at");

-- CreateIndex
CREATE INDEX "research_projects_subject_id_idx" ON "research_projects"("subject_id");

-- CreateIndex
CREATE INDEX "research_projects_chapter_id_idx" ON "research_projects"("chapter_id");

-- CreateIndex
CREATE INDEX "research_projects_topic_id_idx" ON "research_projects"("topic_id");

-- CreateIndex
CREATE INDEX "research_sources_student_profile_id_status_updated_at_idx" ON "research_sources"("student_profile_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "research_sources_research_project_id_status_is_pinned_updat_idx" ON "research_sources"("research_project_id", "status", "is_pinned", "updated_at");

-- CreateIndex
CREATE INDEX "research_sources_source_note_id_idx" ON "research_sources"("source_note_id");

-- CreateIndex
CREATE INDEX "research_sources_type_status_idx" ON "research_sources"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "research_sources_research_project_id_citation_key_key" ON "research_sources"("research_project_id", "citation_key");

-- CreateIndex
CREATE INDEX "research_source_excerpts_research_source_id_created_at_idx" ON "research_source_excerpts"("research_source_id", "created_at");

-- CreateIndex
CREATE INDEX "research_source_excerpts_page_number_idx" ON "research_source_excerpts"("page_number");

-- CreateIndex
CREATE INDEX "research_threads_student_profile_id_updated_at_idx" ON "research_threads"("student_profile_id", "updated_at");

-- CreateIndex
CREATE INDEX "research_threads_research_project_id_updated_at_idx" ON "research_threads"("research_project_id", "updated_at");

-- CreateIndex
CREATE INDEX "research_messages_research_thread_id_created_at_idx" ON "research_messages"("research_thread_id", "created_at");

-- CreateIndex
CREATE INDEX "research_citations_research_message_id_idx" ON "research_citations"("research_message_id");

-- CreateIndex
CREATE INDEX "research_citations_research_source_id_idx" ON "research_citations"("research_source_id");

-- CreateIndex
CREATE INDEX "research_citations_research_source_excerpt_id_idx" ON "research_citations"("research_source_excerpt_id");

-- CreateIndex
CREATE INDEX "research_mind_map_nodes_research_project_id_sequence_number_idx" ON "research_mind_map_nodes"("research_project_id", "sequence_number");

-- CreateIndex
CREATE INDEX "research_mind_map_nodes_research_source_id_idx" ON "research_mind_map_nodes"("research_source_id");

-- CreateIndex
CREATE INDEX "research_mind_map_nodes_note_id_idx" ON "research_mind_map_nodes"("note_id");

-- CreateIndex
CREATE INDEX "research_mind_map_edges_research_project_id_idx" ON "research_mind_map_edges"("research_project_id");

-- CreateIndex
CREATE INDEX "research_mind_map_edges_target_node_id_idx" ON "research_mind_map_edges"("target_node_id");

-- CreateIndex
CREATE UNIQUE INDEX "research_mind_map_edges_source_node_id_target_node_id_key" ON "research_mind_map_edges"("source_node_id", "target_node_id");

-- AddForeignKey
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_sources" ADD CONSTRAINT "research_sources_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_sources" ADD CONSTRAINT "research_sources_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_sources" ADD CONSTRAINT "research_sources_source_note_id_fkey" FOREIGN KEY ("source_note_id") REFERENCES "notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_source_excerpts" ADD CONSTRAINT "research_source_excerpts_research_source_id_fkey" FOREIGN KEY ("research_source_id") REFERENCES "research_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_threads" ADD CONSTRAINT "research_threads_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_threads" ADD CONSTRAINT "research_threads_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_messages" ADD CONSTRAINT "research_messages_research_thread_id_fkey" FOREIGN KEY ("research_thread_id") REFERENCES "research_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_citations" ADD CONSTRAINT "research_citations_research_message_id_fkey" FOREIGN KEY ("research_message_id") REFERENCES "research_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_citations" ADD CONSTRAINT "research_citations_research_source_id_fkey" FOREIGN KEY ("research_source_id") REFERENCES "research_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_citations" ADD CONSTRAINT "research_citations_research_source_excerpt_id_fkey" FOREIGN KEY ("research_source_excerpt_id") REFERENCES "research_source_excerpts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_mind_map_nodes" ADD CONSTRAINT "research_mind_map_nodes_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_mind_map_nodes" ADD CONSTRAINT "research_mind_map_nodes_research_source_id_fkey" FOREIGN KEY ("research_source_id") REFERENCES "research_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_mind_map_nodes" ADD CONSTRAINT "research_mind_map_nodes_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_mind_map_edges" ADD CONSTRAINT "research_mind_map_edges_research_project_id_fkey" FOREIGN KEY ("research_project_id") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_mind_map_edges" ADD CONSTRAINT "research_mind_map_edges_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "research_mind_map_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_mind_map_edges" ADD CONSTRAINT "research_mind_map_edges_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "research_mind_map_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
