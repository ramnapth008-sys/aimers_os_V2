import {
  ConsentScope,
  DataConnectorType,
} from "@aimers/database";

export const PRIVACY_POLICY_VERSION =
  "aimers-privacy-data-v1";

export const PRIVACY_POLICY_TITLE =
  "AIMERS Privacy & Data Use";

export const ALL_AGREEMENT_SCOPES:
  ConsentScope[] = [
    ConsentScope
      .DIGITAL_ACTIVITY_MONITORING,
    ConsentScope.APP_USAGE,
    ConsentScope.BROWSER_ACTIVITY,
    ConsentScope
      .BROWSER_HISTORY_IMPORT,
    ConsentScope.LECTURE_PROGRESS,
    ConsentScope.CROSS_DEVICE_SYNC,
    ConsentScope.BEHAVIOR_ANALYSIS,
    ConsentScope.AI_CONTEXT_SHARING,
    ConsentScope.NOTIFICATIONS,
    ConsentScope.FOCUS_CONTROLS,
  ];

export const NATIVE_CONNECTOR_TYPES:
  DataConnectorType[] = [
    DataConnectorType.AIMERS_WEB,
    DataConnectorType
      .AIMERS_LECTURE_PLAYER,
  ];

export const PENDING_EXTERNAL_CONNECTORS:
  DataConnectorType[] = [
    DataConnectorType
      .BROWSER_EXTENSION,
    DataConnectorType.YOUTUBE,
    DataConnectorType
      .LEARNING_PLATFORM,
    DataConnectorType.MANUAL_IMPORT,
  ];

export const PRIVACY_POLICY = {
  version:
    PRIVACY_POLICY_VERSION,

  title:
    PRIVACY_POLICY_TITLE,

  summary:
    "Agreeing activates the AIMERS data and intelligence features described below. AIMERS-controlled features start immediately. External sources still require their browser, device, extension, operating-system, OAuth, or provider authorization.",

  defaults: {
    rawRetentionDays:
      90,

    summaryRetentionDays:
      365,

    editable:
      true,
  },

  sections: [
    {
      title:
        "Data covered by this agreement",

      paragraphs: [
        "AIMERS may process your activity inside AIMERS, registered-device usage signals, approved browser activity, explicitly authorized historical imports, lecture progress, connected learning-account data, academic progress, and generated behavior summaries.",
      ],

      bullets: [
        "AIMERS page and study-session activity",
        "Permitted app names, foreground duration, and activity categories",
        "Approved browser domains, page titles, and full URLs when enabled",
        "Available past browser or learning history after source authorization",
        "Lecture watch time and completion evidence from approved sources",
        "Registered device and connector identifiers",
        "Academic, focus, revision, distraction, and workload summaries",
      ],
    },

    {
      title:
        "How AIMERS uses the data",

      paragraphs: [
        "The data is used to provide study analytics, cross-device continuity, Behavior AI, AI Mentor context, reminders, notifications, focus-control proposals, weak-topic detection, and other disclosed Digital Intelligence features.",
      ],

      bullets: [
        "Personalize study planning and recommendations",
        "Measure study time and lecture progress",
        "Generate explainable behavior and focus signals",
        "Provide structured context to AIMERS AI features",
        "Synchronize permitted information across registered devices",
        "Prepare notifications and user-approved focus actions",
      ],
    },

    {
      title:
        "Automatic activation",

      paragraphs: [
        "After agreement, AIMERS creates separate consent records for each listed permission, enables the related privacy preferences, registers this browser, and activates AIMERS-native connectors.",
        "External integrations are queued automatically, but their data collection begins only after the required external authorization succeeds.",
      ],

      bullets: [
        "AIMERS Web and AIMERS lecture features activate immediately",
        "Browser extensions require extension installation and browser permission",
        "Phone or desktop usage requires device or operating-system permission",
        "YouTube and learning platforms require OAuth or official provider access",
        "Historical imports begin only after the relevant source is authorized",
      ],
    },

    {
      title:
        "Retention and editing",

      paragraphs: [
        "The initial defaults are 90 days for raw activity and 365 days for summaries. You can later edit or revoke individual permissions, pause monitoring, change retention, or disconnect a source in Settings.",
        "Revocation stops future permitted processing. Existing-data deletion is a separate operation.",
      ],

      bullets: [
        "All agreement scopes remain individually editable",
        "A later edit does not force this agreement screen to reappear",
        "A revoked source cannot continue authorized ingestion",
        "Policy-version acceptance and consent changes remain auditable",
      ],
    },

    {
      title:
        "Important exclusions and safeguards",

      paragraphs: [
        "AIMERS does not use this agreement to collect passwords, banking credentials, authentication tokens, raw keystroke content, clipboard contents, or private message bodies.",
        "Focus controls authorize proposals and user-approved actions; they do not silently block applications.",
      ],

      bullets: [
        "External access uses official authorization paths where available",
        "App-open duration is not represented as exact lecture completion",
        "Raw URLs and raw activity are excluded from AI Mentor context",
        "Sensitive minor accounts require a dedicated guardian and safety flow",
      ],
    },
  ],
} as const;
