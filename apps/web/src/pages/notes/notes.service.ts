import type {
  ApiFetch,
  CreateNoteFolderInput,
  CreateNoteInput,
  CreateNoteTagInput,
  NoteFolder,
  NoteRecord,
  NoteTag,
  NoteRevision,
  NotesWorkspace,
  NotesWorkspaceFilters,
  NoteStatus,
  UpdateNoteInput,
} from "./notes.types";

function workspaceQuery(
  filters: NotesWorkspaceFilters = {},
): string {
  const params =
    new URLSearchParams();

  if (filters.status) {
    params.set(
      "status",
      filters.status,
    );
  }

  if (filters.folderId) {
    params.set(
      "folderId",
      filters.folderId,
    );
  }

  if (filters.subjectId) {
    params.set(
      "subjectId",
      filters.subjectId,
    );
  }

  if (filters.chapterId) {
    params.set(
      "chapterId",
      filters.chapterId,
    );
  }

  if (filters.topicId) {
    params.set(
      "topicId",
      filters.topicId,
    );
  }

  if (filters.search?.trim()) {
    params.set(
      "search",
      filters.search.trim(),
    );
  }

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

export function getNotesWorkspace(
  apiFetch: ApiFetch,
  filters: NotesWorkspaceFilters = {},
): Promise<NotesWorkspace> {
  return apiFetch<NotesWorkspace>(
    `/notes/me${workspaceQuery(filters)}`,
  );
}

export function createNote(
  apiFetch: ApiFetch,
  input: CreateNoteInput = {},
): Promise<NoteRecord> {
  return apiFetch<NoteRecord>(
    "/notes",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getNote(
  apiFetch: ApiFetch,
  noteId: string,
): Promise<NoteRecord> {
  return apiFetch<NoteRecord>(
    `/notes/${noteId}`,
  );
}

export function updateNote(
  apiFetch: ApiFetch,
  noteId: string,
  input: UpdateNoteInput,
): Promise<NoteRecord> {
  return apiFetch<NoteRecord>(
    `/notes/${noteId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function updateNoteStatus(
  apiFetch: ApiFetch,
  noteId: string,
  status: NoteStatus,
): Promise<NoteRecord> {
  return apiFetch<NoteRecord>(
    `/notes/${noteId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    },
  );
}

export function permanentlyDeleteNote(
  apiFetch: ApiFetch,
  noteId: string,
): Promise<{
  deleted: true;
  noteId: string;
}> {
  return apiFetch<{
    deleted: true;
    noteId: string;
  }>(
    `/notes/${noteId}`,
    {
      method: "DELETE",
    },
  );
}

export function createNoteFolder(
  apiFetch: ApiFetch,
  input: CreateNoteFolderInput,
): Promise<NoteFolder> {
  return apiFetch<NoteFolder>(
    "/notes/folders",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function createNoteTag(
  apiFetch: ApiFetch,
  input: CreateNoteTagInput,
): Promise<NoteTag> {
  return apiFetch<NoteTag>(
    "/notes/tags",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getNoteRevisions(
  apiFetch: ApiFetch,
  noteId: string,
): Promise<NoteRevision[]> {
  return apiFetch<NoteRevision[]>(
    `/notes/${noteId}/revisions`,
  );
}

export function restoreNoteRevision(
  apiFetch: ApiFetch,
  noteId: string,
  revisionId: string,
): Promise<NoteRecord> {
  return apiFetch<NoteRecord>(
    `/notes/${noteId}/revisions/${revisionId}/restore`,
    {
      method: "POST",
    },
  );
}
