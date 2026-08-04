export type MockTestRunnerStatus =
  | "READY"
  | "RESUMABLE"
  | "UNAVAILABLE";

export type MockTestAttemptStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EVALUATED"
  | "ABANDONED";

export interface RunnerSubject {
  id: string;
  code: string;
  name: string;
}

export interface RunnerChapter {
  id: string;
  code: string;
  name: string;
}

export interface RunnerTopic {
  id: string;
  code: string;
  name: string;
}

export interface RunnerCatalogueAttemptSummary {
  id: string;
  attemptNumber?: number;
  startedAt?: string | null;
  submittedAt?: string | null;
  answeredQuestions?: number;
  markedForReview?: number;
  rawScore?: number;
  percentage?: number;
  accuracyPercent?: number;
}

export interface RunnerCatalogueSection {
  id: string;
  name: string;
  sequenceNumber: number;
  totalQuestions: number;
  totalMarks: number;
  subject: RunnerSubject | null;
  assignedQuestionCount: number;
}

export interface RunnerCatalogueTest {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  scope: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  assignedQuestionCount: number;
  runnable: boolean;
  runnerStatus:
    MockTestRunnerStatus;
  activeAttempt:
    RunnerCatalogueAttemptSummary | null;
  latestEvaluatedAttempt:
    RunnerCatalogueAttemptSummary | null;
  sections:
    RunnerCatalogueSection[];
}

export interface MockTestRunnerCatalogue {
  tests: RunnerCatalogueTest[];
}

export interface RunnerOption {
  id: string;
  label: string;
  text: string;
  sequenceNumber: number;
}

export interface RunnerQuestion {
  id: string;
  code: string;
  type: string;
  difficulty: string;
  stem: string;
  explanation: string | null;
  subject: RunnerSubject;
  chapter: RunnerChapter | null;
  topic: RunnerTopic | null;
  options: RunnerOption[];
  correctOptionId: string | null;
}

export interface RunnerQuestionResponse {
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
  answeredAt: string | null;
  isCorrect: boolean | null;
  awardedMarks: number;
}

export interface RunnerAssignedQuestion {
  mockTestQuestionId: string;
  globalSequenceNumber: number;
  sequenceNumber: number;
  marks: number;
  negativeMarks: number;
  response:
    RunnerQuestionResponse;
  question: RunnerQuestion;
}

export interface RunnerAttemptSection {
  id: string;
  name: string;
  sequenceNumber: number;
  subject: RunnerSubject | null;
  questions:
    RunnerAssignedQuestion[];
}

export interface RunnerSectionResult {
  id: string;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  maxScore: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  mockTestSection: {
    id: string;
    name: string;
    subject:
      RunnerSubject | null;
  };
}

export interface RunnerTopicResult {
  id: string;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  accuracyPercent: number;
  isWeak: boolean;
  topic: {
    id: string;
    code: string;
    name: string;
    chapter:
      RunnerChapter;
  };
}

export interface MockTestRunnerAttempt {
  id: string;
  studentProfileId: string;
  mockTestId: string;
  attemptNumber: number;
  status:
    MockTestAttemptStatus;
  startedAt: string | null;
  submittedAt: string | null;
  evaluatedAt: string | null;
  expiresAt: string | null;
  remainingSeconds: number;
  durationSeconds: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  rawScore: number;
  percentage: number;
  accuracyPercent: number;
  notes: string | null;

  mockTest: {
    id: string;
    code: string | null;
    title: string;
    description: string | null;
    instructions: string | null;
    scope: string;
    totalQuestions: number;
    totalMarks: number;
    durationMinutes: number;
  };

  sections:
    RunnerAttemptSection[];

  sectionResults:
    RunnerSectionResult[];

  topicResults:
    RunnerTopicResult[];
}

export interface SaveRunnerResponseInput {
  selectedOptionId?:
    string | null;
  isMarkedForReview?:
    boolean;
  timeSpentSeconds?:
    number;
}

export interface SubmitRunnerAttemptInput {
  durationSeconds?: number;
  notes?: string;
}
