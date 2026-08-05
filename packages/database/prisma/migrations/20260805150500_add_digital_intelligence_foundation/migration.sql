-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('DIGITAL_ACTIVITY_MONITORING', 'APP_USAGE', 'BROWSER_ACTIVITY', 'BROWSER_HISTORY_IMPORT', 'LECTURE_PROGRESS', 'CROSS_DEVICE_SYNC', 'BEHAVIOR_ANALYSIS', 'AI_CONTEXT_SHARING', 'NOTIFICATIONS', 'FOCUS_CONTROLS');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConsentActorType" AS ENUM ('STUDENT', 'GUARDIAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('WEB', 'CHROME_EXTENSION', 'EDGE_EXTENSION', 'ANDROID', 'IOS', 'IPADOS', 'MACOS', 'WINDOWS', 'LINUX', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'OFFLINE', 'REVOKED');

-- CreateEnum
CREATE TYPE "DataConnectorType" AS ENUM ('AIMERS_WEB', 'AIMERS_LECTURE_PLAYER', 'BROWSER_EXTENSION', 'ANDROID_USAGE_ACCESS', 'APPLE_DEVICE_ACTIVITY', 'DESKTOP_AGENT', 'YOUTUBE', 'LEARNING_PLATFORM', 'MANUAL_IMPORT');

-- CreateEnum
CREATE TYPE "DataConnectorStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'ERROR', 'REVOKED');

-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('APP', 'WEBSITE', 'BROWSER', 'LECTURE', 'STUDY_SESSION', 'DEVICE', 'IDLE', 'IMPORTED');

