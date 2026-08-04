export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export type NoteStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "TRASHED";

export type NoteContentFormat =
  | "PLAIN_TEXT"
  | "MARKDOWN";

export type NoteSourceType =
  | "MANUAL"
  | "AI_GENERATED"
  | "VOICE_TRANSCRIPT"
  | "IMPORTED";

export interface NoteFolder {
  id: string;
  studentProfileId: string;
  parentFolderId: string | null;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sequenceNumber: number;
  isExpanded: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    notes: number;
    childFolders: number;
  };
}

export interface NoteTag {
  id: string;
  studentProfileId: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteAcademicRef {
  id: string;
  code: string;
  name: string;
}

export interface NoteLinkSummary {
  id: string;
  label: string | null;
  createdAt: string;
  targetNote?: {
    id: string;
    title: string;
    status: NoteStatus;
    updatedAt: string;
  };
  sourceNote?: {
    id: string;
    title: string;
    status: NoteStatus;
    updatedAt: string;
  };
}

export interface NoteRecord {
  id: string;
  studentProfileId: string;
  folderId: string | null;
  subjectId: string | null;
  chapterId: string | null;
  topicId: string | null;
  title: string;
  content: string;
  excerpt: string | null;
  contentFormat: NoteContentFormat;
  sourceType: NoteSourceType;
  status: NoteStatus;
  isPinned: boolean;
  wordCount: number;
  characterCount: number;
  lastOpenedAt: string | null;
  archivedAt: string | null;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  folder: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
  subject: NoteAcademicRef | null;
  chapter: NoteAcademicRef | null;
  topic: NoteAcademicRef | null;
  tags: NoteTag[];
  outgoingLinks: NoteLinkSummary[];
  incomingLinks: NoteLinkSummary[];
}

export interface NoteRevision {
  id: string;
  noteId: string;
  title: string;
  content: string;
  contentFormat: NoteContentFormat;
  wordCount: number;
  characterCount: number;
  createdAt: string;
}

export interface NotesWorkspace {
  studentProfileId: string;
  syllabusVersion: {
    id: string;
    versionCode: string;
    name: string;
    programme: {
      id: string;
      code: string;
      name: string;
    };
    subjects: Array<{
      subject: NoteAcademicRef;
      units: Array<{
        id: string;
        code: string;
        name: string;
        chapters: Array<{
          id: string;
          code: string;
          name: string;
          topics: NoteAcademicRef[];
        }>;
      }>;
    }>;
  } | null;
  filters: {
    status: NoteStatus;
    folderId: string | null;
    subjectId: string | null;
    chapterId: string | null;
    topicId: string | null;
    search: string;
  };
  summary: {
    activeNotes: number;
    archivedNotes: number;
    trashedNotes: number;
    pinnedNotes: number;
    totalWords: number;
    folderCount: number;
    tagCount: number;
  };
  folders: NoteFolder[];
  tags: NoteTag[];
  notes: NoteRecord[];
}

export interface NotesWorkspaceFilters {
  status?: NoteStatus;
  folderId?: string | null;
  subjectId?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  search?: string;
}

export interface CreateNoteInput {
  title?: string;
  content?: string;
  contentFormat?: NoteContentFormat;
  sourceType?: NoteSourceType;
  folderId?: string | null;
  subjectId?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  isPinned?: boolean;
  tagIds?: string[];
}

export interface UpdateNoteInput
  extends CreateNoteInput {}

export interface CreateNoteFolderInput {
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentFolderId?: string | null;
  sequenceNumber?: number;
}
