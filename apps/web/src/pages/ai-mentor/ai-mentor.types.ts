export type ApiFetch =
  <T>(
    path:
      string,
    init?:
      RequestInit,
  ) => Promise<T>;

export interface MentorMessage {
  id:
    string;
  conversationId:
    string;
  role:
    "USER" |
    "ASSISTANT";
  content:
    string;
  provider:
    string | null;
  model:
    string | null;
  createdAt:
    string;
}

export interface MentorDailyBrief {
  id:
    string;
  briefDate:
    string;
  timezone:
    string;
  headline:
    string;
  summary:
    string;
  priorities:
    Array<{
      title:
        string;
      subject:
        string | null;
      priority:
        string;
      estimatedMinutes:
        number;
      dueAt:
        string | null;
    }>;
  risks:
    Array<{
      title:
        string;
      severity:
        string;
      confidenceScore:
        number;
      explanation:
        string;
    }>;
  nextActions:
    Array<{
      title:
        string;
      durationMinutes:
        number;
      reason:
        string;
    }>;
  generatedBy:
    string;
  updatedAt:
    string;
}

export interface MentorCheckIn {
  id:
    string;
  kind:
    string;
  question:
    string;
  options:
    string[] | null;
  hypothesis:
    Record<
      string,
      unknown
    > | null;
  status:
    string;
  askedAt:
    string;
  response:
    {
      id:
        string;
      answer:
        string;
      selectedOption:
        string | null;
      energyScore:
        number | null;
      focusScore:
        number | null;
      moodScore:
        number | null;
      createdAt:
        string;
    } | null;
}

export interface MentorContext {
  generatedAt:
    string;
  taskSummary: {
    active:
      number;
    overdue:
      number;
    nextTask: {
      id:
        string;
      title:
        string;
      priority:
        string;
      estimatedMinutes:
        number;
      subject:
        string | null;
      chapter:
        string | null;
      scheduledFor:
        string | null;
      dueAt:
        string | null;
    } | null;
  };
  behavior: {
    enabled:
      boolean;
    signals:
      Array<{
        id:
          string;
        type:
          string;
        severity:
          string;
        title:
          string;
        description:
          string;
        recommendedAction:
          string | null;
        confidenceScore:
          number;
        dataConfidence:
          string;
        detectedAt:
          string;
      }>;
    latestScores: {
      academicReadinessScore:
        number | null;
      focusScore:
        number | null;
      revisionConsistencyScore:
        number | null;
      distractionRiskScore:
        number | null;
      overloadRiskScore:
        number | null;
      coveragePercent:
        number;
      predictionConfidence:
        string;
    } | null;
  };
  guidance:
    Array<{
      id:
        string;
      type:
        string;
      status:
        string;
      title:
        string;
      message:
        string;
    }>;
  detailedActivity: {
    enabled:
      boolean;
    reason:
      string | null;
    policyVersion:
      string;
    agreementAcceptedAt:
      string | null;
    windowStart:
      string;
    windowEnd:
      string;
    rawEventCount:
      number;
    includedEventCount:
      number;
    fullUrlCount:
      number;
    sanitizedUrlCount:
      number;
    redactedValueCount:
      number;
    auditId:
      string | null;
    events:
      Array<{
        id: string;
        source: string | null;
        category: string | null;
        confidence: string | null;
        eventType: string | null;
        appName: string | null;
        domain: string | null;
        pageTitle: string | null;
        sanitizedUrl: string | null;
        startedAt: string | null;
        endedAt: string | null;
        durationSeconds: number | null;
        foreground: boolean | null;
      }>;
  };
  privacy: {
    aiContextEnabled:
      boolean;
    behaviorContextEnabled:
      boolean;
    notificationsEligible:
      boolean;
    rawActivityIncluded:
      boolean;
    fullUrlsIncluded:
      boolean;
  };
}

export interface AiMentorWorkspace {
  provider: {
    name:
      string;
    model:
      string;
    live:
      boolean;
  };
  conversation: {
    id:
      string;
    title:
      string;
    status:
      string;
    createdAt:
      string;
    updatedAt:
      string;
  };
  messages:
    MentorMessage[];
  brief:
    MentorDailyBrief;
  checkIn:
    MentorCheckIn;
  context:
    MentorContext;
  boundaries: {
    rawActivityIncluded:
      boolean;
    fullUrlsIncluded:
      boolean;
    detailedContextPolicyVersion:
      string;
    contextAuditId:
      string | null;
    medicalDiagnosis:
      false;
    pushNotificationsImplemented:
      false;
  };
}

export interface SendMentorMessageResponse {
  success:
    boolean;
  userMessage:
    MentorMessage;
  assistantMessage:
    MentorMessage;
}

export interface GenerateMentorBriefResponse {
  success:
    boolean;
  brief:
    MentorDailyBrief;
}
