-- AIMERS_DETAILED_AI_CONTEXT_POLICY_V3
-- Additive audit storage for detailed AI Mentor context.

CREATE TABLE "mentor_context_audits" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_profile_id" UUID NOT NULL,
  "purpose" VARCHAR(60) NOT NULL,
  "policy_version" VARCHAR(40) NOT NULL,
  "consent_scope" VARCHAR(80) NOT NULL,
  "agreement_accepted_at" TIMESTAMPTZ(6),
  "window_start" TIMESTAMPTZ(6),
  "window_end" TIMESTAMPTZ(6),
  "raw_event_count" INTEGER NOT NULL DEFAULT 0,
  "included_event_count" INTEGER NOT NULL DEFAULT 0,
  "full_url_count" INTEGER NOT NULL DEFAULT 0,
  "sanitized_url_count" INTEGER NOT NULL DEFAULT 0,
  "redacted_value_count" INTEGER NOT NULL DEFAULT 0,
  "included_event_ids" JSONB NOT NULL,
  "source_summary" JSONB NOT NULL,
  "sanitization_summary" JSONB NOT NULL,
  "payload_hash" VARCHAR(64) NOT NULL,
  "provider" VARCHAR(40),
  "model" VARCHAR(120),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "mentor_context_audits_pkey"
    PRIMARY KEY ("id")
);

CREATE INDEX "mentor_context_audits_student_profile_id_created_at_idx"
  ON "mentor_context_audits"(
    "student_profile_id",
    "created_at"
  );

CREATE INDEX "mentor_context_audits_student_profile_id_purpose_payload_hash_idx"
  ON "mentor_context_audits"(
    "student_profile_id",
    "purpose",
    "payload_hash"
  );

CREATE INDEX "mentor_context_audits_policy_version_created_at_idx"
  ON "mentor_context_audits"(
    "policy_version",
    "created_at"
  );

ALTER TABLE "mentor_context_audits"
  ADD CONSTRAINT "mentor_context_audits_student_profile_id_fkey"
  FOREIGN KEY ("student_profile_id")
  REFERENCES "student_profiles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