-- CreateEnum
CREATE TYPE "ActivityEventType" AS ENUM ('SESSION_STARTED', 'SESSION_ENDED', 'APP_FOREGROUND', 'APP_BACKGROUND', 'WEBSITE_ACTIVE', 'WEBSITE_INACTIVE', 'LECTURE_STARTED', 'LECTURE_PROGRESS', 'LECTURE_PAUSED', 'LECTURE_COMPLETED', 'DEVICE_IDLE', 'DEVICE_ACTIVE', 'DEVICE_LOCKED', 'DEVICE_UNLOCKED', 'DEVICE_OFFLINE', 'DEVICE_ONLINE', 'HISTORY_IMPORTED', 'FOCUS_INTERRUPTION');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('STUDY', 'PRODUCTIVITY', 'SOCIAL', 'ENTERTAINMENT', 'COMMUNICATION', 'SYSTEM', 'IDLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DataConfidenceLevel" AS ENUM ('EXACT', 'VERIFIED', 'OBSERVED', 'ESTIMATED', 'MISSING');

-- CreateEnum
CREATE TYPE "BehaviorSignalType" AS ENUM ('FOCUS_STREAK', 'CONTEXT_SWITCHING', 'PROCRASTINATION', 'LATE_NIGHT_SCROLLING', 'MISSED_STUDY_BLOCK', 'REVISION_GAP', 'DISTRACTION_BURST', 'OVERLOAD_RISK', 'RECOVERY_PATTERN', 'LECTURE_INCOMPLETE');

-- CreateEnum
CREATE TYPE "BehaviorSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM ('GENTLE_NUDGE', 'FOCUS_SESSION', 'BLOCK_APP', 'BLOCK_WEBSITE', 'RESCHEDULE_TASK', 'MENTOR_CHECK_IN', 'REVISION_REMINDER', 'RECOVERY_PLAN');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('SUGGESTED', 'ACCEPTED', 'DISMISSED', 'ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InterventionResponseType" AS ENUM ('ACCEPTED', 'DISMISSED', 'SNOOZED', 'HELPFUL', 'NOT_HELPFUL', 'COMPLETED');

-- CreateTable
CREATE TABLE "consent_grants" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "scope" "ConsentScope" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "actor_type" "ConsentActorType" NOT NULL DEFAULT 'STUDENT',
    "granted_by_user_id" UUID,
    "policy_version" VARCHAR(40) NOT NULL,
    "granted_for_minor" BOOLEAN NOT NULL DEFAULT false,
    "granted_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consent_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_preferences" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "monitoring_enabled" BOOLEAN NOT NULL DEFAULT false,
    "background_monitoring" BOOLEAN NOT NULL DEFAULT false,
    "cross_device_sync" BOOLEAN NOT NULL DEFAULT false,
    "store_raw_activity" BOOLEAN NOT NULL DEFAULT false,
    "store_full_urls" BOOLEAN NOT NULL DEFAULT false,
    "import_past_history" BOOLEAN NOT NULL DEFAULT false,
    "allow_ai_context" BOOLEAN NOT NULL DEFAULT false,
    "allow_behavior_analysis" BOOLEAN NOT NULL DEFAULT false,
    "allow_notifications" BOOLEAN NOT NULL DEFAULT true,
    "allow_focus_controls" BOOLEAN NOT NULL DEFAULT false,
    "local_processing_preferred" BOOLEAN NOT NULL DEFAULT true,
    "minor_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
    "guardian_approval_required" BOOLEAN NOT NULL DEFAULT false,
    "raw_retention_days" INTEGER NOT NULL DEFAULT 30,
    "summary_retention_days" INTEGER NOT NULL DEFAULT 365,
    "paused_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "privacy_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connected_devices" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "external_device_id" VARCHAR(200) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'PENDING',
    "app_version" VARCHAR(80),
    "os_version" VARCHAR(120),
    "last_seen_at" TIMESTAMPTZ(6),
    "last_sync_at" TIMESTAMPTZ(6),
    "monitoring_started_at" TIMESTAMPTZ(6),
    "monitoring_paused_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "connected_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_connectors" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "connected_device_id" UUID,
    "type" "DataConnectorType" NOT NULL,
    "status" "DataConnectorStatus" NOT NULL DEFAULT 'PENDING',
    "display_name" VARCHAR(160) NOT NULL,
    "external_account_id" VARCHAR(240),
    "permissions" JSONB,
    "sync_cursor" TEXT,
    "last_sync_at" TIMESTAMPTZ(6),
    "last_successful_sync_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "data_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "connected_device_id" UUID,
    "data_connector_id" UUID,
    "consent_grant_id" UUID,
    "event_key" VARCHAR(240),
    "type" "ActivityEventType" NOT NULL,
    "source" "ActivitySource" NOT NULL,
    "category" "ActivityCategory" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" "DataConfidenceLevel" NOT NULL DEFAULT 'OBSERVED',
    "app_name" VARCHAR(200),
    "domain" VARCHAR(320),
    "page_title" VARCHAR(500),
    "external_reference_id" VARCHAR(240),
    "subject_id" UUID,
    "chapter_id" UUID,
    "topic_id" UUID,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "foreground" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "ingested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_sessions" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "connected_device_id" UUID,
    "source" "ActivitySource" NOT NULL,
    "category" "ActivityCategory" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" "DataConfidenceLevel" NOT NULL DEFAULT 'OBSERVED',
    "app_name" VARCHAR(200),
    "domain" VARCHAR(320),
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "focused_seconds" INTEGER NOT NULL DEFAULT 0,
    "interruption_count" INTEGER NOT NULL DEFAULT 0,
    "concurrent_distraction_seconds" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "activity_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecture_sessions" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "connected_device_id" UUID,
    "data_connector_id" UUID,
    "external_lecture_id" VARCHAR(240),
    "platform_name" VARCHAR(160) NOT NULL,
    "course_title" VARCHAR(300),
    "lecture_title" VARCHAR(300) NOT NULL,
    "subject_id" UUID,
    "chapter_id" UUID,
    "topic_id" UUID,
    "total_duration_seconds" INTEGER,
    "watched_seconds" INTEGER NOT NULL DEFAULT 0,
    "focused_seconds" INTEGER NOT NULL DEFAULT 0,
    "playback_position_seconds" INTEGER NOT NULL DEFAULT 0,
    "completion_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "confidence" "DataConfidenceLevel" NOT NULL DEFAULT 'OBSERVED',
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "last_progress_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecture_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activity_summaries" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "summary_date" DATE NOT NULL,
    "timezone" VARCHAR(80) NOT NULL,
    "monitored_seconds" INTEGER NOT NULL DEFAULT 0,
    "study_seconds" INTEGER NOT NULL DEFAULT 0,
    "productive_seconds" INTEGER NOT NULL DEFAULT 0,
    "distraction_seconds" INTEGER NOT NULL DEFAULT 0,
    "idle_seconds" INTEGER NOT NULL DEFAULT 0,
    "focused_study_seconds" INTEGER NOT NULL DEFAULT 0,
    "lecture_seconds" INTEGER NOT NULL DEFAULT 0,
    "revision_seconds" INTEGER NOT NULL DEFAULT 0,
    "social_seconds" INTEGER NOT NULL DEFAULT 0,
    "entertainment_seconds" INTEGER NOT NULL DEFAULT 0,
    "context_switches" INTEGER NOT NULL DEFAULT 0,
    "longest_focus_seconds" INTEGER NOT NULL DEFAULT 0,
    "coverage_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" "DataConfidenceLevel" NOT NULL DEFAULT 'MISSING',
    "metrics" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "daily_activity_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_signals" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "type" "BehaviorSignalType" NOT NULL,
    "severity" "BehaviorSeverity" NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "data_confidence" "DataConfidenceLevel" NOT NULL DEFAULT 'OBSERVED',
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "recommended_action" TEXT,
    "period_start" TIMESTAMPTZ(6),
    "period_end" TIMESTAMPTZ(6),
    "detected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "behavior_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "behavior_signal_id" UUID,
    "type" "InterventionType" NOT NULL,
    "status" "InterventionStatus" NOT NULL DEFAULT 'SUGGESTED',
    "title" VARCHAR(240) NOT NULL,
    "message" TEXT NOT NULL,
    "action_config" JSONB,
    "scheduled_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "responded_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_responses" (
    "id" UUID NOT NULL,
    "intervention_id" UUID NOT NULL,
    "response_type" "InterventionResponseType" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_intelligence_snapshots" (
    "id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coverage_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prediction_confidence" "DataConfidenceLevel" NOT NULL DEFAULT 'MISSING',
    "academic_readiness_score" DOUBLE PRECISION,
    "focus_score" DOUBLE PRECISION,
    "revision_consistency_score" DOUBLE PRECISION,
    "distraction_risk_score" DOUBLE PRECISION,
    "overload_risk_score" DOUBLE PRECISION,
    "features" JSONB NOT NULL,
    "source_version" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_intelligence_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consent_grants_student_profile_id_status_idx" ON "consent_grants"("student_profile_id", "status");

-- CreateIndex
CREATE INDEX "consent_grants_scope_status_idx" ON "consent_grants"("scope", "status");

-- CreateIndex
CREATE INDEX "consent_grants_expires_at_idx" ON "consent_grants"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_preferences_student_profile_id_key" ON "privacy_preferences"("student_profile_id");

-- CreateIndex
CREATE INDEX "connected_devices_student_profile_id_status_idx" ON "connected_devices"("student_profile_id", "status");

-- CreateIndex
CREATE INDEX "connected_devices_status_last_seen_at_idx" ON "connected_devices"("status", "last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "connected_devices_student_profile_id_external_device_id_key" ON "connected_devices"("student_profile_id", "external_device_id");

-- CreateIndex
CREATE INDEX "data_connectors_student_profile_id_status_idx" ON "data_connectors"("student_profile_id", "status");

-- CreateIndex
CREATE INDEX "data_connectors_connected_device_id_status_idx" ON "data_connectors"("connected_device_id", "status");

-- CreateIndex
CREATE INDEX "data_connectors_type_status_idx" ON "data_connectors"("type", "status");

-- CreateIndex
CREATE INDEX "data_connectors_last_sync_at_idx" ON "data_connectors"("last_sync_at");

-- CreateIndex
CREATE INDEX "activity_events_student_profile_id_started_at_idx" ON "activity_events"("student_profile_id", "started_at");

-- CreateIndex
CREATE INDEX "activity_events_connected_device_id_started_at_idx" ON "activity_events"("connected_device_id", "started_at");

-- CreateIndex
CREATE INDEX "activity_events_data_connector_id_started_at_idx" ON "activity_events"("data_connector_id", "started_at");

-- CreateIndex
CREATE INDEX "activity_events_category_started_at_idx" ON "activity_events"("category", "started_at");

-- CreateIndex
CREATE INDEX "activity_events_subject_id_chapter_id_topic_id_idx" ON "activity_events"("subject_id", "chapter_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_events_student_profile_id_event_key_key" ON "activity_events"("student_profile_id", "event_key");

-- CreateIndex
CREATE INDEX "activity_sessions_student_profile_id_started_at_idx" ON "activity_sessions"("student_profile_id", "started_at");

-- CreateIndex
CREATE INDEX "activity_sessions_connected_device_id_started_at_idx" ON "activity_sessions"("connected_device_id", "started_at");

-- CreateIndex
CREATE INDEX "activity_sessions_category_started_at_idx" ON "activity_sessions"("category", "started_at");

-- CreateIndex
CREATE INDEX "lecture_sessions_student_profile_id_started_at_idx" ON "lecture_sessions"("student_profile_id", "started_at");

-- CreateIndex
CREATE INDEX "lecture_sessions_connected_device_id_started_at_idx" ON "lecture_sessions"("connected_device_id", "started_at");

-- CreateIndex
CREATE INDEX "lecture_sessions_data_connector_id_started_at_idx" ON "lecture_sessions"("data_connector_id", "started_at");

-- CreateIndex
CREATE INDEX "lecture_sessions_subject_id_chapter_id_topic_id_idx" ON "lecture_sessions"("subject_id", "chapter_id", "topic_id");

-- CreateIndex
CREATE INDEX "lecture_sessions_completed_last_progress_at_idx" ON "lecture_sessions"("completed", "last_progress_at");

-- CreateIndex
CREATE INDEX "daily_activity_summaries_student_profile_id_summary_date_idx" ON "daily_activity_summaries"("student_profile_id", "summary_date");

-- CreateIndex
CREATE INDEX "daily_activity_summaries_confidence_summary_date_idx" ON "daily_activity_summaries"("confidence", "summary_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_activity_summaries_student_profile_id_summary_date_ti_key" ON "daily_activity_summaries"("student_profile_id", "summary_date", "timezone");

-- CreateIndex
CREATE INDEX "behavior_signals_student_profile_id_detected_at_idx" ON "behavior_signals"("student_profile_id", "detected_at");

-- CreateIndex
CREATE INDEX "behavior_signals_type_severity_detected_at_idx" ON "behavior_signals"("type", "severity", "detected_at");

-- CreateIndex
CREATE INDEX "behavior_signals_resolved_at_idx" ON "behavior_signals"("resolved_at");

-- CreateIndex
CREATE INDEX "interventions_student_profile_id_status_scheduled_at_idx" ON "interventions"("student_profile_id", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "interventions_behavior_signal_id_idx" ON "interventions"("behavior_signal_id");

-- CreateIndex
CREATE INDEX "interventions_expires_at_idx" ON "interventions"("expires_at");

-- CreateIndex
CREATE INDEX "intervention_responses_intervention_id_created_at_idx" ON "intervention_responses"("intervention_id", "created_at");

-- CreateIndex
CREATE INDEX "intervention_responses_response_type_created_at_idx" ON "intervention_responses"("response_type", "created_at");

-- CreateIndex
CREATE INDEX "student_intelligence_snapshots_student_profile_id_generated_idx" ON "student_intelligence_snapshots"("student_profile_id", "generated_at");

-- CreateIndex
CREATE INDEX "student_intelligence_snapshots_period_start_period_end_idx" ON "student_intelligence_snapshots"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "student_intelligence_snapshots_prediction_confidence_genera_idx" ON "student_intelligence_snapshots"("prediction_confidence", "generated_at");

-- AddForeignKey
ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_preferences" ADD CONSTRAINT "privacy_preferences_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_devices" ADD CONSTRAINT "connected_devices_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_connectors" ADD CONSTRAINT "data_connectors_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_connectors" ADD CONSTRAINT "data_connectors_connected_device_id_fkey" FOREIGN KEY ("connected_device_id") REFERENCES "connected_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_connected_device_id_fkey" FOREIGN KEY ("connected_device_id") REFERENCES "connected_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_data_connector_id_fkey" FOREIGN KEY ("data_connector_id") REFERENCES "data_connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_consent_grant_id_fkey" FOREIGN KEY ("consent_grant_id") REFERENCES "consent_grants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_connected_device_id_fkey" FOREIGN KEY ("connected_device_id") REFERENCES "connected_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_sessions" ADD CONSTRAINT "lecture_sessions_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_sessions" ADD CONSTRAINT "lecture_sessions_connected_device_id_fkey" FOREIGN KEY ("connected_device_id") REFERENCES "connected_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_sessions" ADD CONSTRAINT "lecture_sessions_data_connector_id_fkey" FOREIGN KEY ("data_connector_id") REFERENCES "data_connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activity_summaries" ADD CONSTRAINT "daily_activity_summaries_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_signals" ADD CONSTRAINT "behavior_signals_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_behavior_signal_id_fkey" FOREIGN KEY ("behavior_signal_id") REFERENCES "behavior_signals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_responses" ADD CONSTRAINT "intervention_responses_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_intelligence_snapshots" ADD CONSTRAINT "student_intelligence_snapshots_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

