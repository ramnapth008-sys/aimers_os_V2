export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type DataConfidence =
  | "MISSING"
  | "ESTIMATED"
  | "OBSERVED"
  | "VERIFIED"
  | "EXACT";

export type BehaviorSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface DailyActivitySummary {
  id: string;
  summaryDate: string;
  timezone: string;
  monitoredSeconds: number;
  studySeconds: number;
  productiveSeconds: number;
  distractionSeconds: number;
  idleSeconds: number;
  focusedStudySeconds: number;
  lectureSeconds: number;
  revisionSeconds: number;
  socialSeconds: number;
  entertainmentSeconds: number;
  contextSwitches: number;
  longestFocusSeconds: number;
  coveragePercent: number;
  confidence: DataConfidence;
  metrics: unknown;
}

export interface BehaviorSignal {
  id: string;
  type: string;
  severity: BehaviorSeverity;
  confidenceScore: number;
  dataConfidence: DataConfidence;
  title: string;
  description: string;
  evidence: unknown;
  recommendedAction: string | null;
  periodStart: string;
  periodEnd: string;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface IntelligenceSnapshot {
  id: string;
  periodStart: string;
  periodEnd: string;
  coveragePercent: number;
  predictionConfidence: DataConfidence;
  academicReadinessScore: number | null;
  focusScore: number | null;
  revisionConsistencyScore: number | null;
  distractionRiskScore: number | null;
  overloadRiskScore: number | null;
  generatedAt: string;
}

export interface ActivitySession {
  id: string;
  source: string;
  category: string;
  confidence: DataConfidence;
  appName: string | null;
  domain: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  focusedSeconds: number;
  interruptionCount: number;
  concurrentDistractionSeconds: number;
}

export interface BehaviorOverview {
  period: {
    days: number;
    from: string;
    to: string;
  };
  summaries: DailyActivitySummary[];
  activeSignals: BehaviorSignal[];
  latestSnapshot: IntelligenceSnapshot | null;
  recentSessions: ActivitySession[];
}

export type InterventionStatus =
  | "SUGGESTED"
  | "ACCEPTED"
  | "ACTIVE"
  | "DISMISSED"
  | "COMPLETED"
  | "EXPIRED";

export type InterventionResponseType =
  | "ACCEPTED"
  | "DISMISSED"
  | "SNOOZED"
  | "COMPLETED"
  | "HELPFUL"
  | "NOT_HELPFUL";

export interface InterventionResponse {
  id: string;
  responseType: InterventionResponseType;
  note: string | null;
  createdAt: string;
}

export interface Intervention {
  id: string;
  behaviorSignalId: string | null;
  type: string;
  status: InterventionStatus;
  title: string;
  message: string;
  actionConfig: unknown;
  scheduledAt: string | null;
  deliveredAt: string | null;
  expiresAt: string | null;
  respondedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  behaviorSignal: BehaviorSignal | null;
  responses: InterventionResponse[];
}

export interface BehaviorWorkspace {
  overview: BehaviorOverview;
  interventions: Intervention[];
}

// AIMERS_BEHAVIOR_INTELLIGENCE_ACTIVATION_V1
export interface AnalyzeBehaviorResponse {
  success: boolean;
  period: {
    from: string;
    to: string;
    days: number;
    timezone: string;
  };
  processed: {
    rawEvents: number;
    normalizedSessions: number;
    dailySummaries: number;
    lectures: number;
    behaviorSignals: number;
  };
  scores: {
    academicReadinessScore: number | null;
    focusScore: number | null;
    distractionRiskScore: number | null;
    overloadRiskScore: number | null;
  };
  latestDay: DailyActivitySummary;
  signals: BehaviorSignal[];
  snapshot: IntelligenceSnapshot;
}

export interface GenerateInterventionsResponse {
  success: boolean;
  eligibleSignals: number;
  created: number;
  alreadyOpen: number;
  capabilities: {
    inApp: boolean;
    notificationsEligible: boolean;
    focusControlsEligible: boolean;
    automaticBlocking: boolean;
  };
  interventions: Intervention[];
}

export interface RespondToInterventionResponse {
  success: boolean;
  intervention: Intervention;
}
