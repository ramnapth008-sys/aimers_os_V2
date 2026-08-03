export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type LearningProgressState =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED";

export type TopicMasteryLevel =
  | "NOT_ASSESSED"
  | "BEGINNER"
  | "DEVELOPING"
  | "PROFICIENT"
  | "MASTERED";

export interface AcademicBoard {
  id: string;
  code: string;
  name: string;
  country: string;
  status: string;
}

export interface AcademicProgramme {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  board: AcademicBoard | null;
}

export interface AcademicTopic {
  id: string;
  chapterId: string;
  code: string;
  name: string;
  description: string | null;
  sequenceNumber: number;
  estimatedMinutes: number | null;
}

export interface AcademicChapter {
  id: string;
  unitId: string;
  code: string;
  name: string;
  description: string | null;
  sequenceNumber: number;
  estimatedMinutes: number | null;
  topics: AcademicTopic[];
}

export interface AcademicUnit {
  id: string;
  syllabusSubjectId: string;
  code: string;
  name: string;
  description: string | null;
  sequenceNumber: number;
  chapters: AcademicChapter[];
}

export interface SubjectDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
}

export interface AcademicSyllabusSubject {
  id: string;
  syllabusVersionId: string;
  subjectId: string;
  sequenceNumber: number;
  isRequired: boolean;
  weightage: number | null;
  subject: SubjectDefinition;
  units: AcademicUnit[];
}

export interface AcademicSyllabusVersion {
  id: string;
  programmeId: string;
  versionCode: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  status: string;
  programme: AcademicProgramme;
  subjects: AcademicSyllabusSubject[];
}

export interface ChapterProgress {
  id: string;
  studentEnrollmentId: string;
  chapterId: string;
  state: LearningProgressState;
  completionPercent: number;
  revisionCount: number;
  questionAttempts: number;
  correctAnswers: number;
  startedAt: string | null;
  completedAt: string | null;
  lastStudiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicMastery {
  id: string;
  studentEnrollmentId: string;
  topicId: string;
  level: TopicMasteryLevel;
  masteryScore: number;
  confidenceScore: number;
  attempts: number;
  correctAnswers: number;
  lastAssessedAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicWorkspaceSummary {
  subjectCount: number;
  chapterCount: number;
  topicCount: number;
  completedChapters: number;
  masteredTopics: number;
  chapterCompletionPercent: number;
}

export interface AcademicWorkspace {
  id: string;
  studentProfileId: string;
  syllabusVersionId: string;
  status: string;
  isPrimary: boolean;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  syllabusVersion: AcademicSyllabusVersion;
  chapterProgress: ChapterProgress[];
  topicMastery: TopicMastery[];
  summary: AcademicWorkspaceSummary;
}

export interface UpdateChapterProgressInput {
  state?: LearningProgressState;
  completionPercent?: number;
  revisionCount?: number;
  questionAttempts?: number;
  correctAnswers?: number;
}

export interface UpdateTopicMasteryInput {
  level?: TopicMasteryLevel;
  masteryScore?: number;
  confidenceScore?: number;
  attempts?: number;
  correctAnswers?: number;
  nextReviewAt?: string;
}
