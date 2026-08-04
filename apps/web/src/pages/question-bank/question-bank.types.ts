export type QuestionDifficulty =
  | "EASY"
  | "MEDIUM"
  | "HARD";

export type QuestionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

export type QuestionType =
  | "SINGLE_CORRECT"
  | "MULTIPLE_CORRECT"
  | "INTEGER"
  | "ASSERTION_REASON";

export type QuestionPracticeSessionStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "ABANDONED";

export type QuestionPracticeItemStatus =
  | "UNANSWERED"
  | "CORRECT"
  | "INCORRECT"
  | "SKIPPED";

export interface QuestionBankSubject {
  id: string;
  code: string;
  name: string;
}

export interface QuestionBankTopic {
  id: string;
  code: string;
  name: string;
  chapterId?: string;
}

export interface QuestionBankChapter {
  id: string;
  code: string;
  name: string;
  topics?: QuestionBankTopic[];
}

export interface QuestionBankUnit {
  id: string;
  code: string;
  name: string;
  chapters: QuestionBankChapter[];
}

export interface QuestionBankSyllabusSubject {
  id: string;
  sequenceNumber: number;
  subjectId: string;
  subject: QuestionBankSubject;
  units: QuestionBankUnit[];
}

export interface QuestionBankSyllabusVersion {
  id: string;
  versionCode: string;
  name: string;
  programme: {
    id: string;
    code: string;
    name: string;
  };
  subjects: QuestionBankSyllabusSubject[];
}

export interface QuestionTag {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
  explanation: string | null;
  sequenceNumber: number;
}

export interface QuestionBankQuestion {
  id: string;
  code: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  stem: string;
  explanation: string | null;
  sourceType: string;
  sourceName: string | null;
  sourceYear: number | null;
  marks: number;
  negativeMarks: number;
  estimatedSeconds: number;
  subject: QuestionBankSubject;
  chapter: QuestionBankChapter | null;
  topic: QuestionBankTopic | null;
  tags: QuestionTag[];
  bookmarked: boolean;
  options: QuestionOption[];
  correctOptionId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionPracticeSessionSummary {
  id: string;
  studentProfileId: string;
  name: string;
  status: QuestionPracticeSessionStatus;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  score: number;
  accuracyPercent: number;
  durationSeconds: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBankWorkspace {
  syllabusVersion: QuestionBankSyllabusVersion;

  summary: {
    totalQuestions: number;
    bookmarkedQuestions: number;
    completedSessionCount: number;
    attemptedQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    totalScore: number;
    totalDurationSeconds: number;
    averageAccuracy: number;
    byDifficulty: Array<{
      difficulty: QuestionDifficulty;
      count: number;
    }>;
  };

  recentSessions: QuestionPracticeSessionSummary[];
}

export interface QuestionPracticeItem {
  id: string;
  sequenceNumber: number;
  status: QuestionPracticeItemStatus;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  awardedMarks: number;
  timeSpentSeconds: number;
  answeredAt: string | null;
  question: QuestionBankQuestion;
}

export interface QuestionPracticeSession
  extends QuestionPracticeSessionSummary {
  items: QuestionPracticeItem[];
}

export interface QuestionListResponse {
  items: QuestionBankQuestion[];

  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface QuestionFilters {
  subjectId: string;
  chapterId: string;
  topicId: string;
  difficulty: "" | QuestionDifficulty;
  search: string;
  bookmarkedOnly: boolean;
}

export interface CreatePracticeSessionInput {
  name?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  difficulty?: QuestionDifficulty;
  bookmarkedOnly?: boolean;
  questionCount: number;
}
