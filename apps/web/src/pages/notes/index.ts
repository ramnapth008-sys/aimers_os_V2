export {
  NotesPage,
} from "./NotesPage";

export {
  createNote,
  createNoteFolder,
  getNote,
  getNoteRevisions,
  getNotesWorkspace,
  permanentlyDeleteNote,
  restoreNoteRevision,
  updateNote,
  updateNoteStatus,
} from "./notes.service";

export type {
  ApiFetch,
  CreateNoteFolderInput,
  CreateNoteInput,
  NoteAcademicRef,
  NoteContentFormat,
  NoteFolder,
  NoteLinkSummary,
  NoteRecord,
  NoteRevision,
  NotesWorkspace,
  NotesWorkspaceFilters,
  NoteSourceType,
  NoteStatus,
  NoteTag,
  UpdateNoteInput,
} from "./notes.types";
