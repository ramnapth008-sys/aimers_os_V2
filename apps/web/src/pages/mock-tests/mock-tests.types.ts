export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type MockTestScope =
  | "FULL_LENGTH"
  | "SUBJECT"
  | "CHAPTER"
  | "TOPIC"
  | "CUSTOM";

export interface MockTestSubject {
  id: string;
  code: string;
  name: string;
}

export interface MockTestTopic {
  id: string;
  code: string;
  name: string;
  chapter?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface MockTestTopicBlueprint {
  id: string;
  topicId: string;
  plannedQuestions: number;
  weightagePercent: number;
  topic: MockTestTopic;
}

export interface MockTestSection {
  id: string;
  name: string;
  sequenceNumber: number;
  totalQuestions: number;
  totalMarks: number;
  marksPerCorrect: number;
  negativeMarksPerWrong: number;
  subject: MockTestSubject | null;
  topicBlueprints?: MockTestTopicBlueprint[];
}

export interface MockTest {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  scope: MockTestScope;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  publishedAt: string | null;
  sections: MockTestSection[];
  attempts?: MockTestAttempt[];
}

export interface MockTestSectionResult {
  id: string;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  maxScore: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  mockTestSection: MockTestSection;
}

export interface MockTestAttempt {
  id: string;
  mockTestId: string;
  attemptNumber: number;
  status: string;
  submittedAt: string | null;
  durationSeconds: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  rawScore: number;
  percentage: number;
  accuracyPercent: number;
  percentile: number | null;
  rank: number | null;
  rankOutOf: number | null;
  notes: string | null;
  mockTest: MockTest;
  sectionResults: MockTestSectionResult[];
}

export interface MockTestWeakTopic {
  topicId: string;
  topic: string;
  chapter: string;
  subject: string;
  occurrences: number;
  averageAccuracy: number;
}

export interface MockTestTrendPoint {
  attemptId: string;
  title: string;
  submittedAt: string | null;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  accuracyPercent: number;
}

export interface MockTestSummary {
  availableTestCount: number;
  attemptCount: number;
  averagePercentage: number;
  averageAccuracy: number;
  bestPercentage: number;
  latestAttempt: MockTestAttempt | null;
  predictionReady: boolean;
}

export interface MockTestWorkspace {
  availableTests: MockTest[];
  attempts: MockTestAttempt[];
  weakTopics: MockTestWeakTopic[];
  trend: MockTestTrendPoint[];
  summary: MockTestSummary;
}

export interface RecordTopicResultInput {
  topicId: string;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface RecordSectionResultInput {
  sectionId: string;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpentSeconds?: number;
  topicResults?: RecordTopicResultInput[];
}

export interface RecordMockTestAttemptInput {
  durationSeconds: number;
  percentile?: number;
  rank?: number;
  rankOutOf?: number;
  notes?: string;
  sections: RecordSectionResultInput[];
}
