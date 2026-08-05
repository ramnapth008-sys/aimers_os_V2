ALTER TABLE "privacy_preferences"
ALTER COLUMN "allow_notifications"
SET DEFAULT false;

UPDATE "privacy_preferences" AS preference
SET
  "allow_notifications" = false,
  "updated_at" = CURRENT_TIMESTAMP
WHERE
  preference."allow_notifications" = true
  AND NOT EXISTS (
    SELECT 1
    FROM "consent_grants" AS consent
    WHERE
      consent."student_profile_id" =
        preference."student_profile_id"
      AND consent."scope" = 'NOTIFICATIONS'
      AND consent."status" = 'ACTIVE'
      AND consent."granted_at" IS NOT NULL
      AND consent."revoked_at" IS NULL
      AND (
        consent."expires_at" IS NULL
        OR consent."expires_at" > CURRENT_TIMESTAMP
      )
  );
