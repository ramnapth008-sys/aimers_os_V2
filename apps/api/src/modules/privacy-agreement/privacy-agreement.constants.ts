import {
  ConsentScope,
  DataConnectorType,
} from "@aimers/database";

export const PRIVACY_POLICY_VERSION =
  "aimers-privacy-data-v2";

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
    "Agreeing grants AIMERS permission for all data sources and intelligence features described below, including the AIMERS Web Collector, approved external website and browser activity, permitted browser-history imports, registered-device and app-usage signals, YouTube and learning-platform accounts, lecture progress, cross-device sync, Behavior AI, AI Mentor context, notifications, and focus-control proposals. AIMERS-controlled features start immediately. AIMERS automatically creates and queues the corresponding external connector setup tasks. When a supported integration is configured, AIMERS starts its authorization sequence; the browser, operating system, extension, OAuth provider, or connected platform still requires its own mandatory approval before external collection begins.",

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
        "AIMERS may process activity inside AIMERS; approved external website, domain, page-title, and full-URL activity when enabled; permitted past browser history; registered-device and app-usage signals; YouTube and connected learning-platform account data; lecture progress; historical imports; academic progress; cross-device signals; and generated behavior and AI summaries. The AIMERS Web Collector records internal AIMERS route sessions, active duration, focus and visibility changes, idle periods, and collector health after agreement. Agreeing creates the corresponding AIMERS consent grants automatically. External collection begins when the required browser, operating-system, extension, OAuth, or provider approval has also succeeded.",
      ],

      bullets: [
        "AIMERS page, route, and study-session activity collected by the AIMERS Web Collector",
        "Permitted app names, foreground duration, and activity categories",
        "Approved external websites, domains, page titles, and full URLs when enabled",
        "Permitted past browser history after browser or extension authorization",
        "YouTube and learning-platform account activity after OAuth or provider authorization",
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
        "After agreement, AIMERS automatically creates separate consent records for every listed AIMERS permission, enables the related privacy preferences, registers this browser, activates AIMERS-native connectors, starts the AIMERS Web Collector, and queues supported external website, browser-history, device, app-usage, YouTube, learning-platform, and historical-import connectors. Each external connector remains pending until its real integration is configured and its mandatory browser, operating-system, extension, OAuth, or provider approval succeeds. AIMERS starts the authorization sequence automatically only where the integration and platform support that behavior.",
        "Pending external connectors remain visible and individually editable in Settings. Creating the AIMERS consent grant does not bypass a browser, operating-system, extension, OAuth, or provider approval.",
      ],

      bullets: [
        "The AIMERS Web Collector and AIMERS lecture features activate immediately",
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
        "The AIMERS Web Collector itself observes only activity inside AIMERS. Approved external website activity, browser history, app or device usage, YouTube data, learning-platform data, and historical imports are collected only through their dedicated authorized connectors. AIMERS does not collect passwords, banking credentials, authentication tokens, raw keystroke content, clipboard contents, or private message bodies under this agreement.",
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
