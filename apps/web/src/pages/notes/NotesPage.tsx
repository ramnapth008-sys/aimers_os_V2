import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  Archive,
  Bold,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Heading2,
  History,
  Eye,
  Italic,
  Link2,
  List,
  PencilLine,
  LoaderCircle,
  Pin,
  PinOff,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Tags,
  Trash2,
  Unlink2,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  createNote,
  createNoteFolder,
  createNoteLink,
  createNoteTag,
  deleteNoteLink,
  getNote,
  getNoteRevisions,
  getNotesWorkspace,
  permanentlyDeleteNote,
  restoreNoteRevision,
  updateNote,
  updateNoteStatus,
} from "./notes.service";

import type {
  NoteRecord,
  NoteRevision,
  NotesWorkspace,
  NoteStatus,
} from "./notes.types";

import "./notes.css";

function messageFrom(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "The Notes request failed.";
}

function formatDate(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function countWords(
  content: string,
): number {
  const normalized =
    content.trim();

  return normalized
    ? normalized
        .split(/\s+/u)
        .filter(Boolean)
        .length
    : 0;
}

interface NoteEditorSnapshot {
  title: string;
  content: string;
  folderId: string | null;
  subjectId: string | null;
  chapterId: string | null;
  topicId: string | null;
  tagIds: string[];
  isPinned: boolean;
}

interface LocalNoteDraft
  extends NoteEditorSnapshot {
  noteId: string;
  savedAt: string;
}

type NoteSaveNotice =
  | "idle"
  | "saved"
  | "recovered"
  | "error";

const noteDraftPrefix =
  "aimers:notes:draft:";

function emptyNoteSnapshot(): NoteEditorSnapshot {
  return {
    title: "",
    content: "",
    folderId: null,
    subjectId: null,
    chapterId: null,
    topicId: null,
    tagIds: [],
    isPinned: false,
  };
}

function noteSnapshot(
  note: NoteRecord,
): NoteEditorSnapshot {
  return {
    title: note.title,
    content: note.content,
    folderId: note.folderId,
    subjectId: note.subjectId,
    chapterId: note.chapterId,
    topicId: note.topicId,
    tagIds: note.tags
      .map(
        (
          tag,
        ) => tag.id,
      )
      .sort(),
    isPinned: note.isPinned,
  };
}

function sameTagIds(
  left: string[],
  right: string[],
): boolean {
  return [...left]
    .sort()
    .join("|") ===
    [...right]
      .sort()
      .join("|");
}

function sameSnapshot(
  left: NoteEditorSnapshot,
  right: NoteEditorSnapshot,
): boolean {
  return (
    left.title === right.title &&
    left.content === right.content &&
    left.folderId === right.folderId &&
    left.subjectId === right.subjectId &&
    left.chapterId === right.chapterId &&
    left.topicId === right.topicId &&
    sameTagIds(
      left.tagIds,
      right.tagIds,
    ) &&
    left.isPinned === right.isPinned
  );
}

function noteDraftKey(
  noteId: string,
): string {
  return `${noteDraftPrefix}${noteId}`;
}

function clearLocalNoteDraft(
  noteId: string,
) {
  try {
    window.localStorage.removeItem(
      noteDraftKey(noteId),
    );
  } catch {
    // Local draft storage is optional.
  }
}

function readLocalNoteDraft(
  note: NoteRecord,
): LocalNoteDraft | null {
  try {
    const raw =
      window.localStorage.getItem(
        noteDraftKey(note.id),
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw) as
        Partial<LocalNoteDraft>;

    if (
      parsed.noteId !== note.id ||
      typeof parsed.savedAt !==
        "string" ||
      typeof parsed.title !==
        "string" ||
      typeof parsed.content !==
        "string" ||
      !Array.isArray(
        parsed.tagIds,
      ) ||
      typeof parsed.isPinned !==
        "boolean"
    ) {
      clearLocalNoteDraft(
        note.id,
      );
      return null;
    }

    const draft: LocalNoteDraft = {
      noteId: note.id,
      savedAt: parsed.savedAt,
      title: parsed.title,
      content: parsed.content,
      folderId:
        parsed.folderId ?? null,
      subjectId:
        parsed.subjectId ?? null,
      chapterId:
        parsed.chapterId ?? null,
      topicId:
        parsed.topicId ?? null,
      tagIds: parsed.tagIds
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
            "string",
        )
        .sort(),
      isPinned:
        parsed.isPinned,
    };

    const draftTime =
      new Date(
        draft.savedAt,
      ).getTime();

    const serverTime =
      new Date(
        note.updatedAt,
      ).getTime();

    if (
      !Number.isFinite(
        draftTime,
      ) ||
      draftTime <= serverTime ||
      sameSnapshot(
        draft,
        noteSnapshot(note),
      )
    ) {
      clearLocalNoteDraft(
        note.id,
      );
      return null;
    }

    return draft;
  } catch {
    clearLocalNoteDraft(
      note.id,
    );
    return null;
  }
}

const statusTabs: Array<{
  value: NoteStatus;
  label: string;
}> = [
  {
    value: "ACTIVE",
    label: "All notes",
  },
  {
    value: "ARCHIVED",
    label: "Archive",
  },
  {
    value: "TRASHED",
    label: "Trash",
  },
];

