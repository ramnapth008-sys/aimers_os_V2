export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type ResearchProjectStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED";

export type ResearchSourceType =
  | "WEB_PAGE"
  | "PDF"
  | "BOOK"
  | "VIDEO"
  | "NOTE"
  | "MANUAL"
  | "OTHER";

export type ResearchSourceStatus =
  | "SAVED"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "ARCHIVED";

export type ResearchMessageRole =
  | "SYSTEM"
  | "USER"
  | "ASSISTANT";

export type ResearchAiProviderName =
  | "mock"
  | "openai";

export type ResearchMindMapNodeType =
  | "ROOT"
  | "QUESTION"
  | "CONCEPT"
  | "EVIDENCE"
  | "SOURCE"
  | "NOTE"
  | "CONCLUSION";

export interface ResearchAcademicRef {
  id: string;
  code: string;
  name: string;
}

export interface ResearchProjectCounts {
  sources: number;
  threads: number;
  mindMapNodes: number;
  mindMapEdges: number;
}

export interface ResearchProjectSummary {
  id: string;
  studentProfileId: string;
  subjectId: string | null;
  chapterId: string | null;
  topicId: string | null;
  title: string;
  description: string | null;
  researchQuestion: string | null;
  status: ResearchProjectStatus;
  color: string | null;
  icon: string | null;
  isPinned: boolean;
  lastOpenedAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subject: ResearchAcademicRef | null;
  chapter: ResearchAcademicRef | null;
  topic: ResearchAcademicRef | null;
  _count: ResearchProjectCounts;
}

export interface ResearchSourceExcerpt {
  id: string;
  researchSourceId: string;
  quote: string;
  note: string | null;
  locator: string | null;
  pageNumber: number | null;
  startOffset: number | null;
  endOffset: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchSourceRecord {
  id: string;
  studentProfileId: string;
  researchProjectId: string;
  sourceNoteId: string | null;
  type: ResearchSourceType;
  status: ResearchSourceStatus;
  title: string;
  url: string | null;
  author: string | null;
  publisher: string | null;
  publishedAt: string | null;
  accessedAt: string | null;
  rawContent: string | null;
  summary: string | null;
  citationText: string | null;
  citationKey: string | null;
  reliabilityScore: number | null;
  isPinned: boolean;
  metadata: Record<string, unknown> | null;
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
  sourceNote?: {
    id: string;
    title: string;
    updatedAt?: string;
  } | null;
  researchProject?: {
    id: string;
    title: string;
    status: ResearchProjectStatus;
  };
  excerpts?: ResearchSourceExcerpt[];
  _count?: {
    citations: number;
    mindMapNodes: number;
  };
}

export interface ResearchCitationRecord {
  id: string;
  researchMessageId: string;
  researchSourceId: string;
  researchSourceExcerptId: string | null;
  label: string | null;
  quote: string | null;
  createdAt: string;
  researchSource: {
    id: string;
    title: string;
    type: ResearchSourceType;
    citationKey: string | null;
    url: string | null;
  };
  researchSourceExcerpt: {
    id: string;
    quote: string;
    locator: string | null;
    pageNumber: number | null;
  } | null;
}

export interface ResearchMessageRecord {
  id: string;
  researchThreadId: string;
  role: ResearchMessageRole;
  content: string;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  createdAt: string;
  citations: ResearchCitationRecord[];
}

export interface ResearchAssistantProviderInfo {
  name: ResearchAiProviderName;
  model: string;
}

export interface ResearchAssistantReplyResult {
  userMessage: ResearchMessageRecord;
  assistantMessage: ResearchMessageRecord;
  provider: ResearchAssistantProviderInfo;
}

export interface ResearchThreadRecord {
  id: string;
  studentProfileId: string;
  researchProjectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ResearchMessageRecord[];
}

export interface ResearchMindMapNodeRecord {
  id: string;
  researchProjectId: string;
  researchSourceId: string | null;
  noteId: string | null;
  type: ResearchMindMapNodeType;
  title: string;
  content: string | null;
  positionX: number;
  positionY: number;
  color: string | null;
  sequenceNumber: number;
  createdAt: string;
  updatedAt: string;
  researchSource: {
    id: string;
    title: string;
    type: ResearchSourceType;
  } | null;
  note: {
    id: string;
    title: string;
    updatedAt: string;
  } | null;
}

export interface ResearchMindMapEdgeRecord {
  id: string;
  researchProjectId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string | null;
  createdAt: string;
}

export interface ResearchProjectWorkspace
  extends ResearchProjectSummary {
  sources: ResearchSourceRecord[];
  threads: ResearchThreadRecord[];
  mindMapNodes: ResearchMindMapNodeRecord[];
  mindMapEdges: ResearchMindMapEdgeRecord[];
}

export interface ResearchWorkspace {
  summary: {
    activeProjects: number;
    completedProjects: number;
    archivedProjects: number;
    totalProjects: number;
    totalSources: number;
    readySources: number;
    totalThreads: number;
    totalNodes: number;
  };
  projects: ResearchProjectSummary[];
  recentSources: ResearchSourceRecord[];
}

export interface ResearchWorkspaceFilters {
  status?: ResearchProjectStatus;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  search?: string;
}

export interface CreateResearchProjectInput {
  title: string;
  description?: string | null;
  researchQuestion?: string | null;
  status?: ResearchProjectStatus;
  subjectId?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  color?: string | null;
  icon?: string | null;
  isPinned?: boolean;
}

export interface UpdateResearchProjectInput
  extends Partial<CreateResearchProjectInput> {}

export interface CreateResearchSourceInput {
  type: ResearchSourceType;
  title: string;
  status?: ResearchSourceStatus;
  sourceNoteId?: string | null;
  url?: string | null;
  author?: string | null;
  publisher?: string | null;
  publishedAt?: string | null;
  accessedAt?: string | null;
  rawContent?: string | null;
  summary?: string | null;
  citationText?: string | null;
  citationKey?: string | null;
  reliabilityScore?: number | null;
  isPinned?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateResearchSourceInput
  extends Partial<CreateResearchSourceInput> {
  processingError?: string | null;
}

export interface ResearchSourceIngestionMetadata {
  version: number;
  fetchedAt: string;
  finalUrl: string;
  contentType: string;
  pageTitle: string | null;
  description: string | null;
  language: string | null;
  wordCount: number;
  characterCount: number;
}

export interface CreateResearchSourceExcerptInput {
  quote: string;
  note?: string | null;
  locator?: string | null;
  pageNumber?: number | null;
  startOffset?: number | null;
  endOffset?: number | null;
}

export interface CreateResearchThreadInput {
  title: string;
}

export interface CreateResearchMessageInput {
  content: string;
}

export interface GenerateResearchAssistantReplyInput {
  content: string;
  researchSourceId?: string | null;
  researchSourceExcerptId?: string | null;
}

export interface CreateResearchCitationInput {
  researchSourceId: string;
  researchSourceExcerptId?: string | null;
  label?: string | null;
  quote?: string | null;
}

export interface CreateResearchMindMapNodeInput {
  title: string;
  type?: ResearchMindMapNodeType;
  content?: string | null;
  researchSourceId?: string | null;
  noteId?: string | null;
  positionX?: number;
  positionY?: number;
  color?: string | null;
  sequenceNumber?: number;
}

export interface UpdateResearchMindMapNodeInput
  extends Partial<CreateResearchMindMapNodeInput> {}

export interface CreateResearchMindMapEdgeInput {
  sourceNodeId: string;
  targetNodeId: string;
  label?: string | null;
}
