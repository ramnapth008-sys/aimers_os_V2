export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type MemoryRiskBand =
  | "CRITICAL"
  | "HIGH"
  | "MODERATE"
  | "STABLE"
  | "UNASSESSED";

export type MemoryRetentionBand =
  | "STRONG"
  | "BUILDING"
  | "FRAGILE"
  | "UNASSESSED";

export type FlashcardLearningState =
  | "NEW"
  | "LEARNING"
  | "REVIEW"
  | "RELEARNING"
  | "MASTERED";

export type FlashcardReviewRating =
  | "AGAIN"
  | "HARD"
  | "GOOD"
  | "EASY";

export interface MemoryTopicIdentity {
  id: string;
  code: string;
  name: string;
  chapterId: string;
  chapterCode: string;
  chapterName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
}

export interface MemoryTopicPriority {
  topic: MemoryTopicIdentity;
  riskScore: number;
  riskBand: MemoryRiskBand;
  retentionScore: number | null;
  hasEvidence: boolean;
  reasons: string[];
  action: string;
  nextReviewAt: string | null;
  lastEvidenceAt: string | null;

  evidence: {
    mastery: {
      level: string;
      masteryScore: number;
      confidenceScore: number;
      attempts: number;
      correctAnswers: number;
      lastAssessedAt: string | null;
      nextReviewAt: string | null;
    } | null;

    chapter: {
      completionPercent: number;
      revisionCount: number;
      questionAttempts: number;
      correctAnswers: number;
      lastStudiedAt: string | null;
    } | null;

    questionBank: {
      attempts: number;
      correct: number;
      incorrect: number;
      accuracyPercent: number | null;
      averageSeconds: number | null;
    };

    mockTests: {
      attemptedQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      unansweredQuestions: number;
      accuracyPercent: number | null;
      weakSignals: number;
    };

    flashcards: {
      cards: number;
      reviews: number;
      strongReviews: number;
      againReviews: number;
      strongRecallPercent: number | null;
      dueNow: number;
      nextDueAt: string | null;
      lapseCount: number;
      repetitions: number;
      stateCounts: Record<
        FlashcardLearningState,
        number
      >;
    };
  };
}

export interface MemorySubjectSummary {
  subject: {
    id: string;
    code: string;
    name: string;
  };
  topicCount: number;
  assessedTopicCount: number;
  criticalOrHighRiskTopics: number;
  dueCards: number;
  averageRisk: number;
  retentionScore: number | null;
}

export interface MemoryRetentionTrendPoint {
  date: string;
  reviews: number;
  strongReviews: number;
  againReviews: number;
  strongRecallPercent: number | null;
}

export interface MemoryEngineWorkspace {
  generatedAt: string;
  studentProfileId: string;

  syllabusVersion: {
    id: string;
    versionCode: string;
    name: string;
    programme: {
      id?: string;
      code?: string;
      name?: string;
    };
  };

  summary: {
    memoryScore: number;
    retentionBand: MemoryRetentionBand;
    totalTopics: number;
    assessedTopics: number;
    criticalTopics: number;
    highRiskTopics: number;
    dueNow: number;
    nextDueAt: string | null;
    totalFlashcards: number;
    totalReviews: number;
    strongRecallPercent: number;
    questionBankAccuracyPercent: number | null;
    mockTestAccuracyPercent: number | null;
  };

  reviewLoad: {
    overdueOrDueNow: number;
    dueNext24Hours: number;
    dueNext7Days: number;
    dueLater: number;

    learningStateCounts: Record<
      FlashcardLearningState,
      number
    >;

    ratingCounts: Record<
      FlashcardReviewRating,
      number
    >;
  };

  subjects: MemorySubjectSummary[];
  priorities: MemoryTopicPriority[];
  retentionTrend: MemoryRetentionTrendPoint[];
}