export function NotesPage() {
  const {
    apiFetch,
  } = useAuth();

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  const saveInFlightRef =
    useRef(false);

  const [
    workspace,
    setWorkspace,
  ] =
    useState<NotesWorkspace | null>(
      null,
    );

  const [
    selectedNote,
    setSelectedNote,
  ] =
    useState<NoteRecord | null>(
      null,
    );

  const [
    status,
    setStatus,
  ] =
    useState<NoteStatus>(
      "ACTIVE",
    );

  const [
    selectedFolderId,
    setSelectedFolderId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    content,
    setContent,
  ] =
    useState("");

  const [
    folderId,
    setFolderId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isPinned,
    setIsPinned,
  ] =
    useState(false);

  const [
    subjectId,
    setSubjectId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    chapterId,
    setChapterId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    topicId,
    setTopicId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    selectedTagIds,
    setSelectedTagIds,
  ] =
    useState<string[]>(
      [],
    );

  const [
    tagFormOpen,
    setTagFormOpen,
  ] =
    useState(false);

  const [
    tagName,
    setTagName,
  ] =
    useState("");

  const [
    creatingTag,
    setCreatingTag,
  ] =
    useState(false);

  const [
    linkTargetId,
    setLinkTargetId,
  ] =
    useState("");

  const [
    creatingLink,
    setCreatingLink,
  ] =
    useState(false);

  const [
    deletingLinkId,
    setDeletingLinkId,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    opening,
    setOpening,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    saveNotice,
    setSaveNotice,
  ] =
    useState<NoteSaveNotice>(
      "idle",
    );

  const [
    lastSavedAt,
    setLastSavedAt,
  ] =
    useState<string | null>(
      null,
    );

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    folderFormOpen,
    setFolderFormOpen,
  ] =
    useState(false);

  const [
    folderName,
    setFolderName,
  ] =
    useState("");

  const [
    creatingFolder,
    setCreatingFolder,
  ] =
    useState(false);

  const [
    savedSnapshot,
    setSavedSnapshot,
  ] =
    useState({
      title: "",
      content: "",
      folderId:
        null as string | null,
      subjectId:
        null as string | null,
      chapterId:
        null as string | null,
      topicId:
        null as string | null,
      tagIds:
        [] as string[],
      isPinned: false,
    });

  const [
    editorMode,
    setEditorMode,
  ] =
    useState<
      "write" | "preview"
    >("write");

  const [
    revisions,
    setRevisions,
  ] =
    useState<NoteRevision[]>(
      [],
    );

  const [
    revisionsOpen,
    setRevisionsOpen,
  ] =
    useState(false);

  const [
    loadingRevisions,
    setLoadingRevisions,
  ] =
    useState(false);

  const [
    restoringRevision,
    setRestoringRevision,
  ] =
    useState("");

  const dirty =
    selectedNote !== null &&
    (
      title !==
        savedSnapshot.title ||
      content !==
        savedSnapshot.content ||
      folderId !==
        savedSnapshot.folderId ||
      subjectId !==
        savedSnapshot.subjectId ||
      chapterId !==
        savedSnapshot.chapterId ||
      topicId !==
        savedSnapshot.topicId ||
      [...selectedTagIds]
        .sort()
        .join("|") !==
        savedSnapshot.tagIds
          .join("|") ||
      isPinned !==
        savedSnapshot.isPinned
    );

  const applyNote =
    useCallback(
      (
        note:
          NoteRecord | null,
      ) => {
        setSelectedNote(
          note,
        );

        const serverSnapshot =
          note
            ? noteSnapshot(note)
            : emptyNoteSnapshot();

        const localDraft =
          note
            ? readLocalNoteDraft(
                note,
              )
            : null;

        const next =
          localDraft ??
          serverSnapshot;

        setTitle(
          next.title,
        );
        setContent(
          next.content,
        );
        setFolderId(
          next.folderId,
        );
        setSubjectId(
          next.subjectId,
        );
        setChapterId(
          next.chapterId,
        );
        setTopicId(
          next.topicId,
        );
        setSelectedTagIds(
          next.tagIds,
        );
        setIsPinned(
          next.isPinned,
        );
        setSavedSnapshot(
          serverSnapshot,
        );
        setLastSavedAt(
          note?.updatedAt ??
          null,
        );
        setSaveNotice(
          localDraft
            ? "recovered"
            : "idle",
        );
        setEditorMode(
          "write",
        );
        setRevisions(
          [],
        );
        setRevisionsOpen(
          false,
        );
        setLinkTargetId(
          "",
        );
      },
      [],
    );

  const loadWorkspace =
    useCallback(
      async (
        quiet = false,
      ) => {
        quiet
          ? setRefreshing(
              true,
            )
          : setLoading(
              true,
            );

        setError("");

        try {
          const next =
            await getNotesWorkspace(
              apiFetch,
              {
                status,
                folderId:
                  selectedFolderId,
                search,
              },
            );

          setWorkspace(
            next,
          );

          if (
            selectedNote &&
            !next.notes.some(
              (note) =>
                note.id ===
                selectedNote.id,
            )
          ) {
            applyNote(null);
          }
        } catch (
          requestError
        ) {
          setError(
            messageFrom(
              requestError,
            ),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        apiFetch,
        applyNote,
        search,
        selectedFolderId,
        selectedNote,
        status,
      ],
    );

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            void loadWorkspace();
          },
          search ? 260 : 0,
        );

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    },
    [
      loadWorkspace,
      search,
    ],
  );

  useEffect(
    () => {
      const handler =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            (
              event.metaKey ||
              event.ctrlKey
            ) &&
            event.key
              .toLowerCase() ===
              "s"
          ) {
            event.preventDefault();

            if (
              selectedNote &&
              dirty &&
              !saving
            ) {
              void handleSave();
            }
          }
        };

      window.addEventListener(
        "keydown",
        handler,
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handler,
        );
      };
    },
    [
      dirty,
      saving,
      selectedNote,
      title,
      content,
      folderId,
      subjectId,
      chapterId,
      topicId,
      selectedTagIds,
      isPinned,
    ],
  );

  useEffect(
    () => {
      if (
        !selectedNote ||
        !dirty
      ) {
        if (selectedNote) {
          clearLocalNoteDraft(
            selectedNote.id,
          );
        }
        return;
      }

      const timer =
        window.setTimeout(
          () => {
            const draft:
              LocalNoteDraft = {
              noteId:
                selectedNote.id,
              savedAt:
                new Date()
                  .toISOString(),
              title,
              content,
              folderId,
              subjectId,
              chapterId,
              topicId,
              tagIds:
                [...selectedTagIds]
                  .sort(),
              isPinned,
            };

            try {
              window.localStorage
                .setItem(
                  noteDraftKey(
                    selectedNote.id,
                  ),
                  JSON.stringify(
                    draft,
                  ),
                );
            } catch {
              // Server autosave still works without local storage.
            }
          },
          350,
        );

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    },
    [
      chapterId,
      content,
      dirty,
      folderId,
      isPinned,
      selectedNote,
      selectedTagIds,
      subjectId,
      title,
      topicId,
    ],
  );

  useEffect(
    () => {
      if (
        !selectedNote ||
        !dirty ||
        saving ||
        selectedNote.status ===
          "TRASHED"
      ) {
        return;
      }

      const timer =
        window.setTimeout(
          () => {
            void handleSave(
              "auto",
            );
          },
          4000,
        );

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    },
    [
      chapterId,
      content,
      dirty,
      folderId,
      isPinned,
      saving,
      selectedNote,
      selectedTagIds,
      subjectId,
      title,
      topicId,
    ],
  );

  useEffect(
    () => {
      if (!dirty) {
        return;
      }

      const handler =
        (
          event:
            BeforeUnloadEvent,
        ) => {
          event.preventDefault();
          event.returnValue = "";
        };

      window.addEventListener(
        "beforeunload",
        handler,
      );

      return () => {
        window.removeEventListener(
          "beforeunload",
          handler,
        );
      };
    },
    [dirty],
  );

  const foldersByParent =
    useMemo(
      () => {
        const map =
          new Map<
            string | null,
            NotesWorkspace["folders"]
          >();

        for (
          const folder of
          workspace?.folders ??
          []
        ) {
          const key =
            folder.parentFolderId;

          map.set(
            key,
            [
              ...(
                map.get(
                  key,
                ) ?? []
              ),
              folder,
            ],
          );
        }

        return map;
      },
      [workspace],
    );

  const academicSubjects =
    useMemo(
      () =>
        workspace
          ?.syllabusVersion
          ?.subjects ??
        [],
      [workspace],
    );

  const selectedSubjectNode =
    useMemo(
      () =>
        academicSubjects.find(
          (
            item,
          ) =>
            item.subject.id ===
            subjectId,
        ) ??
        null,
      [
        academicSubjects,
        subjectId,
      ],
    );

  const availableChapters =
    useMemo(
      () =>
        selectedSubjectNode
          ?.units
          .flatMap(
            (
              unit,
            ) =>
              unit.chapters,
          ) ??
        [],
      [selectedSubjectNode],
    );

  const selectedChapterNode =
    useMemo(
      () =>
        availableChapters.find(
          (
            chapter,
          ) =>
            chapter.id ===
            chapterId,
        ) ??
        null,
      [
        availableChapters,
        chapterId,
      ],
    );

  const availableTopics =
    selectedChapterNode
      ?.topics ??
    [];

  const selectedTags =
    useMemo(
      () =>
        (
          workspace
            ?.tags ??
          []
        ).filter(
          (
            tag,
          ) =>
            selectedTagIds.includes(
              tag.id,
            ),
        ),
      [
        selectedTagIds,
        workspace,
      ],
    );

  const availableTags =
    useMemo(
      () =>
        (
          workspace
            ?.tags ??
          []
        ).filter(
          (
            tag,
          ) =>
            !selectedTagIds.includes(
              tag.id,
            ),
        ),
      [
        selectedTagIds,
        workspace,
      ],
    );

  const linkedTargetIds =
    useMemo(
      () =>
        new Set(
          selectedNote
            ?.outgoingLinks
            .map(
              (
                link,
              ) =>
                link.targetNote
                  ?.id,
            )
            .filter(
              (
                id,
              ): id is string =>
                Boolean(id),
            ) ??
          [],
        ),
      [selectedNote],
    );

  const availableLinkTargets =
    useMemo(
      () =>
        (
          workspace
            ?.notes ??
          []
        ).filter(
          (
            note,
          ) =>
            note.status ===
              "ACTIVE" &&
            note.id !==
              selectedNote?.id &&
            !linkedTargetIds.has(
              note.id,
            ),
        ),
      [
        linkedTargetIds,
        selectedNote,
        workspace,
      ],
    );

  const openNote =
    async (
      noteId: string,
    ) => {
      if (
        dirty &&
        !window.confirm(
          "Discard unsaved changes and open another note?",
        )
      ) {
        return;
      }

      setOpening(
        noteId,
      );
      setError("");

      try {
        applyNote(
          await getNote(
            apiFetch,
            noteId,
          ),
        );
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setOpening("");
      }
    };

  const handleCreate =
    async () => {
      setCreating(true);
      setError("");

      try {
        const note =
          await createNote(
            apiFetch,
            {
              folderId:
                selectedFolderId,
              title:
                "Untitled note",
              content: "",
              contentFormat:
                "MARKDOWN",
            },
          );

        setStatus(
          "ACTIVE",
        );
        applyNote(note);
        await loadWorkspace(
          true,
        );
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setCreating(false);
      }
    };

  async function handleSave(
    mode:
      "manual" | "auto" =
      "manual",
  ) {
    if (
      !selectedNote ||
      !dirty ||
      saveInFlightRef.current
    ) {
      return;
    }

    const noteId =
      selectedNote.id;

    const captured = {
      title,
      content,
      folderId,
      subjectId,
      chapterId,
      topicId,
      tagIds:
        [...selectedTagIds]
          .sort(),
      isPinned,
    } satisfies NoteEditorSnapshot;

    saveInFlightRef.current =
      true;
    setSaving(true);
    setError("");

    try {
      const note =
        await updateNote(
          apiFetch,
          noteId,
          {
            title:
              captured.title
                .trim() ||
              "Untitled note",
            content:
              captured.content,
            folderId:
              captured.folderId,
            subjectId:
              captured.subjectId,
            chapterId:
              captured.chapterId,
            topicId:
              captured.topicId,
            tagIds:
              captured.tagIds,
            isPinned:
              captured.isPinned,
            contentFormat:
              "MARKDOWN",
          },
        );

      const serverSnapshot =
        noteSnapshot(note);

      clearLocalNoteDraft(
        noteId,
      );

      setSelectedNote(
        note,
      );

      setTitle(
        (
          current,
        ) =>
          current ===
          captured.title
            ? serverSnapshot
                .title
            : current,
      );

      setContent(
        (
          current,
        ) =>
          current ===
          captured.content
            ? serverSnapshot
                .content
            : current,
      );

      setFolderId(
        (
          current,
        ) =>
          current ===
          captured.folderId
            ? serverSnapshot
                .folderId
            : current,
      );

      setSubjectId(
        (
          current,
        ) =>
          current ===
          captured.subjectId
            ? serverSnapshot
                .subjectId
            : current,
      );

      setChapterId(
        (
          current,
        ) =>
          current ===
          captured.chapterId
            ? serverSnapshot
                .chapterId
            : current,
      );

      setTopicId(
        (
          current,
        ) =>
          current ===
          captured.topicId
            ? serverSnapshot
                .topicId
            : current,
      );

      setSelectedTagIds(
        (
          current,
        ) =>
          sameTagIds(
            current,
            captured.tagIds,
          )
            ? serverSnapshot
                .tagIds
            : current,
      );

      setIsPinned(
        (
          current,
        ) =>
          current ===
          captured.isPinned
            ? serverSnapshot
                .isPinned
            : current,
      );

      setSavedSnapshot(
        serverSnapshot,
      );
      setLastSavedAt(
        note.updatedAt,
      );
      setSaveNotice(
        "saved",
      );

      await loadWorkspace(
        true,
      );
    } catch (
      requestError
    ) {
      setSaveNotice(
        "error",
      );
      setError(
        mode === "auto"
          ? `Autosave failed. Your local draft is safe. ${messageFrom(
              requestError,
            )}`
          : messageFrom(
              requestError,
            ),
      );
    } finally {
      saveInFlightRef.current =
        false;
      setSaving(false);
    }
  }

  const loadRevisions =
    async () => {
      if (!selectedNote) {
        return;
      }

      setLoadingRevisions(
        true,
      );
      setError("");

      try {
        setRevisions(
          await getNoteRevisions(
            apiFetch,
            selectedNote.id,
          ),
        );
        setRevisionsOpen(
          true,
        );
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setLoadingRevisions(
          false,
        );
      }
    };

  const handleRestoreRevision =
    async (
      revisionId: string,
    ) => {
      if (!selectedNote) {
        return;
      }

      if (
        !window.confirm(
          "Restore this revision? The current version will be saved in history first.",
        )
      ) {
        return;
      }

      setRestoringRevision(
        revisionId,
      );
      setError("");

      try {
        const restored =
          await restoreNoteRevision(
            apiFetch,
            selectedNote.id,
            revisionId,
          );

        applyNote(
          restored,
        );

        setRevisions(
          await getNoteRevisions(
            apiFetch,
            restored.id,
          ),
        );

        setRevisionsOpen(
          true,
        );

        await loadWorkspace(
          true,
        );
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setRestoringRevision(
          "",
        );
      }
    };

  const moveStatus =
    async (
      nextStatus:
        NoteStatus,
    ) => {
      if (!selectedNote) {
        return;
      }

      setSaving(true);
      setError("");

      try {
        await updateNoteStatus(
          apiFetch,
          selectedNote.id,
          nextStatus,
        );

        clearLocalNoteDraft(
          selectedNote.id,
        );
        applyNote(null);
        await loadWorkspace(
          true,
        );
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setSaving(false);
      }
    };

  const deleteForever =
    async () => {
      if (
        !selectedNote ||
        selectedNote.status !==
          "TRASHED"
      ) {
        return;
      }

      if (
        !window.confirm(
          "Delete this note permanently? This cannot be undone.",
        )
      ) {
        return;
      }

      setSaving(true);
      setError("");

      try {
        await permanentlyDeleteNote(
          apiFetch,
          selectedNote.id,
        );

        clearLocalNoteDraft(
          selectedNote.id,
        );
        applyNote(null);
        await loadWorkspace(
          true,
        );
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setSaving(false);
      }
    };

  const handleCreateFolder =
    async () => {
      const name =
        folderName.trim();

      if (!name) {
        return;
      }

      setCreatingFolder(
        true,
      );
      setError("");

      try {
        await createNoteFolder(
          apiFetch,
          {
            name,
            parentFolderId:
              selectedFolderId,
          },
        );

        setFolderName("");
        setFolderFormOpen(
          false,
        );

        await loadWorkspace(
          true,
        );
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setCreatingFolder(
          false,
        );
      }
    };

  const handleCreateTag =
    async () => {
      const name =
        tagName.trim();

      if (!name) {
        return;
      }

      setCreatingTag(
        true,
      );
      setError("");

      try {
        const tag =
          await createNoteTag(
            apiFetch,
            {
              name,
            },
          );

        setSelectedTagIds(
          (
            current,
          ) =>
            [
              ...new Set([
                ...current,
                tag.id,
              ]),
            ].sort(),
        );

        setTagName("");
        setTagFormOpen(
          false,
        );

        await loadWorkspace(
          true,
        );
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setCreatingTag(
          false,
        );
      }
    };

  const refreshSelectedNote =
    async () => {
      if (!selectedNote) {
        return;
      }

      applyNote(
        await getNote(
          apiFetch,
          selectedNote.id,
        ),
      );

      await loadWorkspace(
        true,
      );
    };

  const handleCreateLink =
    async () => {
      if (
        !selectedNote ||
        !linkTargetId
      ) {
        return;
      }

      if (dirty) {
        setError(
          "Save the note before changing its connections.",
        );
        return;
      }

      setCreatingLink(
        true,
      );
      setError("");

      try {
        await createNoteLink(
          apiFetch,
          selectedNote.id,
          linkTargetId,
        );

        setLinkTargetId(
          "",
        );

        await refreshSelectedNote();
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setCreatingLink(
          false,
        );
      }
    };

  const handleDeleteLink =
    async (
      linkId: string,
    ) => {
      if (!selectedNote) {
        return;
      }

      if (dirty) {
        setError(
          "Save the note before changing its connections.",
        );
        return;
      }

      setDeletingLinkId(
        linkId,
      );
      setError("");

      try {
        await deleteNoteLink(
          apiFetch,
          selectedNote.id,
          linkId,
        );

        await refreshSelectedNote();
      } catch (
        requestError
      ) {
        setError(
          messageFrom(
            requestError,
          ),
        );
      } finally {
        setDeletingLinkId(
          "",
        );
      }
    };

  const insertMarkdown =
    (
      before: string,
      after = "",
      placeholder =
        "text",
    ) => {
      const textarea =
        textareaRef.current;

      if (!textarea) {
        return;
      }

      const start =
        textarea.selectionStart;
      const end =
        textarea.selectionEnd;

      const selection =
        content.slice(
          start,
          end,
        ) || placeholder;

      const next =
        content.slice(
          0,
          start,
        ) +
        before +
        selection +
        after +
        content.slice(
          end,
        );

      setContent(next);

      window.requestAnimationFrame(
        () => {
          textarea.focus();

          textarea.setSelectionRange(
            start +
              before.length,
            start +
              before.length +
              selection.length,
          );
        },
      );
    };

  const renderFolderTree =
    (
      parentId:
        string | null,
      depth = 0,
    ): React.ReactNode =>
      (
        foldersByParent.get(
          parentId,
        ) ?? []
      ).map(
        (
          folder,
        ) => (
          <div
            key={folder.id}
          >
            <button
              type="button"
              className={
                selectedFolderId ===
                folder.id
                  ? "active"
                  : ""
              }
              style={{
                paddingLeft:
                  `${18 + depth * 14}px`,
              }}
              onClick={() => {
                setSelectedFolderId(
                  folder.id,
                );
                applyNote(null);
              }}
            >
              {selectedFolderId ===
              folder.id ? (
                <FolderOpen
                  size={15}
                />
              ) : (
                <Folder
                  size={15}
                />
              )}

              <span>
                {folder.name}
              </span>

              <b>
                {
                  folder._count
                    .notes
                }
              </b>
            </button>

            {renderFolderTree(
              folder.id,
              depth + 1,
            )}
          </div>
        ),
      );

  if (loading && !workspace) {
    return (
      <div className="notes-page notes-state-page">
        <section className="notes-state-card">
          <LoaderCircle
            className="notes-spin"
            size={36}
          />

          <h1>
            Opening your knowledge
            workspace
          </h1>

          <p>
            Loading notes, folders and
            academic connections…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="notes-page notes-state-page">
        <section className="notes-state-card error">
          <AlertTriangle
            size={36}
          />

          <h1>
            Notes unavailable
          </h1>

          <p>
            {error ||
              "The Notes workspace could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => {
              void loadWorkspace();
            }}
          >
            <RefreshCw
              size={16}
            />
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="notes-page">
      <header className="notes-hero">
        <div>
          <span>
            <Sparkles
              size={14}
            />
            KNOWLEDGE WORKSPACE
          </span>

          <h1>
            Notes that stay connected
            to your learning.
          </h1>

          <p>
            Write in Markdown, organise
            by folders, pin important
            ideas and connect every note
            to your academic syllabus.
          </p>
        </div>

        <button
          type="button"
          disabled={creating}
          onClick={() => {
            void handleCreate();
          }}
        >
          {creating ? (
            <LoaderCircle
              className="notes-spin"
              size={17}
            />
          ) : (
            <FilePlus2
              size={17}
            />
          )}
          New note
        </button>
      </header>

      {error && (
        <div className="notes-inline-error">
          <AlertTriangle
            size={16}
          />
          {error}

          <button
            type="button"
            onClick={() => {
              setError("");
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <section className="notes-metrics">
        <article>
          <FileText
            size={18}
          />
          <span>
            Active notes
          </span>
          <strong>
            {
              workspace.summary
                .activeNotes
            }
          </strong>
        </article>

        <article>
          <Pin
            size={18}
          />
          <span>
            Pinned
          </span>
          <strong>
            {
              workspace.summary
                .pinnedNotes
            }
          </strong>
        </article>

        <article>
          <BookOpen
            size={18}
          />
          <span>
            Total words
          </span>
          <strong>
            {
              workspace.summary
                .totalWords
            }
          </strong>
        </article>

        <article>
          <Tags
            size={18}
          />
          <span>
            Folders
          </span>
          <strong>
            {
              workspace.summary
                .folderCount
            }
          </strong>
        </article>
      </section>

      <main className="notes-workspace">
        <aside className="notes-nav">
          <div className="notes-status-tabs">
            {statusTabs.map(
              (
                tab,
              ) => {
                const count =
                  tab.value ===
                  "ACTIVE"
                    ? workspace
                        .summary
                        .activeNotes
                    : tab.value ===
                        "ARCHIVED"
                      ? workspace
                          .summary
                          .archivedNotes
                      : workspace
                          .summary
                          .trashedNotes;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    className={
                      status ===
                      tab.value
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setStatus(
                        tab.value,
                      );
                      applyNote(
                        null,
                      );
                    }}
                  >
                    {tab.value ===
                    "ACTIVE" ? (
                      <FileText
                        size={15}
                      />
                    ) : tab.value ===
                      "ARCHIVED" ? (
                      <Archive
                        size={15}
                      />
                    ) : (
                      <Trash2
                        size={15}
                      />
                    )}

                    <span>
                      {tab.label}
                    </span>

                    <b>
                      {count}
                    </b>
                  </button>
                );
              },
            )}
          </div>

          <div className="notes-folder-head">
            <span>
              FOLDERS
            </span>

            <button
              type="button"
              onClick={() => {
                setFolderFormOpen(
                  (
                    value,
                  ) => !value,
                );
              }}
            >
              <FolderPlus
                size={15}
              />
            </button>
          </div>

          {folderFormOpen && (
            <div className="notes-folder-form">
              <input
                value={folderName}
                placeholder="Folder name"
                onChange={(
                  event,
                ) => {
                  setFolderName(
                    event.target
                      .value,
                  );
                }}
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    void handleCreateFolder();
                  }
                }}
              />

              <button
                type="button"
                disabled={
                  creatingFolder ||
                  !folderName.trim()
                }
                onClick={() => {
                  void handleCreateFolder();
                }}
              >
                {creatingFolder ? (
                  <LoaderCircle
                    className="notes-spin"
                    size={14}
                  />
                ) : (
                  <Check
                    size={14}
                  />
                )}
              </button>
            </div>
          )}

          <div className="notes-folder-tree">
            <button
              type="button"
              className={
                selectedFolderId ===
                null
                  ? "active"
                  : ""
              }
              onClick={() => {
                setSelectedFolderId(
                  null,
                );
                applyNote(null);
              }}
            >
              <FolderOpen
                size={15}
              />
              <span>
                All folders
              </span>
              <b>
                {
                  workspace.summary
                    .activeNotes
                }
              </b>
            </button>

            {renderFolderTree(
              null,
            )}
          </div>
        </aside>

        <section className="notes-list-panel">
          <header>
            <div className="notes-search">
              <Search
                size={16}
              />

              <input
                value={search}
                placeholder="Search notes…"
                onChange={(
                  event,
                ) => {
                  setSearch(
                    event.target
                      .value,
                  );
                }}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => {
                void loadWorkspace(
                  true,
                );
              }}
            >
              <RefreshCw
                className={
                  refreshing
                    ? "notes-spin"
                    : ""
                }
                size={16}
              />
            </button>
          </header>

          <div className="notes-list">
            {workspace.notes.length ===
            0 ? (
              <div className="notes-empty-list">
                <FileText
                  size={28}
                />

                <strong>
                  No notes here
                </strong>

                <p>
                  Create a note or
                  change the current
                  filter.
                </p>
              </div>
            ) : (
              workspace.notes.map(
                (
                  note,
                ) => (
                  <button
                    key={note.id}
                    type="button"
                    className={
                      selectedNote?.id ===
                      note.id
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      void openNote(
                        note.id,
                      );
                    }}
                  >
                    <header>
                      <div>
                        {note.isPinned && (
                          <Pin
                            size={12}
                          />
                        )}

                        <strong>
                          {note.title}
                        </strong>
                      </div>

                      {opening ===
                        note.id && (
                        <LoaderCircle
                          className="notes-spin"
                          size={14}
                        />
                      )}
                    </header>

                    <p>
                      {note.excerpt ||
                        "Empty note"}
                    </p>

                    <footer>
                      <span>
                        <Clock3
                          size={11}
                        />
                        {formatDate(
                          note.updatedAt,
                        )}
                      </span>

                      <b>
                        {note.wordCount}
                        {" "}words
                      </b>
                    </footer>
                  </button>
                ),
              )
            )}
          </div>
        </section>

        <section className="notes-editor-panel">
          {!selectedNote ? (
            <div className="notes-editor-empty">
              <div>
                <FileText
                  size={34}
                />
              </div>

              <h2>
                Select a note to begin
              </h2>

              <p>
                Open an existing note
                or create a new one.
              </p>

              <button
                type="button"
                disabled={creating}
                onClick={() => {
                  void handleCreate();
                }}
              >
                <FilePlus2
                  size={16}
                />
                New note
              </button>
            </div>
          ) : (
            <>
              <header className="notes-editor-head">
                <div>
                  <span>
                    {selectedNote
                      .status}
                  </span>

                  <small
                    className={`notes-save-status ${
                      saving
                        ? "saving"
                        : saveNotice
                    }`}
                  >
                    {saving
                      ? "Saving…"
                      : saveNotice ===
                          "error"
                        ? "Autosave failed — local draft kept"
                        : saveNotice ===
                              "recovered" &&
                            dirty
                          ? "Local draft recovered — autosave pending"
                          : dirty
                            ? "Autosave pending"
                            : lastSavedAt
                              ? `Saved ${formatDate(
                                  lastSavedAt,
                                )}`
                              : `Saved ${formatDate(
                                  selectedNote.updatedAt,
                                )}`}
                  </small>
                </div>

                <div>
                  <button
                    type="button"
                    title="Revision history"
                    disabled={
                      loadingRevisions
                    }
                    onClick={() => {
                      void loadRevisions();
                    }}
                  >
                    {loadingRevisions ? (
                      <LoaderCircle
                        className="notes-spin"
                        size={16}
                      />
                    ) : (
                      <History
                        size={16}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    title={
                      isPinned
                        ? "Unpin"
                        : "Pin"
                    }
                    onClick={() => {
                      setIsPinned(
                        (
                          value,
                        ) => !value,
                      );
                    }}
                  >
                    {isPinned ? (
                      <PinOff
                        size={16}
                      />
                    ) : (
                      <Pin
                        size={16}
                      />
                    )}
                  </button>

                  {selectedNote.status ===
                  "ACTIVE" ? (
                    <>
                      <button
                        type="button"
                        title="Archive"
                        disabled={saving}
                        onClick={() => {
                          void moveStatus(
                            "ARCHIVED",
                          );
                        }}
                      >
                        <Archive
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        title="Move to Trash"
                        disabled={saving}
                        onClick={() => {
                          void moveStatus(
                            "TRASHED",
                          );
                        }}
                      >
                        <Trash2
                          size={16}
                        />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      title="Restore"
                      disabled={saving}
                      onClick={() => {
                        void moveStatus(
                          "ACTIVE",
                        );
                      }}
                    >
                      <RotateCcw
                        size={16}
                      />
                    </button>
                  )}

                  {selectedNote.status ===
                    "TRASHED" && (
                    <button
                      type="button"
                      className="danger"
                      title="Delete permanently"
                      disabled={saving}
                      onClick={() => {
                        void deleteForever();
                      }}
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  )}

                  <button
                    type="button"
                    className="save"
                    disabled={
                      saving ||
                      !dirty
                    }
                    onClick={() => {
                      void handleSave();
                    }}
                  >
                    {saving ? (
                      <LoaderCircle
                        className="notes-spin"
                        size={16}
                      />
                    ) : (
                      <Save
                        size={16}
                      />
                    )}
                    Save
                  </button>
                </div>
              </header>

              <div className="notes-editor-meta">
                <input
                  className="notes-title"
                  value={title}
                  placeholder="Untitled note"
                  onChange={(
                    event,
                  ) => {
                    setTitle(
                      event.target
                        .value,
                    );
                  }}
                />

                <div className="notes-editor-academic-grid">
                  <label>
                    <span>
                      Folder
                    </span>

                    <select
                      value={
                        folderId ?? ""
                      }
                      onChange={(
                        event,
                      ) => {
                        setFolderId(
                          event.target
                            .value ||
                            null,
                        );
                      }}
                    >
                      <option value="">
                        No folder
                      </option>

                      {workspace.folders.map(
                        (
                          folder,
                        ) => (
                          <option
                            key={
                              folder.id
                            }
                            value={
                              folder.id
                            }
                          >
                            {
                              folder.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>
                      Subject
                    </span>

                    <select
                      value={
                        subjectId ?? ""
                      }
                      onChange={(
                        event,
                      ) => {
                        setSubjectId(
                          event.target
                            .value ||
                            null,
                        );
                        setChapterId(
                          null,
                        );
                        setTopicId(
                          null,
                        );
                      }}
                    >
                      <option value="">
                        No subject
                      </option>

                      {academicSubjects.map(
                        (
                          item,
                        ) => (
                          <option
                            key={
                              item
                                .subject
                                .id
                            }
                            value={
                              item
                                .subject
                                .id
                            }
                          >
                            {
                              item
                                .subject
                                .name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>
                      Chapter
                    </span>

                    <select
                      value={
                        chapterId ?? ""
                      }
                      disabled={
                        !subjectId
                      }
                      onChange={(
                        event,
                      ) => {
                        setChapterId(
                          event.target
                            .value ||
                            null,
                        );
                        setTopicId(
                          null,
                        );
                      }}
                    >
                      <option value="">
                        No chapter
                      </option>

                      {availableChapters.map(
                        (
                          chapter,
                        ) => (
                          <option
                            key={
                              chapter.id
                            }
                            value={
                              chapter.id
                            }
                          >
                            {
                              chapter.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>
                      Topic
                    </span>

                    <select
                      value={
                        topicId ?? ""
                      }
                      disabled={
                        !chapterId
                      }
                      onChange={(
                        event,
                      ) => {
                        setTopicId(
                          event.target
                            .value ||
                            null,
                        );
                      }}
                    >
                      <option value="">
                        No topic
                      </option>

                      {availableTopics.map(
                        (
                          topic,
                        ) => (
                          <option
                            key={
                              topic.id
                            }
                            value={
                              topic.id
                            }
                          >
                            {
                              topic.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>

                <div className="notes-editor-tags">
                  <div className="notes-editor-tags-head">
                    <span>
                      <Tags
                        size={13}
                      />
                      Tags
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setTagFormOpen(
                          (
                            value,
                          ) => !value,
                        );
                      }}
                    >
                      Add new
                    </button>
                  </div>

                  <div className="notes-editor-tag-controls">
                    {selectedTags.map(
                      (
                        tag,
                      ) => (
                        <span
                          key={
                            tag.id
                          }
                          className="notes-editor-tag-chip"
                        >
                          {tag.name}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTagIds(
                                (
                                  current,
                                ) =>
                                  current.filter(
                                    (
                                      id,
                                    ) =>
                                      id !==
                                      tag.id,
                                  ),
                              );
                            }}
                          >
                            <X
                              size={11}
                            />
                          </button>
                        </span>
                      ),
                    )}

                    {availableTags.length >
                      0 && (
                      <select
                        value=""
                        onChange={(
                          event,
                        ) => {
                          const nextId =
                            event.target
                              .value;

                          if (
                            nextId
                          ) {
                            setSelectedTagIds(
                              (
                                current,
                              ) =>
                                [
                                  ...new Set([
                                    ...current,
                                    nextId,
                                  ]),
                                ].sort(),
                            );
                          }
                        }}
                      >
                        <option value="">
                          Add existing tag…
                        </option>

                        {availableTags.map(
                          (
                            tag,
                          ) => (
                            <option
                              key={
                                tag.id
                              }
                              value={
                                tag.id
                              }
                            >
                              {
                                tag.name
                              }
                            </option>
                          ),
                        )}
                      </select>
                    )}

                    {selectedTags.length ===
                      0 &&
                      availableTags.length ===
                        0 &&
                      !tagFormOpen && (
                        <small>
                          No tags yet
                        </small>
                      )}
                  </div>

                  {tagFormOpen && (
                    <div className="notes-inline-tag-form">
                      <input
                        value={
                          tagName
                        }
                        placeholder="New tag name"
                        onChange={(
                          event,
                        ) => {
                          setTagName(
                            event.target
                              .value,
                          );
                        }}
                        onKeyDown={(
                          event,
                        ) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            event.preventDefault();
                            void handleCreateTag();
                          }
                        }}
                      />

                      <button
                        type="button"
                        disabled={
                          creatingTag ||
                          !tagName.trim()
                        }
                        onClick={() => {
                          void handleCreateTag();
                        }}
                      >
                        {creatingTag ? (
                          <LoaderCircle
                            className="notes-spin"
                            size={13}
                          />
                        ) : (
                          <Check
                            size={13}
                          />
                        )}
                        Create
                      </button>
                    </div>
                  )}
                </div>

                <div className="notes-connections">
                  <header>
                    <span>
                      <Link2
                        size={13}
                      />
                      Connected notes
                    </span>

                    <small>
                      {
                        selectedNote
                          .outgoingLinks
                          .length
                      }
                      {" "}outgoing ·{" "}
                      {
                        selectedNote
                          .incomingLinks
                          .length
                      }
                      {" "}backlinks
                    </small>
                  </header>

                  <div className="notes-link-create">
                    <select
                      value={
                        linkTargetId
                      }
                      disabled={
                        creatingLink ||
                        availableLinkTargets
                          .length ===
                          0
                      }
                      onChange={(
                        event,
                      ) => {
                        setLinkTargetId(
                          event.target
                            .value,
                        );
                      }}
                    >
                      <option value="">
                        {availableLinkTargets
                          .length ===
                        0
                          ? "No visible notes available"
                          : "Connect another visible note…"}
                      </option>

                      {availableLinkTargets.map(
                        (
                          note,
                        ) => (
                          <option
                            key={
                              note.id
                            }
                            value={
                              note.id
                            }
                          >
                            {
                              note.title
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <button
                      type="button"
                      disabled={
                        creatingLink ||
                        !linkTargetId
                      }
                      onClick={() => {
                        void handleCreateLink();
                      }}
                    >
                      {creatingLink ? (
                        <LoaderCircle
                          className="notes-spin"
                          size={13}
                        />
                      ) : (
                        <Link2
                          size={13}
                        />
                      )}
                      Connect
                    </button>
                  </div>

                  <div className="notes-link-groups">
                    <section>
                      <h3>
                        Links from this note
                      </h3>

                      {selectedNote
                        .outgoingLinks
                        .length ===
                      0 ? (
                        <p>
                          No outgoing links.
                        </p>
                      ) : (
                        selectedNote
                          .outgoingLinks
                          .map(
                            (
                              link,
                            ) => (
                              <article
                                key={
                                  link.id
                                }
                              >
                                <button
                                  type="button"
                                  className="notes-link-open"
                                  disabled={
                                    !link
                                      .targetNote
                                  }
                                  onClick={() => {
                                    if (
                                      link
                                        .targetNote
                                    ) {
                                      void openNote(
                                        link
                                          .targetNote
                                          .id,
                                      );
                                    }
                                  }}
                                >
                                  <Link2
                                    size={12}
                                  />

                                  <span>
                                    {link
                                      .targetNote
                                      ?.title ??
                                      "Unavailable note"}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  className="notes-link-remove"
                                  title="Remove connection"
                                  disabled={
                                    deletingLinkId ===
                                    link.id
                                  }
                                  onClick={() => {
                                    void handleDeleteLink(
                                      link.id,
                                    );
                                  }}
                                >
                                  {deletingLinkId ===
                                  link.id ? (
                                    <LoaderCircle
                                      className="notes-spin"
                                      size={12}
                                    />
                                  ) : (
                                    <Unlink2
                                      size={12}
                                    />
                                  )}
                                </button>
                              </article>
                            ),
                          )
                      )}
                    </section>

                    <section>
                      <h3>
                        Backlinks to this note
                      </h3>

                      {selectedNote
                        .incomingLinks
                        .length ===
                      0 ? (
                        <p>
                          No backlinks yet.
                        </p>
                      ) : (
                        selectedNote
                          .incomingLinks
                          .map(
                            (
                              link,
                            ) => (
                              <article
                                key={
                                  link.id
                                }
                              >
                                <button
                                  type="button"
                                  className="notes-link-open"
                                  disabled={
                                    !link
                                      .sourceNote
                                  }
                                  onClick={() => {
                                    if (
                                      link
                                        .sourceNote
                                    ) {
                                      void openNote(
                                        link
                                          .sourceNote
                                          .id,
                                      );
                                    }
                                  }}
                                >
                                  <Link2
                                    size={12}
                                  />

                                  <span>
                                    {link
                                      .sourceNote
                                      ?.title ??
                                      "Unavailable note"}
                                  </span>
                                </button>
                              </article>
                            ),
                          )
                      )}
                    </section>
                  </div>
                </div>
              </div>

              <div className="notes-toolbar">
                <button
                  type="button"
                  title="Heading"
                  onClick={() => {
                    insertMarkdown(
                      "## ",
                      "",
                      "Heading",
                    );
                  }}
                >
                  <Heading2
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  title="Bold"
                  onClick={() => {
                    insertMarkdown(
                      "**",
                      "**",
                      "bold text",
                    );
                  }}
                >
                  <Bold size={16} />
                </button>

                <button
                  type="button"
                  title="Italic"
                  onClick={() => {
                    insertMarkdown(
                      "_",
                      "_",
                      "italic text",
                    );
                  }}
                >
                  <Italic
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  title="List"
                  onClick={() => {
                    insertMarkdown(
                      "- ",
                      "",
                      "list item",
                    );
                  }}
                >
                  <List size={16} />
                </button>

                <button
                  type="button"
                  title="Inline code"
                  onClick={() => {
                    insertMarkdown(
                      "`",
                      "`",
                      "code",
                    );
                  }}
                >
                  <Code2
                    size={16}
                  />
                </button>

                <div className="notes-view-switch">
                  <button
                    type="button"
                    className={
                      editorMode ===
                      "write"
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setEditorMode(
                        "write",
                      );
                    }}
                  >
                    <PencilLine
                      size={14}
                    />
                    Write
                  </button>

                  <button
                    type="button"
                    className={
                      editorMode ===
                      "preview"
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setEditorMode(
                        "preview",
                      );
                    }}
                  >
                    <Eye
                      size={14}
                    />
                    Preview
                  </button>
                </div>
              </div>

              {editorMode ===
              "write" ? (
                <textarea
                  ref={textareaRef}
                  className="notes-editor"
                  value={content}
                  placeholder="Start writing your note…"
                  spellCheck
                  onChange={(
                    event,
                  ) => {
                    setContent(
                      event.target
                        .value,
                    );
                  }}
                />
              ) : (
                <div className="notes-preview">
                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                    ]}
                  >
                    {content ||
                      "*Nothing to preview yet.*"}
                  </ReactMarkdown>
                </div>
              )}

              {revisionsOpen && (
                <aside className="notes-revisions">
                  <header>
                    <div>
                      <History
                        size={17}
                      />

                      <span>
                        REVISION HISTORY
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRevisionsOpen(
                          false,
                        );
                      }}
                    >
                      <X size={15} />
                    </button>
                  </header>

                  <div>
                    {revisions.length ===
                    0 ? (
                      <section className="notes-revisions-empty">
                        <History
                          size={24}
                        />

                        <strong>
                          No previous revisions
                        </strong>

                        <p>
                          A revision is captured
                          before saved content is
                          changed.
                        </p>
                      </section>
                    ) : (
                      revisions.map(
                        (
                          revision,
                        ) => (
                          <article
                            key={
                              revision.id
                            }
                          >
                            <div>
                              <strong>
                                {
                                  revision.title
                                }
                              </strong>

                              <span>
                                {formatDate(
                                  revision.createdAt,
                                )}
                              </span>
                            </div>

                            <p>
                              {revision.content
                                .replace(
                                  /\s+/gu,
                                  " ",
                                )
                                .trim()
                                .slice(
                                  0,
                                  140,
                                ) ||
                                "Empty revision"}
                            </p>

                            <footer>
                              <span>
                                {
                                  revision.wordCount
                                }
                                {" "}words
                              </span>

                              <button
                                type="button"
                                disabled={
                                  restoringRevision ===
                                  revision.id
                                }
                                onClick={() => {
                                  void handleRestoreRevision(
                                    revision.id,
                                  );
                                }}
                              >
                                {restoringRevision ===
                                revision.id ? (
                                  <LoaderCircle
                                    className="notes-spin"
                                    size={13}
                                  />
                                ) : (
                                  <RotateCcw
                                    size={13}
                                  />
                                )}
                                Restore
                              </button>
                            </footer>
                          </article>
                        ),
                      )
                    )}
                  </div>
                </aside>
              )}

              <footer className="notes-editor-footer">
                <span>
                  {
                    countWords(
                      content,
                    )
                  }
                  {" "}words
                </span>

                <span>
                  {
                    content.length
                  }
                  {" "}characters
                </span>

                <span>
                  ⌘/Ctrl + S for an
                  immediate save
                </span>

                <span
                  className={`notes-autosave-indicator ${
                    saving
                      ? "saving"
                      : saveNotice
                  }`}
                >
                  {saving && (
                    <LoaderCircle
                      className="notes-spin"
                      size={11}
                    />
                  )}

                  {saving
                    ? "Saving to AIMERS…"
                    : dirty
                      ? "Autosaves after 4 seconds of inactivity"
                      : saveNotice ===
                          "recovered"
                        ? "Recovered local draft"
                        : saveNotice ===
                            "error"
                          ? "Local recovery copy retained"
                          : "All changes saved"}
                </span>

                <span>
                  Revision history is
                  captured on server save
                </span>
              </footer>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
