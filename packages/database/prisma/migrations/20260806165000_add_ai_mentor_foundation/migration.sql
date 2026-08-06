-- AIMERS_PROACTIVE_AI_MENTOR_FOUNDATION_V1
-- Additive migration: creates mentor persistence tables only.

CREATE TABLE "mentor_conversations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_profile_id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL DEFAULT 'Daily Mentor',
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "last_message_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "mentor_conversations_pkey"
    PRIMARY KEY ("id")
);

CREATE TABLE "mentor_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "role" VARCHAR(24) NOT NULL,
  "content" TEXT NOT NULL,
  "provider" VARCHAR(40),
  "model" VARCHAR(120),
  "context_summary" JSONB,
  "input_tokens" INTEGER,
  "output_tokens" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "mentor_messages_pkey"
    PRIMARY KEY ("id")
);

CREATE TABLE "mentor_daily_briefs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_profile_id" UUID NOT NULL,
  "brief_date" DATE NOT NULL,
  "timezone" VARCHAR(80) NOT NULL,
  "kind" VARCHAR(30) NOT NULL DEFAULT 'DAILY',
  "headline" VARCHAR(240) NOT NULL,
  "summary" TEXT NOT NULL,
  "priorities" JSONB NOT NULL,
  "risks" JSONB NOT NULL,
  "next_actions" JSONB NOT NULL,
  "context_snapshot" JSONB NOT NULL,
  "generated_by" VARCHAR(40) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "mentor_daily_briefs_pkey"
    PRIMARY KEY ("id")
);

CREATE TABLE "mentor_check_ins" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_profile_id" UUID NOT NULL,
  "conversation_id" UUID,
  "kind" VARCHAR(50) NOT NULL,
  "question" TEXT NOT NULL,
  "options" JSONB,
  "hypothesis" JSONB,
  "status" VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  "asked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "answered_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "mentor_check_ins_pkey"
    PRIMARY KEY ("id")
);

CREATE TABLE "mentor_check_in_responses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "check_in_id" UUID NOT NULL,
  "answer" TEXT NOT NULL,
  "selected_option" VARCHAR(120),
  "energy_score" INTEGER,
  "focus_score" INTEGER,
  "mood_score" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "mentor_check_in_responses_pkey"
    PRIMARY KEY ("id")
);

CREATE INDEX "mentor_conversations_student_profile_id_status_updated_at_idx"
  ON "mentor_conversations"(
    "student_profile_id",
    "status",
    "updated_at"
  );

CREATE INDEX "mentor_messages_conversation_id_created_at_idx"
  ON "mentor_messages"(
    "conversation_id",
    "created_at"
  );

CREATE UNIQUE INDEX "mentor_daily_briefs_student_profile_id_brief_date_kind_key"
  ON "mentor_daily_briefs"(
    "student_profile_id",
    "brief_date",
    "kind"
  );

CREATE INDEX "mentor_daily_briefs_student_profile_id_created_at_idx"
  ON "mentor_daily_briefs"(
    "student_profile_id",
    "created_at"
  );

CREATE INDEX "mentor_check_ins_student_profile_id_status_asked_at_idx"
  ON "mentor_check_ins"(
    "student_profile_id",
    "status",
    "asked_at"
  );

CREATE INDEX "mentor_check_ins_conversation_id_asked_at_idx"
  ON "mentor_check_ins"(
    "conversation_id",
    "asked_at"
  );

CREATE UNIQUE INDEX "mentor_check_in_responses_check_in_id_key"
  ON "mentor_check_in_responses"(
    "check_in_id"
  );

ALTER TABLE "mentor_conversations"
  ADD CONSTRAINT "mentor_conversations_student_profile_id_fkey"
  FOREIGN KEY ("student_profile_id")
  REFERENCES "student_profiles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "mentor_messages"
  ADD CONSTRAINT "mentor_messages_conversation_id_fkey"
  FOREIGN KEY ("conversation_id")
  REFERENCES "mentor_conversations"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "mentor_daily_briefs"
  ADD CONSTRAINT "mentor_daily_briefs_student_profile_id_fkey"
  FOREIGN KEY ("student_profile_id")
  REFERENCES "student_profiles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "mentor_check_ins"
  ADD CONSTRAINT "mentor_check_ins_student_profile_id_fkey"
  FOREIGN KEY ("student_profile_id")
  REFERENCES "student_profiles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "mentor_check_ins"
  ADD CONSTRAINT "mentor_check_ins_conversation_id_fkey"
  FOREIGN KEY ("conversation_id")
  REFERENCES "mentor_conversations"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "mentor_check_in_responses"
  ADD CONSTRAINT "mentor_check_in_responses_check_in_id_fkey"
  FOREIGN KEY ("check_in_id")
  REFERENCES "mentor_check_ins"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
