import type {
  AcademicChapter,
  AcademicTopic,
  SubjectDefinition,
} from "../subjects/subjects.types";

export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type StudyPlanStatus =
  | "DRAFT"
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED";

export type StudyTaskType =
  | "STUDY"
  | "REVISION"
  | "PRACTICE"
  | "LECTURE"
  | "MOCK_TEST"
  | "OTHER";

export type StudyTaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type StudyTaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type StudySessionStatus =
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export interface StudyPlan {
  id: string;
  studentProfileId: string;
  name: string;
  description: string | null;
  status: StudyPlanStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  tasks?: StudyTask[];
}

export interface StudySession {
  id: string;
  studentProfileId: string;
  studyTaskId: string | null;
  chapterId: string | null;
  topicId: string | null;
  status: StudySessionStatus;
  plannedStartAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  plannedMinutes: number;
  durationMinutes: number;
  focusMinutes: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  studyTask?: StudyTask | null;
  chapter?: AcademicChapter | null;
  topic?: AcademicTopic | null;
}

export interface StudyTask {
  id: string;
  studentProfileId: string;
  studyPlanId: string | null;
  subjectId: string | null;
  chapterId: string | null;
  topicId: string | null;
  title: string;
  description: string | null;
  type: StudyTaskType;
  status: StudyTaskStatus;
  priority: StudyTaskPriority;
  scheduledFor: string | null;
  dueAt: string | null;
  estimatedMinutes: number;
  actualMinutes: number;
  completionPercent: number;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  studyPlan?: StudyPlan | null;
  subject?: SubjectDefinition | null;
  chapter?: AcademicChapter | null;
  topic?: AcademicTopic | null;
  sessions?: StudySession[];
}

export interface PlannerSummary {
  planCount: number;
  taskCount: number;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  plannedMinutes: number;
  completedSessionMinutes: number;
}

export interface PlannerWorkspace {
  plans: StudyPlan[];
  tasks: StudyTask[];
  sessions: StudySession[];
  summary: PlannerSummary;
}

export interface CreateStudyPlanInput {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

export interface CreateStudyTaskInput {
  studyPlanId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  title: string;
  description?: string;
  type?: StudyTaskType;
  priority?: StudyTaskPriority;
  scheduledFor?: string;
  dueAt?: string;
  estimatedMinutes?: number;
}

export interface UpdateStudyTaskInput {
  studyPlanId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  title?: string;
  description?: string;
  type?: StudyTaskType;
  status?: StudyTaskStatus;
  priority?: StudyTaskPriority;
  scheduledFor?: string;
  dueAt?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  completionPercent?: number;
}

export interface CompleteStudySessionInput {
  durationMinutes?: number;
  focusMinutes?: number;
  notes?: string;
}
