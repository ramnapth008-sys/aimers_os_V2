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

        const next = {
          title:
            note?.title ?? "",
          content:
            note?.content ?? "",
          folderId:
            note?.folderId ??
            null,
          isPinned:
            note?.isPinned ??
            false,
        };

        setTitle(
          next.title,
        );
        setContent(
          next.content,
        );
        setFolderId(
          next.folderId,
        );
        setIsPinned(
          next.isPinned,
        );
        setSavedSnapshot(
          next,
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
      isPinned,
    ],
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

  async function handleSave() {
    if (
      !selectedNote ||
      !dirty
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const note =
        await updateNote(
          apiFetch,
          selectedNote.id,
          {
            title:
              title.trim() ||
              "Untitled note",
            content,
            folderId,
            isPinned,
            contentFormat:
              "MARKDOWN",
          },
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

                  <small>
                    {dirty
                      ? "Unsaved changes"
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

                <div>
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

                  {selectedNote
                    .subject && (
                    <span>
                      <BookOpen
                        size={13}
                      />
                      {
                        selectedNote
                          .subject
                          .name
                      }
                      {selectedNote
                        .chapter
                        ? ` / ${selectedNote.chapter.name}`
                        : ""}
                    </span>
                  )}
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
                  ⌘/Ctrl + S to save
                </span>

                <span>
                  Revision history is
                  captured when saved
                </span>
              </footer>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
