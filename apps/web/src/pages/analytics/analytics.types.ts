import type {
  MockTestTrendPoint,
  MockTestWeakTopic,
} from "../mock-tests/mock-tests.types";

import type {
  PredictionWorkspace,
  SubjectRisk,
} from "../prediction/prediction.types";

export type AnalyticsQualityStatus =
  | "READY"
  | "PARTIAL"
  | "MISSING";

export type AnalyticsSubjectRisk =
  | SubjectRisk
  | "NO_DATA";

export interface AnalyticsSummary {
  todayStudyMinutes: number;
  weeklyStudyMinutes: number;
  completedSessionCount: number;
  studyStreakDays: number;
  focusRate: number;
  syllabusProgressPercent: number;
  completedChapters: number;
  totalChapters: number;
  assessedTopics: number;
  averageMastery: number;
  mockAttemptCount: number;
  averageTestScore: number;
  averageTestAccuracy: number;
  questionAttempts: number;
  correctAnswers: number;
}

export interface AnalyticsStudyDay {
  dateKey: string;
  label: string;
  durationMinutes: number;
  focusMinutes: number;
  focusRate: number;
}

export interface AnalyticsSubject {
  id: string;
  code: string;
  name: string;
  syllabusProgressPercent: number;
  completedChapters: number;
  totalChapters: number;
  assessedTopics: number;
  masteryScore: number;
  mockScorePercent: number | null;
  mockAccuracyPercent: number | null;
  mockMovement: number | null;
  risk: AnalyticsSubjectRisk;
}

export interface AnalyticsQuestionOutcomes {
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracyPercent: number;
}

export interface AnalyticsSessionDistribution {
  key: string;
  label: string;
  sessionCount: number;
  totalMinutes: number;
  sharePercent: number;
}

export interface AnalyticsStudyScorePair {
  dateKey: string;
  label: string;
  studyMinutes: number;
  focusMinutes: number;
  testScore: number | null;
  testCount: number;
}

export type AnalyticsTimelineType =
  | "STUDY_SESSION"
  | "MOCK_TEST"
  | "CHAPTER_PROGRESS";

export interface AnalyticsTimelineItem {
  id: string;
  type: AnalyticsTimelineType;
  title: string;
  detail: string;
  occurredAt: string;
  link: string;
}

export interface AnalyticsDataQuality {
  key: string;
  label: string;
  status: AnalyticsQualityStatus;
  detail: string;
}

export interface AnalyticsWorkspace {
  programmeName: string;
  timeZone: string;
  summary: AnalyticsSummary;
  studyDays: AnalyticsStudyDay[];
  subjects: AnalyticsSubject[];
  testTrend: MockTestTrendPoint[];
  questionOutcomes: AnalyticsQuestionOutcomes;
  sessionDistribution: AnalyticsSessionDistribution[];
  studyScorePairs: AnalyticsStudyScorePair[];
  pairedStudyScoreDays: number;
  weakTopics: MockTestWeakTopic[];
  recentActivity: AnalyticsTimelineItem[];
  dataQuality: AnalyticsDataQuality[];
  prediction: PredictionWorkspace;
}
