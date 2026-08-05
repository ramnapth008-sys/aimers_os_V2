CREATE TABLE "privacy_agreement_acceptances" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_profile_id" UUID NOT NULL,
  "accepted_by_user_id" UUID,
  "policy_version" VARCHAR(40) NOT NULL,
  "activation_source" VARCHAR(80) NOT NULL DEFAULT 'PRIVACY_GATE',
  "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "privacy_agreement_acceptances_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
  "privacy_agreement_acceptances_student_profile_id_policy_version_key"
ON
  "privacy_agreement_acceptances"(
    "student_profile_id",
    "policy_version"
  );

CREATE INDEX
  "privacy_agreement_acceptances_student_profile_id_accepted_at_idx"
ON
  "privacy_agreement_acceptances"(
    "student_profile_id",
    "accepted_at"
  );

CREATE INDEX
  "privacy_agreement_acceptances_policy_version_accepted_at_idx"
ON
  "privacy_agreement_acceptances"(
    "policy_version",
    "accepted_at"
  );

ALTER TABLE
  "privacy_agreement_acceptances"
ADD CONSTRAINT
  "privacy_agreement_acceptances_student_profile_id_fkey"
FOREIGN KEY
  ("student_profile_id")
REFERENCES
  "student_profiles"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
