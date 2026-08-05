import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  FileText,
  Globe2,
  Library,
  Link2,
  LoaderCircle,
  MessageSquare,
  Network,
  Pin,
  PinOff,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createResearchMindMapEdge,
  createResearchMindMapNode,
  createResearchProject,
  createResearchSource,
  createResearchThread,
  deleteResearchMindMapEdge,
  deleteResearchMindMapNode,
  deleteResearchProject,
  deleteResearchSource,
  getResearchProject,
  getResearchWorkspace,
  generateResearchAssistantReply,
  ingestResearchSource,
  updateResearchMindMapEdge,
  updateResearchMindMapNode,
  updateResearchProject,
  updateResearchSource,
} from "./research-ai.service";

import type {
  ResearchAssistantProviderInfo,
  ResearchMindMapEdgeRecord,
  ResearchMindMapNodeRecord,
  ResearchMindMapNodeType,
  ResearchProjectStatus,
  ResearchProjectWorkspace,
  ResearchSourceRecord,
  ResearchSourceType,
  ResearchThreadRecord,
  ResearchWorkspace,
} from "./research-ai.types";

import "./research-ai.css";

type ValueChangeEvent = {
  target: {
    value: string;
  };
};

type WorkspaceTab =
  | "overview"
  | "sources"
  | "assistant"
  | "mind-map";

/* AIMERS RESEARCH AI — ACTIVE TAB PERSISTENCE V1 */
const researchActiveTabStorageKey =
  "aimers.research-ai.active-tab";

const workspaceTabs:
  readonly WorkspaceTab[] = [
    "overview",
    "sources",
    "assistant",
    "mind-map",
  ];

function storedResearchActiveTab():
  WorkspaceTab {
  if (
    typeof window ===
    "undefined"
  ) {
    return "overview";
  }

  try {
    const stored =
      window.localStorage
        .getItem(
          researchActiveTabStorageKey,
        );

    return workspaceTabs.includes(
      stored as WorkspaceTab,
    )
      ? (
          stored as
            WorkspaceTab
        )
      : "overview";
  } catch {
    return "overview";
  }
}

const projectStatuses: Array<{
  value: ResearchProjectStatus;
  label: string;
}> = [
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "ARCHIVED",
    label: "Archived",
  },
];

const sourceTypes: Array<{
  value: ResearchSourceType;
  label: string;
}> = [
  {
    value: "WEB_PAGE",
    label: "Web page",
  },
  {
    value: "PDF",
    label: "PDF",
  },
  {
    value: "BOOK",
    label: "Book",
  },
  {
    value: "VIDEO",
    label: "Video",
  },
  {
    value: "NOTE",
    label: "AIMERS note",
  },
  {
    value: "MANUAL",
    label: "Manual source",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const nodeTypes: Array<{
  value: ResearchMindMapNodeType;
  label: string;
}> = [
  {
    value: "ROOT",
    label: "Root",
  },
  {
    value: "QUESTION",
    label: "Question",
  },
  {
    value: "CONCEPT",
    label: "Concept",
  },
  {
    value: "EVIDENCE",
    label: "Evidence",
  },
  {
    value: "SOURCE",
    label: "Source",
  },
  {
    value: "NOTE",
    label: "Note",
  },
  {
    value: "CONCLUSION",
    label: "Conclusion",
  },
];

const relationshipPresets = [
  "supports",
  "contradicts",
  "explains",
  "leads to",
  "depends on",
  "is evidence for",
  "challenges",
] as const;

const hiddenMindMapProvenancePrefixes = [
  "Research source ID:",
  "Research excerpt ID:",
] as const;

type ResearchMapNodeConnection = {
  edge:
    ResearchMindMapEdgeRecord;

  direction:
    | "incoming"
    | "outgoing";

  otherNode:
    ResearchMindMapNodeRecord;
};

function isHiddenMindMapProvenanceLine(
  line: string,
): boolean {
  const normalized =
    line.trim();

  return hiddenMindMapProvenancePrefixes.some(
    (prefix) =>
      normalized.startsWith(
        prefix,
      ),
  );
}

function visibleMindMapNodeContent(
  value:
    | string
    | null
    | undefined,
): string {
  return (
    value
      ?.split("\n")
      .filter(
        (line) =>
          !isHiddenMindMapProvenanceLine(
            line,
          ),
      )
      .join("\n")
      .trim() ??
    ""
  );
}

function hiddenMindMapNodeProvenance(
  value:
    | string
    | null
    | undefined,
): string {
  return (
    value
      ?.split("\n")
      .filter(
        isHiddenMindMapProvenanceLine,
      )
      .join("\n")
      .trim() ??
    ""
  );
}

function mergeMindMapNodeContent(
  visibleContent: string,
  hiddenProvenance: string,
): string {
  return [
    visibleContent.trim(),
    hiddenProvenance.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function relationshipTone(
  label:
    | string
    | null
    | undefined,
):
  | "support"
  | "challenge"
  | "explain"
  | "sequence"
  | "neutral" {
  const normalized =
    label
      ?.trim()
      .toLowerCase() ??
    "";

  if (
    normalized.includes(
      "support",
    ) ||
    normalized.includes(
      "evidence",
    ) ||
    normalized.includes(
      "validate",
    )
  ) {
    return "support";
  }

  if (
    normalized.includes(
      "contradict",
    ) ||
    normalized.includes(
      "challenge",
    ) ||
    normalized.includes(
      "weaken",
    )
  ) {
    return "challenge";
  }

  if (
    normalized.includes(
      "explain",
    ) ||
    normalized.includes(
      "cause",
    )
  ) {
    return "explain";
  }

  if (
    normalized.includes(
      "lead",
    ) ||
    normalized.includes(
      "depend",
    ) ||
    normalized.includes(
      "precede",
    )
  ) {
    return "sequence";
  }

  return "neutral";
}

function messageFrom(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "The Research AI request failed.";
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not opened yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

type ResearchAutosaveStatus =
  | "ready"
  | "dirty"
  | "saving"
  | "saved"
  | "error";

type ResearchProjectDraft = {
  id: string;
  title: string;
  researchQuestion: string;
  description: string;
};

function projectDraftFrom(
  project: ResearchProjectWorkspace,
): ResearchProjectDraft {
  return {
    id:
      project.id,
    title:
      project.title,
    researchQuestion:
      project.researchQuestion ?? "",
    description:
      project.description ?? "",
  };
}

function projectDraftSignature(
  draft: ResearchProjectDraft,
): string {
  return JSON.stringify([
    draft.id,
    draft.title,
    draft.researchQuestion,
    draft.description,
  ]);
}

function sourceIcon(
  source: ResearchSourceRecord,
) {
  if (source.type === "WEB_PAGE") {
    return <Globe2 size={17} />;
  }

  if (source.type === "NOTE") {
    return <BookOpen size={17} />;
  }

  return <FileText size={17} />;
}

function ProjectEmpty({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <section className="research-empty-card">
      <div className="research-empty-icon">
        <Brain size={38} />
      </div>

      <span>RESEARCH AI WORKSPACE</span>

      <h2>Build your first evidence map.</h2>

      <p>
        Start with a focused question, collect trustworthy
        sources and connect the ideas that support your conclusion.
      </p>

      <div className="research-empty-steps">
        <article>
          <span>
            <Library size={17} />
          </span>

          <div>
            <strong>Create a project</strong>
            <small>Define the question and scope.</small>
          </div>
        </article>

        <article>
          <span>
            <Globe2 size={17} />
          </span>

          <div>
            <strong>Collect evidence</strong>
            <small>Save sources, excerpts and citations.</small>
          </div>
        </article>

        <article>
          <span>
            <Network size={17} />
          </span>

          <div>
            <strong>Connect ideas</strong>
            <small>Build threads and a knowledge map.</small>
          </div>
        </article>
      </div>

      <button
        type="button"
        onClick={onCreate}
      >
        <Plus size={17} />
        New research project
      </button>
    </section>
  );
}

export function ResearchAIPage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] = useState<ResearchWorkspace | null>(null);

  const [
    project,
    setProject,
  ] = useState<ResearchProjectWorkspace | null>(null);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState<string | null>(null);

  const selectedProjectIdRef =
    useRef<string | null>(
      null,
    );

  const workspaceLoadRequestRef =
    useRef(0);

  const projectLoadRequestRef =
    useRef(0);

  const [
    selectedThreadId,
    setSelectedThreadId,
  ] = useState<string | null>(null);

  const [
    status,
    setStatus,
  ] = useState<ResearchProjectStatus>("ACTIVE");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState<WorkspaceTab>(
    storedResearchActiveTab,
  );

  useEffect(
    () => {
      try {
        window.localStorage
          .setItem(
            researchActiveTabStorageKey,
            activeTab,
          );
      } catch {
        // Storage can be unavailable in restrictive browser modes.
      }
    },
    [activeTab],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    opening,
    setOpening,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    autosaveStatus,
    setAutosaveStatus,
  ] = useState<ResearchAutosaveStatus>("ready");

  const autosaveTimerRef =
    useRef<number | null>(null);

  const autosaveRequestRef =
    useRef(0);

  const lastSavedProjectRef =
    useRef<{
      id: string;
      signature: string;
    } | null>(null);

  const [
    generatingThreadId,
    setGeneratingThreadId,
  ] = useState<string | null>(null);

  const [
    assistantProvider,
    setAssistantProvider,
  ] = useState<ResearchAssistantProviderInfo | null>(null);

  const messageStreamRef =
    useRef<HTMLDivElement | null>(null);

  const generating =
    generatingThreadId !== null;

  const [
    error,
    setError,
  ] = useState("");

  const [
    projectFormOpen,
    setProjectFormOpen,
  ] = useState(false);

  const [
    sourceFormOpen,
    setSourceFormOpen,
  ] = useState(false);

  const [
    threadFormOpen,
    setThreadFormOpen,
  ] = useState(false);

  const [
    nodeFormOpen,
    setNodeFormOpen,
  ] = useState(false);

  const [
    edgeFormOpen,
    setEdgeFormOpen,
  ] = useState(false);

  const [
    editingEdgeId,
    setEditingEdgeId,
  ] = useState<string | null>(
    null,
  );

  const [
    selectedMapNodeId,
    setSelectedMapNodeId,
  ] = useState<string | null>(null);

  const [
    mapNodeEditorTitle,
    setMapNodeEditorTitle,
  ] = useState("");

  const [
    mapNodeEditorContent,
    setMapNodeEditorContent,
  ] = useState("");

  const [
    mapNodeEditorType,
    setMapNodeEditorType,
  ] = useState<ResearchMindMapNodeType>(
    "CONCEPT",
  );

  const [
    projectTitle,
    setProjectTitle,
  ] = useState("");

  const [
    projectQuestion,
    setProjectQuestion,
  ] = useState("");

  const [
    projectDescription,
    setProjectDescription,
  ] = useState("");

  const [
    sourceTitle,
    setSourceTitle,
  ] = useState("");

  const [
    sourceUrl,
    setSourceUrl,
  ] = useState("");

  const [
    sourceSummary,
    setSourceSummary,
  ] = useState("");

  const [
    sourceTypeValue,
    setSourceTypeValue,
  ] = useState<ResearchSourceType>("WEB_PAGE");

  const [
    ingestingSourceId,
    setIngestingSourceId,
  ] = useState<string | null>(null);

  const [
    selectedSourceId,
    setSelectedSourceId,
  ] = useState<string | null>(null);

  const [
    sourceViewerTab,
    setSourceViewerTab,
  ] = useState<
    | "summary"
    | "excerpts"
    | "full-text"
  >("summary");

  const [
    copiedSourceField,
    setCopiedSourceField,
  ] = useState<string | null>(null);

  const [
    evidenceActionKey,
    setEvidenceActionKey,
  ] = useState<string | null>(null);

  const [
    evidenceActionNotice,
    setEvidenceActionNotice,
  ] = useState<string | null>(null);

  const selectedSource =
    useMemo(
      () =>
        project?.sources.find(
          (source) =>
            source.id ===
            selectedSourceId,
        ) ??
        null,
      [
        project,
        selectedSourceId,
      ],
    );

  const selectedSourceWordCount =
    useMemo(
      () => {
        const content =
          selectedSource
            ?.rawContent
            ?.trim();

        if (!content) {
          return 0;
        }

        return content
          .split(/\s+/)
          .filter(Boolean)
          .length;
      },
      [
        selectedSource
          ?.rawContent,
      ],
    );

  const selectedSourceCitationText =
    useMemo(
      () => {
        if (!selectedSource) {
          return "";
        }

        const stored =
          selectedSource
            .citationText
            ?.trim();

        if (stored) {
          return stored;
        }

        return [
          selectedSource.title,
          selectedSource.author,
          selectedSource.publisher,
          selectedSource.accessedAt
            ? `Accessed ${formatDate(
                selectedSource.accessedAt,
              )}`
            : null,
          selectedSource.url,
        ]
          .filter(Boolean)
          .join(". ");
      },
      [
        selectedSource,
      ],
    );

  useEffect(
    () => {
      if (!selectedSource) {
        if (selectedSourceId) {
          setSelectedSourceId(
            null,
          );
        }

        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style
        .overflow = "hidden";

      const closeOnEscape =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setSelectedSourceId(
              null,
            );
          }
        };

      window.addEventListener(
        "keydown",
        closeOnEscape,
      );

      return () => {
        document.body.style
          .overflow =
          previousOverflow;

        window.removeEventListener(
          "keydown",
          closeOnEscape,
        );
      };
    },
    [
      selectedSource,
      selectedSourceId,
    ],
  );

  const [
    threadTitle,
    setThreadTitle,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    nodeTitle,
    setNodeTitle,
  ] = useState("");

  const [
    nodeContent,
    setNodeContent,
  ] = useState("");

  const [
    nodeType,
    setNodeType,
  ] = useState<ResearchMindMapNodeType>("CONCEPT");

  const [
    edgeSourceId,
    setEdgeSourceId,
  ] = useState("");

  const [
    edgeTargetId,
    setEdgeTargetId,
  ] = useState("");

  const [
    edgeLabel,
    setEdgeLabel,
  ] = useState("");

  const selectedMapNode =
    useMemo(
      () =>
        project?.mindMapNodes.find(
          (node) =>
            node.id ===
            selectedMapNodeId,
        ) ??
        null,
      [
        project,
        selectedMapNodeId,
      ],
    );

  const selectedMapNodeConnections =
    useMemo<
      ResearchMapNodeConnection[]
    >(
      () => {
        if (
          !project ||
          !selectedMapNode
        ) {
          return [];
        }

        return project.mindMapEdges
          .reduce<
            ResearchMapNodeConnection[]
          >(
            (
              connections,
              edge,
            ) => {
              if (
                edge.sourceNodeId ===
                selectedMapNode.id
              ) {
                const otherNode =
                  project.mindMapNodes.find(
                    (node) =>
                      node.id ===
                      edge.targetNodeId,
                  );

                if (otherNode) {
                  connections.push({
                    edge,
                    direction:
                      "outgoing",
                    otherNode,
                  });
                }

                return connections;
              }

              if (
                edge.targetNodeId ===
                selectedMapNode.id
              ) {
                const otherNode =
                  project.mindMapNodes.find(
                    (node) =>
                      node.id ===
                      edge.sourceNodeId,
                  );

                if (otherNode) {
                  connections.push({
                    edge,
                    direction:
                      "incoming",
                    otherNode,
                  });
                }
              }

              return connections;
            },
            [],
          );
      },
      [
        project,
        selectedMapNode,
      ],
    );

  useEffect(
    () => {
      if (!selectedMapNode) {
        if (selectedMapNodeId) {
          setSelectedMapNodeId(
            null,
          );
        }

        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style
        .overflow = "hidden";

      const closeOnEscape =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setSelectedMapNodeId(
              null,
            );
          }
        };

      window.addEventListener(
        "keydown",
        closeOnEscape,
      );

      return () => {
        document.body.style
          .overflow =
          previousOverflow;

        window.removeEventListener(
          "keydown",
          closeOnEscape,
        );
      };
    },
    [
      selectedMapNode,
      selectedMapNodeId,
    ],
  );

  const activeThread = useMemo(
    () =>
      project?.threads.find(
        (thread) => thread.id === selectedThreadId,
      ) ??
      project?.threads[0] ??
      null,
    [project, selectedThreadId],
  );

  const persistProjectDraft = useCallback(
    async (
      draft: ResearchProjectDraft,
    ): Promise<boolean> => {
      const signature =
        projectDraftSignature(
          draft,
        );

      const lastSaved =
        lastSavedProjectRef.current;

      if (
        lastSaved?.id === draft.id &&
        lastSaved.signature === signature
      ) {
        setAutosaveStatus(
          "saved",
        );

        return true;
      }

      const requestId =
        autosaveRequestRef.current + 1;

      autosaveRequestRef.current =
        requestId;

      setAutosaveStatus(
        "saving",
      );

      setError("");

      try {
        const updated =
          await updateResearchProject(
            apiFetch,
            draft.id,
            {
              title:
                draft.title.trim() ||
                "Untitled research project",

              researchQuestion:
                draft.researchQuestion.trim() ||
                null,

              description:
                draft.description.trim() ||
                null,
            },
          );

        const updatedDraft =
          projectDraftFrom(
            updated,
          );

        lastSavedProjectRef.current = {
          id:
            updated.id,

          signature:
            projectDraftSignature(
              updatedDraft,
            ),
        };

        if (
          requestId ===
          autosaveRequestRef.current
        ) {
          setProject(
            (current) => {
              if (
                !current ||
                current.id !==
                  updated.id
              ) {
                return current;
              }

              const currentSignature =
                projectDraftSignature(
                  projectDraftFrom(
                    current,
                  ),
                );

              if (
                currentSignature !==
                signature
              ) {
                return current;
              }

              return {
                ...current,
                title:
                  updated.title,
                researchQuestion:
                  updated.researchQuestion,
                description:
                  updated.description,
                updatedAt:
                  updated.updatedAt,
              };
            },
          );

          setWorkspace(
            (current) => {
              if (!current) {
                return current;
              }

              return {
                ...current,

                projects:
                  current.projects.map(
                    (item) =>
                      item.id === updated.id
                        ? {
                            ...item,
                            title:
                              updated.title,
                            description:
                              updated.description,
                            researchQuestion:
                              updated.researchQuestion,
                            updatedAt:
                              updated.updatedAt,
                          }
                        : item,
                  ),
              };
            },
          );

          setAutosaveStatus(
            "saved",
          );
        }

        return true;
      } catch (requestError) {
        if (
          requestId ===
          autosaveRequestRef.current
        ) {
          setAutosaveStatus(
            "error",
          );

          setError(
            messageFrom(
              requestError,
            ),
          );
        }

        return false;
      }
    },
    [apiFetch],
  );

  const flushProjectAutosave = useCallback(
    async (): Promise<boolean> => {
      if (
        autosaveTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          autosaveTimerRef.current,
        );

        autosaveTimerRef.current =
          null;
      }

      if (!project) {
        return true;
      }

      return persistProjectDraft(
        projectDraftFrom(
          project,
        ),
      );
    },
    [
      persistProjectDraft,
      project,
    ],
  );

  useEffect(
    () => {
      if (!project) {
        return;
      }

      const draft =
        projectDraftFrom(
          project,
        );

      const signature =
        projectDraftSignature(
          draft,
        );

      const lastSaved =
        lastSavedProjectRef.current;

      if (
        lastSaved?.id === project.id &&
        lastSaved.signature === signature
      ) {
        return;
      }

      setAutosaveStatus(
        "dirty",
      );

      if (
        autosaveTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          autosaveTimerRef.current,
        );
      }

      autosaveTimerRef.current =
        window.setTimeout(
          () => {
            autosaveTimerRef.current =
              null;

            void persistProjectDraft(
              draft,
            );
          },
          850,
        );

      return () => {
        if (
          autosaveTimerRef.current !==
          null
        ) {
          window.clearTimeout(
            autosaveTimerRef.current,
          );

          autosaveTimerRef.current =
            null;
        }
      };
    },
    [
      persistProjectDraft,
      project?.description,
      project?.id,
      project?.researchQuestion,
      project?.title,
    ],
  );

  useEffect(
    () => {
      const frame =
        window.requestAnimationFrame(
          () => {
            const stream =
              messageStreamRef.current;

            if (stream) {
              stream.scrollTop =
                stream.scrollHeight;
            }
          },
        );

      return () => {
        window.cancelAnimationFrame(
          frame,
        );
      };
    },
    [
      activeThread?.id,
      activeThread?.messages.length,
      generatingThreadId,
    ],
  );

  const loadWorkspace = useCallback(
    async (
      quiet = false,
    ) => {
      const requestId =
        workspaceLoadRequestRef
          .current +
        1;

      workspaceLoadRequestRef.current =
        requestId;

      quiet
        ? setRefreshing(true)
        : setLoading(true);

      setError("");

      try {
        const next =
          await getResearchWorkspace(
            apiFetch,
            {
              status,
              search,
            },
          );

        if (
          requestId !==
          workspaceLoadRequestRef
            .current
        ) {
          return;
        }

        setWorkspace(
          next,
        );

        const currentSelection =
          selectedProjectIdRef
            .current;

        const nextSelection =
          currentSelection &&
          next.projects.some(
            (item) =>
              item.id ===
              currentSelection,
          )
            ? currentSelection
            : next.projects[0]
                ?.id ??
              null;

        selectedProjectIdRef.current =
          nextSelection;

        setSelectedProjectId(
          nextSelection,
        );
      } catch (requestError) {
        if (
          requestId ===
          workspaceLoadRequestRef
            .current
        ) {
          setError(
            messageFrom(
              requestError,
            ),
          );
        }
      } finally {
        if (
          requestId ===
          workspaceLoadRequestRef
            .current
        ) {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      }
    },
    [
      apiFetch,
      search,
      status,
    ],
  );

  const loadProject = useCallback(
    async (
      projectId: string,
      quiet = false,
    ) => {
      const requestId =
        projectLoadRequestRef
          .current +
        1;

      projectLoadRequestRef.current =
        requestId;

      if (!quiet) {
        setOpening(
          true,
        );
      }

      setError("");

      try {
        const next =
          await getResearchProject(
            apiFetch,
            projectId,
          );

        if (
          requestId !==
            projectLoadRequestRef
              .current ||
          selectedProjectIdRef
            .current !==
            projectId
        ) {
          return;
        }

        const nextDraft =
          projectDraftFrom(
            next,
          );

        lastSavedProjectRef.current = {
          id:
            next.id,

          signature:
            projectDraftSignature(
              nextDraft,
            ),
        };

        setAutosaveStatus(
          "saved",
        );

        setProject(
          next,
        );

        setSelectedThreadId(
          (current) =>
            next.threads.some(
              (thread) =>
                thread.id ===
                current,
            )
              ? current
              : next.threads[0]
                  ?.id ??
                null,
        );
      } catch (requestError) {
        if (
          requestId ===
            projectLoadRequestRef
              .current &&
          selectedProjectIdRef
            .current ===
            projectId
        ) {
          setError(
            messageFrom(
              requestError,
            ),
          );

          setProject(
            null,
          );
        }
      } finally {
        if (
          requestId ===
          projectLoadRequestRef
            .current
        ) {
          setOpening(
            false,
          );
        }
      }
    },
    [apiFetch],
  );

  useEffect(
    () => {
      const timer = window.setTimeout(
        () => {
          void loadWorkspace();
        },
        search ? 260 : 0,
      );

      return () => {
        window.clearTimeout(timer);
      };
    },
    [loadWorkspace, search],
  );

  useEffect(
    () => {
      selectedProjectIdRef.current =
        selectedProjectId;

      if (!selectedProjectId) {
        projectLoadRequestRef.current +=
          1;

        setProject(null);
        setAssistantProvider(null);
        lastSavedProjectRef.current =
          null;
        setAutosaveStatus(
          "ready",
        );
        return;
      }

      setAssistantProvider(null);
      void loadProject(selectedProjectId);
    },
    [loadProject, selectedProjectId],
  );

  useEffect(
    () => {
      if (!selectedProjectId) {
        return;
      }

      const frame =
        window.requestAnimationFrame(
          () => {
            const selectedCard =
              document.querySelector<
                HTMLElement
              >(
                `[data-research-project-id="${selectedProjectId}"]`,
              );

            selectedCard
              ?.scrollIntoView({
                block:
                  "nearest",
              });
          },
        );

      return () => {
        window.cancelAnimationFrame(
          frame,
        );
      };
    },
    [
      selectedProjectId,
      workspace?.projects,
    ],
  );

  const refreshAll = async () => {
    const currentProjectId =
      selectedProjectIdRef.current;

    await loadWorkspace(
      true,
    );

    if (
      currentProjectId &&
      selectedProjectIdRef.current ===
        currentProjectId
    ) {
      await loadProject(
        currentProjectId,
        true,
      );
    }
  };

  const handleCreateProject = async () => {
    const title = projectTitle.trim();

    if (!title) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const created = await createResearchProject(
        apiFetch,
        {
          title,
          researchQuestion:
            projectQuestion.trim() || null,
          description:
            projectDescription.trim() || null,
          status: "ACTIVE",
        },
      );

      setProjectFormOpen(false);
      setProjectTitle("");
      setProjectQuestion("");
      setProjectDescription("");
      setStatus("ACTIVE");

      selectedProjectIdRef.current =
        created.id;

      projectLoadRequestRef.current +=
        1;

      setSelectedProjectId(
        created.id,
      );

      setProject(
        created,
      );
      await loadWorkspace(true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProject = async () => {
    if (
      !project ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const saved =
        await flushProjectAutosave();

      if (saved) {
        await loadWorkspace(
          true,
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSelectProject = async (
    nextProjectId: string,
  ) => {
    if (
      nextProjectId ===
      selectedProjectId
    ) {
      return;
    }

    const saved =
      await flushProjectAutosave();

    if (!saved) {
      return;
    }

    selectedProjectIdRef.current =
      nextProjectId;

    projectLoadRequestRef.current +=
      1;

    setSelectedProjectId(
      nextProjectId,
    );
  };

  const handleProjectStatus = async (
    nextStatus: ResearchProjectStatus,
  ) => {
    if (!project) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateResearchProject(
        apiFetch,
        project.id,
        {
          status: nextStatus,
        },
      );

      setProject(
        null,
      );

      selectedProjectIdRef.current =
        null;

      projectLoadRequestRef.current +=
        1;

      setSelectedProjectId(
        null,
      );

      setStatus(
        nextStatus,
      );
      await loadWorkspace(true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProjectPin = async () => {
    if (!project) {
      return;
    }

    setSaving(true);

    try {
      const updated = await updateResearchProject(
        apiFetch,
        project.id,
        {
          isPinned: !project.isPinned,
        },
      );

      setProject(updated);
      await loadWorkspace(true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (
      !project ||
      !window.confirm(
        "Delete this research project and all connected sources, threads and mind-map items?",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await deleteResearchProject(apiFetch, project.id);
      setProject(
        null,
      );

      selectedProjectIdRef.current =
        null;

      projectLoadRequestRef.current +=
        1;

      setSelectedProjectId(
        null,
      );

      await loadWorkspace(
        true,
      );
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const openSourceViewer = (
    source:
      ResearchSourceRecord,
  ) => {
    setCopiedSourceField(
      null,
    );

    setSourceViewerTab(
      source.excerpts?.length
        ? "excerpts"
        : "summary",
    );

    setSelectedSourceId(
      source.id,
    );
  };

  const closeSourceViewer = () => {
    setSelectedSourceId(
      null,
    );

    setCopiedSourceField(
      null,
    );
  };

  const copySourceText = async (
    value: string,
    field: string,
  ) => {
    const normalized =
      value.trim();

    if (!normalized) {
      return;
    }

    try {
      if (
        navigator.clipboard
          ?.writeText
      ) {
        await navigator
          .clipboard
          .writeText(
            normalized,
          );
      } else {
        const textarea =
          document
            .createElement(
              "textarea",
            );

        textarea.value =
          normalized;

        textarea.setAttribute(
          "readonly",
          "",
        );

        textarea.style
          .position =
          "fixed";

        textarea.style
          .opacity =
          "0";

        document.body
          .appendChild(
            textarea,
          );

        textarea.select();

        const copied =
          document.execCommand(
            "copy",
          );

        textarea.remove();

        if (!copied) {
          throw new Error(
            "Copy command failed.",
          );
        }
      }

      setCopiedSourceField(
        field,
      );

      window.setTimeout(
        () => {
          setCopiedSourceField(
            (current) =>
              current === field
                ? null
                : current,
          );
        },
        1800,
      );
    } catch {
      setError(
        "AIMERS could not copy that evidence to the clipboard.",
      );
    }
  };

  const handleAskAssistantFromExcerpt = async (
    source:
      ResearchSourceRecord,
    excerpt:
      NonNullable<
        ResearchSourceRecord["excerpts"]
      >[number],
  ) => {
    if (
      !project ||
      evidenceActionKey ||
      generating ||
      saving
    ) {
      return;
    }

    const actionKey =
      `assistant:${excerpt.id}`;

    const projectId =
      project.id;

    setEvidenceActionKey(
      actionKey,
    );

    setEvidenceActionNotice(
      null,
    );

    setError("");

    try {
      let threadId =
        activeThread?.id ??
        null;

      if (!threadId) {
        const thread =
          await createResearchThread(
            apiFetch,
            projectId,
            {
              title:
                `Evidence review: ${source.title}`
                  .slice(
                    0,
                    240,
                  ),
            },
          );

        threadId =
          thread.id;
      }

      setSelectedThreadId(
        threadId,
      );

      setGeneratingThreadId(
        threadId,
      );

      const prompt = [
        "Analyze the selected evidence passage in relation to the project research question.",
        "Explain what it supports, what it does not establish, and any important limitations or alternative interpretations.",
        "Use the attached source and excerpt provenance. Do not invent evidence.",
      ].join("\n");

      const result =
        await generateResearchAssistantReply(
          apiFetch,
          projectId,
          threadId,
          {
            content:
              prompt,

            researchSourceId:
              source.id,

            researchSourceExcerptId:
              excerpt.id,
          },
        );

      setAssistantProvider(
        result.provider,
      );

      await Promise.all([
        loadProject(
          projectId,
          true,
        ),

        loadWorkspace(
          true,
        ),
      ]);

      setSelectedThreadId(
        threadId,
      );

      setActiveTab(
        "assistant",
      );

      setEvidenceActionNotice(
        "The selected passage was sent to Research AI with its source citation attached.",
      );

      closeSourceViewer();
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setGeneratingThreadId(
        null,
      );

      setEvidenceActionKey(
        null,
      );
    }
  };

  const handleCreateEvidenceNode = async (
    source:
      ResearchSourceRecord,
    excerpt:
      NonNullable<
        ResearchSourceRecord["excerpts"]
      >[number],
  ) => {
    if (
      !project ||
      evidenceActionKey ||
      saving ||
      generating
    ) {
      return;
    }

    const actionKey =
      `node:${excerpt.id}`;

    const projectId =
      project.id;

    setEvidenceActionKey(
      actionKey,
    );

    setEvidenceActionNotice(
      null,
    );

    setError("");

    try {
      const nodeTitle =
        [
          excerpt.locator ||
            "Evidence",

          source.title,
        ]
          .filter(Boolean)
          .join(" · ")
          .slice(
            0,
            240,
          );

      const locator = [
        excerpt.locator,
        excerpt.pageNumber
          ? `Page ${excerpt.pageNumber}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const provenance = [
        excerpt.quote,
        "",
        `Source: ${source.title}`,
        source.url
          ? `URL: ${source.url}`
          : "",
        locator
          ? `Locator: ${locator}`
          : "",
        `Research source ID: ${source.id}`,
        `Research excerpt ID: ${excerpt.id}`,
      ]
        .filter(Boolean)
        .join("\n");

      await createResearchMindMapNode(
        apiFetch,
        projectId,
        {
          title:
            nodeTitle,

          content:
            provenance,

          type:
            "EVIDENCE",

          researchSourceId:
            source.id,

          positionX:
            (
              project.mindMapNodes
                .length %
              3
            ) *
            260,

          positionY:
            Math.floor(
              project.mindMapNodes
                .length /
              3,
            ) *
            170,

          sequenceNumber:
            project.mindMapNodes
              .length,
        },
      );

      await Promise.all([
        loadProject(
          projectId,
          true,
        ),

        loadWorkspace(
          true,
        ),
      ]);

      setActiveTab(
        "mind-map",
      );

      setEvidenceActionNotice(
        "An evidence node was created with the source relation and excerpt provenance.",
      );

      closeSourceViewer();
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setEvidenceActionKey(
        null,
      );
    }
  };

  const handleCreateSource = async () => {
    const title =
      sourceTitle.trim();

    const url =
      sourceUrl.trim();

    if (
      !project ||
      !title ||
      (
        sourceTypeValue ===
          "WEB_PAGE" &&
        !url
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const created =
        await createResearchSource(
          apiFetch,
          project.id,
          {
            type:
              sourceTypeValue,

            title,

            url:
              url ||
              null,

            summary:
              sourceSummary
                .trim() ||
              null,

            status:
              "SAVED",
          },
        );

      if (
        created.type ===
          "WEB_PAGE" &&
        created.url
      ) {
        setIngestingSourceId(
          created.id,
        );

        const ingested =
          await ingestResearchSource(
            apiFetch,
            project.id,
            created.id,
          );

        if (
          ingested.status ===
            "FAILED"
        ) {
          setError(
            ingested.processingError ||
            "The webpage was saved but could not be ingested.",
          );
        }
      }

      setSourceFormOpen(false);
      setSourceTitle("");
      setSourceUrl("");
      setSourceSummary("");
      await refreshAll();
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setSaving(false);
      setIngestingSourceId(
        null,
      );
    }
  };

  const handleIngestSource = async (
    source:
      ResearchSourceRecord,
  ) => {
    if (
      !project ||
      source.type !==
        "WEB_PAGE" ||
      !source.url ||
      ingestingSourceId
    ) {
      return;
    }

    setIngestingSourceId(
      source.id,
    );

    setError("");

    try {
      const ingested =
        await ingestResearchSource(
          apiFetch,
          project.id,
          source.id,
        );

      if (
        ingested.status ===
          "FAILED"
      ) {
        setError(
          ingested.processingError ||
          "The webpage could not be ingested.",
        );
      }

      await refreshAll();
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setIngestingSourceId(
        null,
      );
    }
  };

  const handleToggleSourcePin = async (
    source: ResearchSourceRecord,
  ) => {
    if (!project) {
      return;
    }

    setSaving(true);

    try {
      await updateResearchSource(
        apiFetch,
        project.id,
        source.id,
        {
          isPinned: !source.isPinned,
        },
      );

      await refreshAll();
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSource = async (
    source: ResearchSourceRecord,
  ) => {
    if (
      !project ||
      !window.confirm(
        `Delete source “${source.title}”?`,
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      await deleteResearchSource(
        apiFetch,
        project.id,
        source.id,
      );
      await refreshAll();
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateThread = async () => {
    if (!project || !threadTitle.trim()) {
      return;
    }

    setSaving(true);

    try {
      const thread = await createResearchThread(
        apiFetch,
        project.id,
        {
          title: threadTitle.trim(),
        },
      );

      setThreadTitle("");
      setThreadFormOpen(false);
      setSelectedThreadId(thread.id);
      await loadProject(project.id, true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async () => {
    const content =
      message.trim();

    if (
      !project ||
      !activeThread ||
      !content ||
      generating ||
      saving
    ) {
      return;
    }

    const projectId =
      project.id;

    const threadId =
      activeThread.id;

    setGeneratingThreadId(
      threadId,
    );

    setError("");

    try {
      const result =
        await generateResearchAssistantReply(
          apiFetch,
          projectId,
          threadId,
          {
            content,
          },
        );

      setMessage("");
      setAssistantProvider(
        result.provider,
      );

      setProject(
        (current) => {
          if (
            !current ||
            current.id !== projectId
          ) {
            return current;
          }

          return {
            ...current,

            threads:
              current.threads.map(
                (thread) => {
                  if (
                    thread.id !== threadId
                  ) {
                    return thread;
                  }

                  const existingIds =
                    new Set(
                      thread.messages.map(
                        (item) =>
                          item.id,
                      ),
                    );

                  const additions = [
                    result.userMessage,
                    result.assistantMessage,
                  ].filter(
                    (item) =>
                      !existingIds.has(
                        item.id,
                      ),
                  );

                  return {
                    ...thread,

                    updatedAt:
                      result.assistantMessage
                        .createdAt,

                    messages: [
                      ...thread.messages,
                      ...additions,
                    ],
                  };
                },
              ),
          };
        },
      );

      await loadWorkspace(true);
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setGeneratingThreadId(
        null,
      );
    }
  };

  const openMapNodeDetails = (
    node:
      ResearchMindMapNodeRecord,
  ) => {
    setMapNodeEditorTitle(
      node.title,
    );

    setMapNodeEditorContent(
      visibleMindMapNodeContent(
        node.content,
      ),
    );

    setMapNodeEditorType(
      node.type,
    );

    setSelectedMapNodeId(
      node.id,
    );
  };

  const closeMapNodeDetails = () => {
    setSelectedMapNodeId(
      null,
    );
  };

  const openEdgeBuilder = (
    sourceNodeId = "",
    edge:
      ResearchMindMapEdgeRecord
      | null = null,
  ) => {
    setEditingEdgeId(
      edge?.id ??
      null,
    );

    setEdgeSourceId(
      edge?.sourceNodeId ??
      sourceNodeId,
    );

    setEdgeTargetId(
      edge?.targetNodeId ??
      "",
    );

    setEdgeLabel(
      edge?.label ??
      "supports",
    );

    setEdgeFormOpen(
      true,
    );
  };

  const closeEdgeBuilder = () => {
    setEdgeFormOpen(
      false,
    );

    setEditingEdgeId(
      null,
    );

    setEdgeSourceId(
      "",
    );

    setEdgeTargetId(
      "",
    );

    setEdgeLabel(
      "",
    );
  };

  const openLinkedSourceFromNode = () => {
    if (
      !project ||
      !selectedMapNode
        ?.researchSourceId
    ) {
      return;
    }

    const source =
      project.sources.find(
        (item) =>
          item.id ===
          selectedMapNode
            .researchSourceId,
      );

    if (!source) {
      setError(
        "The source linked to this node is no longer available.",
      );

      return;
    }

    setSelectedMapNodeId(
      null,
    );

    setSourceViewerTab(
      source.excerpts?.length
        ? "excerpts"
        : "summary",
    );

    setSelectedSourceId(
      source.id,
    );
  };

  const handleUpdateNode = async () => {
    if (
      !project ||
      !selectedMapNode ||
      !mapNodeEditorTitle.trim() ||
      saving
    ) {
      return;
    }

    setSaving(
      true,
    );

    setError(
      "",
    );

    try {
      const hiddenProvenance =
        hiddenMindMapNodeProvenance(
          selectedMapNode.content,
        );

      const mergedContent =
        mergeMindMapNodeContent(
          mapNodeEditorContent,
          hiddenProvenance,
        );

      await updateResearchMindMapNode(
        apiFetch,
        project.id,
        selectedMapNode.id,
        {
          title:
            mapNodeEditorTitle.trim(),

          content:
            mergedContent ||
            null,

          type:
            mapNodeEditorType,
        },
      );

      await loadProject(
        project.id,
        true,
      );

      setEvidenceActionNotice(
        "Knowledge node changes were saved.",
      );

      setSelectedMapNodeId(
        null,
      );
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setSaving(
        false,
      );
    }
  };

  const handleMoveNode = async (
    nodeId: string,
    direction:
      | "up"
      | "down",
  ) => {
    if (
      !project ||
      saving
    ) {
      return;
    }

    const currentIndex =
      project.mindMapNodes
        .findIndex(
          (node) =>
            node.id ===
            nodeId,
        );

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >=
        project.mindMapNodes
          .length
    ) {
      return;
    }

    const reordered = [
      ...project.mindMapNodes,
    ];

    [
      reordered[currentIndex],
      reordered[targetIndex],
    ] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];

    setSaving(
      true,
    );

    setError(
      "",
    );

    try {
      await Promise.all(
        reordered.map(
          (
            node,
            index,
          ) =>
            updateResearchMindMapNode(
              apiFetch,
              project.id,
              node.id,
              {
                sequenceNumber:
                  index,

                positionX:
                  (
                    index %
                    3
                  ) *
                  260,

                positionY:
                  Math.floor(
                    index /
                    3,
                  ) *
                  170,
              },
            ),
        ),
      );

      await loadProject(
        project.id,
        true,
      );

      setEvidenceActionNotice(
        direction === "up"
          ? "The knowledge node was moved up."
          : "The knowledge node was moved down.",
      );
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setSaving(
        false,
      );
    }
  };

  const handleCreateNode = async () => {
    if (!project || !nodeTitle.trim()) {
      return;
    }

    setSaving(true);

    try {
      await createResearchMindMapNode(
        apiFetch,
        project.id,
        {
          title: nodeTitle.trim(),
          content: nodeContent.trim() || null,
          type: nodeType,
          positionX:
            (project.mindMapNodes.length % 3) * 260,
          positionY:
            Math.floor(project.mindMapNodes.length / 3) * 170,
          sequenceNumber:
            project.mindMapNodes.length,
        },
      );

      setNodeFormOpen(false);
      setNodeTitle("");
      setNodeContent("");
      await loadProject(project.id, true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNode = async (
    nodeId: string,
  ) => {
    if (!project) {
      return;
    }

    const node =
      project.mindMapNodes.find(
        (item) =>
          item.id === nodeId,
      );

    if (
      !window.confirm(
        `Delete "${node?.title ?? "this node"}" and all of its relationships?`,
      )
    ) {
      return;
    }

    setSaving(
      true,
    );

    setError(
      "",
    );

    try {
      await deleteResearchMindMapNode(
        apiFetch,
        project.id,
        nodeId,
      );

      if (
        selectedMapNodeId ===
        nodeId
      ) {
        setSelectedMapNodeId(
          null,
        );
      }

      await Promise.all([
        loadProject(
          project.id,
          true,
        ),

        loadWorkspace(
          true,
        ),
      ]);

      setEvidenceActionNotice(
        "The knowledge node and its attached relationships were deleted.",
      );
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setSaving(
        false,
      );
    }
  };

  const handleCreateEdge = async () => {
    if (
      !project ||
      !edgeSourceId ||
      !edgeTargetId ||
      edgeSourceId ===
        edgeTargetId
    ) {
      return;
    }

    const relationshipLabel =
      edgeLabel.trim() ||
      "related to";

    setSaving(
      true,
    );

    setError(
      "",
    );

    try {
      const input = {
        sourceNodeId:
          edgeSourceId,

        targetNodeId:
          edgeTargetId,

        label:
          relationshipLabel,
      };

      if (editingEdgeId) {
        await updateResearchMindMapEdge(
          apiFetch,
          project.id,
          editingEdgeId,
          input,
        );
      } else {
        await createResearchMindMapEdge(
          apiFetch,
          project.id,
          input,
        );
      }

      const edited =
        Boolean(
          editingEdgeId,
        );

      closeEdgeBuilder();

      await loadProject(
        project.id,
        true,
      );

      setEvidenceActionNotice(
        edited
          ? `Knowledge relationship "${relationshipLabel}" was updated.`
          : `Knowledge relationship "${relationshipLabel}" was created.`,
      );
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setSaving(
        false,
      );
    }
  };

  const handleDeleteEdge = async (
    edgeId: string,
  ) => {
    if (!project) {
      return;
    }

    setSaving(
      true,
    );

    setError(
      "",
    );

    try {
      await deleteResearchMindMapEdge(
        apiFetch,
        project.id,
        edgeId,
      );

      await loadProject(
        project.id,
        true,
      );

      setEvidenceActionNotice(
        "The knowledge relationship was removed.",
      );
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
        ),
      );
    } finally {
      setSaving(
        false,
      );
    }
  };

  if (loading && !workspace) {
    return (
      <main className="research-state-page">
        <section className="research-state-card">
          <LoaderCircle
            className="research-spin"
            size={30}
          />
          <h1>Opening Research AI</h1>
          <p>
            Loading projects, source library and knowledge maps.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="research-page">
      <section className="research-hero">
        <div className="research-hero-copy">
          <span className="research-eyebrow">
            <Sparkles size={14} />
            RESEARCH AI · EVIDENCE WORKSPACE
          </span>

          <h1>
            Research with evidence.
            <strong>
              {" "}Connect every idea.
            </strong>
          </h1>

          <p>
            Build structured projects, collect sources,
            preserve research conversations and map how
            evidence supports each conclusion.
          </p>

          <div className="research-hero-actions">
            <button
              className="research-primary-button"
              type="button"
              onClick={() => setProjectFormOpen(true)}
            >
              <Plus size={17} />
              New project
            </button>

            <button
              className="research-secondary-button"
              type="button"
              disabled={refreshing}
              onClick={() => void refreshAll()}
            >
              <RefreshCw
                className={refreshing ? "research-spin" : ""}
                size={16}
              />
              Refresh
            </button>
          </div>
        </div>

        <section className="research-hero-status">
          <span>
            <Network size={28} />
          </span>

          <small>KNOWLEDGE NODES</small>

          <strong>
            {workspace?.summary.totalNodes ?? 0}
          </strong>

          <p>
            {workspace?.summary.totalSources ?? 0} sources
            {" · "}
            {workspace?.summary.totalThreads ?? 0} threads
          </p>
        </section>
      </section>

      {error && (
        <section className="research-inline-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={15} />
          </button>
        </section>
      )}

      {evidenceActionNotice && (
        <section
          className="research-evidence-action-notice"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={16} />
          <span>
            {evidenceActionNotice}
          </span>

          <button
            type="button"
            aria-label="Dismiss evidence action message"
            onClick={() =>
              setEvidenceActionNotice(
                null,
              )
            }
          >
            <X size={15} />
          </button>
        </section>
      )}

      <section className="research-metrics">
        <article>
          <Library size={18} />
          <span>PROJECTS</span>
          <strong>{workspace?.summary.totalProjects ?? 0}</strong>
          <small>{workspace?.summary.activeProjects ?? 0} active</small>
        </article>
        <article>
          <Globe2 size={18} />
          <span>SOURCES</span>
          <strong>{workspace?.summary.totalSources ?? 0}</strong>
          <small>{workspace?.summary.readySources ?? 0} ready</small>
        </article>
        <article>
          <MessageSquare size={18} />
          <span>THREADS</span>
          <strong>{workspace?.summary.totalThreads ?? 0}</strong>
          <small>Stored research dialogue</small>
        </article>
        <article>
          <Network size={18} />
          <span>NODES</span>
          <strong>{workspace?.summary.totalNodes ?? 0}</strong>
          <small>Connected concepts</small>
        </article>
      </section>

      <section
        className={
          workspace?.projects.length
            ? "research-shell"
            : "research-shell empty"
        }
      >
        {workspace?.projects.length ? (
          <aside className="research-project-rail">
          <header>
            <div>
              <span>YOUR PROJECTS</span>
              <strong>{workspace?.projects.length ?? 0}</strong>
            </div>
            <button
              type="button"
              aria-label="Create research project"
              onClick={() => setProjectFormOpen(true)}
            >
              <Plus size={16} />
            </button>
          </header>

          <div className="research-status-tabs">
            {projectStatuses.map((item) => (
              <button
                key={item.value}
                type="button"
                className={status === item.value ? "active" : ""}
                onClick={() => {
                  selectedProjectIdRef.current =
                    null;

                  projectLoadRequestRef.current +=
                    1;

                  setStatus(
                    item.value,
                  );

                  setSelectedProjectId(
                    null,
                  );
                }}
              >
                {item.value === "ACTIVE" && <CircleDot size={14} />}
                {item.value === "COMPLETED" && <CheckCircle2 size={14} />}
                {item.value === "ARCHIVED" && <Archive size={14} />}
                {item.label}
              </button>
            ))}
          </div>

          <label className="research-search-box">
            <Search size={15} />
            <input
              value={search}
              placeholder="Search projects"
              onChange={(event: ValueChangeEvent) => setSearch(event.target.value)}
            />
          </label>

          <div className="research-project-list">
            {workspace?.projects.map((item) => (
              <button
                key={item.id}
                type="button"
                data-research-project-id={item.id}
                className={selectedProjectId === item.id ? "active" : ""}
                onClick={() => void handleSelectProject(item.id)}
              >
                <span className="research-project-icon">
                  <Brain size={16} />
                </span>
                <span className="research-project-copy">
                  <strong>{item.title}</strong>
                  <small>
                    {item._count.sources} sources · {item._count.mindMapNodes} nodes
                  </small>
                </span>
                {item.isPinned && <Pin size={13} />}
              </button>
            ))}
          </div>
          </aside>
        ) : null}

        <section className="research-workspace-panel">
          {!workspace?.projects.length ? (
            <ProjectEmpty onCreate={() => setProjectFormOpen(true)} />
          ) : opening || !project ? (
            <div className="research-loading-panel">
              <LoaderCircle
                className="research-spin"
                size={28}
              />
              <span>Opening project workspace</span>
            </div>
          ) : (
            <>
              <header className="research-project-header">
                <div>
                  <span>
                    {project.subject?.name ?? "Independent research"}
                  </span>
                  <textarea
                    className="research-project-title-input"
                    rows={2}
                    value={project.title}
                    aria-label="Research project title"
                    onChange={(event: ValueChangeEvent) =>
                      setProject({
                        ...project,
                        title: event.target.value,
                      })
                    }
                    onBlur={() => void flushProjectAutosave()}
                  />
                  <small>
                    Updated {formatDate(project.updatedAt)}
                  </small>
                </div>

                <div className="research-project-actions">
                  <div
                    className={`research-autosave-status ${autosaveStatus}`}
                    aria-live="polite"
                    title="Project title, question and context autosave automatically"
                  >
                    {autosaveStatus === "saving" ? (
                      <LoaderCircle
                        className="research-spin"
                        size={14}
                      />
                    ) : autosaveStatus === "saved" ? (
                      <CheckCircle2 size={14} />
                    ) : autosaveStatus === "error" ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <Save size={14} />
                    )}

                    <span>
                      {autosaveStatus === "saving"
                        ? "Saving…"
                        : autosaveStatus === "saved"
                          ? "Saved"
                          : autosaveStatus === "error"
                            ? "Save failed"
                            : autosaveStatus === "dirty"
                              ? "Unsaved changes"
                              : "Autosave ready"}
                    </span>
                  </div>

                  <button
                    type="button"
                    title={project.isPinned ? "Unpin" : "Pin"}
                    onClick={() => void handleToggleProjectPin()}
                  >
                    {project.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                  <button
                    type="button"
                    title="Save now"
                    disabled={
                      saving ||
                      autosaveStatus === "saving"
                    }
                    onClick={() => void handleSaveProject()}
                  >
                    <Save size={16} />
                  </button>
                  <button
                    className="danger"
                    type="button"
                    title="Delete project"
                    onClick={() => void handleDeleteProject()}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </header>

              <nav className="research-workspace-tabs">
                <button
                  type="button"
                  className={activeTab === "overview" ? "active" : ""}
                  onClick={() => setActiveTab("overview")}
                >
                  <Brain size={15} />
                  Overview
                </button>
                <button
                  type="button"
                  className={activeTab === "sources" ? "active" : ""}
                  onClick={() => setActiveTab("sources")}
                >
                  <Library size={15} />
                  Sources
                  <b>{project.sources.length}</b>
                </button>
                <button
                  type="button"
                  className={activeTab === "assistant" ? "active" : ""}
                  onClick={() => setActiveTab("assistant")}
                >
                  <MessageSquare size={15} />
                  Assistant
                  <b>{project.threads.length}</b>
                </button>
                <button
                  type="button"
                  className={activeTab === "mind-map" ? "active" : ""}
                  onClick={() => setActiveTab("mind-map")}
                >
                  <Network size={15} />
                  Mind map
                  <b>{project.mindMapNodes.length}</b>
                </button>
              </nav>

              <div className="research-tab-body">
                {activeTab === "overview" && (
                  <section className="research-overview-grid">
                    <article className="research-question-card">
                      <span>RESEARCH QUESTION</span>
                      <textarea
                        value={project.researchQuestion ?? ""}
                        placeholder="What are you trying to understand or prove?"
                        onChange={(event: ValueChangeEvent) =>
                          setProject({
                            ...project,
                            researchQuestion: event.target.value,
                          })
                        }
                        onBlur={() => void flushProjectAutosave()}
                      />
                    </article>

                    <article className="research-description-card">
                      <span>PROJECT CONTEXT</span>
                      <textarea
                        value={project.description ?? ""}
                        placeholder="Scope, hypothesis, expected outcome and important constraints."
                        onChange={(event: ValueChangeEvent) =>
                          setProject({
                            ...project,
                            description: event.target.value,
                          })
                        }
                        onBlur={() => void flushProjectAutosave()}
                      />
                    </article>

                    <article className="research-progress-card">
                      <span>EVIDENCE SYSTEM</span>
                      <div>
                        <strong>{project.sources.length}</strong>
                        <small>Sources</small>
                      </div>
                      <div>
                        <strong>{project.threads.length}</strong>
                        <small>Threads</small>
                      </div>
                      <div>
                        <strong>{project.mindMapNodes.length}</strong>
                        <small>Nodes</small>
                      </div>
                      <div>
                        <strong>{project.mindMapEdges.length}</strong>
                        <small>Connections</small>
                      </div>
                    </article>

                    <article className="research-lifecycle-card">
                      <span>PROJECT LIFECYCLE</span>
                      <div>
                        {projectStatuses.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={project.status === item.value ? "active" : ""}
                            disabled={saving}
                            onClick={() => void handleProjectStatus(item.value)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <small>
                        Last opened {formatDate(project.lastOpenedAt)}
                      </small>
                    </article>
                  </section>
                )}

                {activeTab === "sources" && (
                  <section className="research-sources-view">
                    <header>
                      <div>
                        <span>SOURCE LIBRARY</span>
                        <h2>Evidence collected for this project</h2>
                      </div>
                      <button
                        className="research-primary-button compact"
                        type="button"
                        onClick={() => setSourceFormOpen(true)}
                      >
                        <Plus size={16} />
                        Add source
                      </button>
                    </header>

                    {!project.sources.length ? (
                      <div className="research-empty-inline">
                        <Globe2 size={28} />
                        <h3>No sources yet</h3>
                        <p>
                          Save a webpage, PDF, book, video or manual reference.
                        </p>
                      </div>
                    ) : (
                      <div className="research-source-grid">
                        {project.sources.map((source) => (
                          <article key={source.id}>
                            <header>
                              <span>{sourceIcon(source)}</span>
                              <div>
                                <small>{source.type.replaceAll("_", " ")}</small>
                                <strong>{source.title}</strong>
                              </div>
                              <button
                                type="button"
                                title={source.isPinned ? "Unpin source" : "Pin source"}
                                onClick={() => void handleToggleSourcePin(source)}
                              >
                                {source.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                              </button>
                            </header>

                            <p
                              className={
                                source.status === "FAILED"
                                  ? "research-source-error"
                                  : ""
                              }
                            >
                              {source.status === "PROCESSING"
                                ? "Extracting readable evidence from this webpage…"
                                : source.status === "FAILED"
                                  ? source.processingError ||
                                    "The webpage could not be ingested."
                                  : source.summary ||
                                    source.author ||
                                    "Saved without extracted content."}
                            </p>

                            <footer>
                              <span className={`research-source-status ${source.status.toLowerCase()}`}>
                                {source.status}
                              </span>
                              <span>
                                {source._count?.citations ?? 0} citations
                              </span>

                              <span>
                                {source.excerpts?.length ?? 0} excerpts
                              </span>

                              <button
                                className="research-source-view-button"
                                type="button"
                                onClick={() =>
                                  openSourceViewer(
                                    source,
                                  )
                                }
                              >
                                <Quote size={13} />
                                View evidence
                              </button>

                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open <ArrowUpRight size={13} />
                                </a>
                              )}

                              {source.type === "WEB_PAGE" &&
                                source.url &&
                                source.status !== "PROCESSING" && (
                                  <button
                                    className="research-source-ingest-button"
                                    type="button"
                                    disabled={ingestingSourceId !== null}
                                    title={
                                      source.status === "FAILED"
                                        ? "Retry webpage ingestion"
                                        : "Refresh extracted webpage evidence"
                                    }
                                    onClick={() =>
                                      void handleIngestSource(
                                        source,
                                      )
                                    }
                                  >
                                    <RefreshCw
                                      className={
                                        ingestingSourceId === source.id
                                          ? "research-spin"
                                          : ""
                                      }
                                      size={13}
                                    />

                                    {source.status === "FAILED"
                                      ? "Retry"
                                      : "Refresh"}
                                  </button>
                                )}

                              <button
                                className="danger"
                                type="button"
                                aria-label="Delete source"
                                onClick={() => void handleDeleteSource(source)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </footer>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {activeTab === "assistant" && (
                  <section className="research-assistant-view">
                    <aside>
                      <header>
                        <span>RESEARCH THREADS</span>
                        <button
                          type="button"
                          aria-label="Create thread"
                          onClick={() => setThreadFormOpen(true)}
                        >
                          <Plus size={15} />
                        </button>
                      </header>

                      <div>
                        {project.threads.map((thread) => (
                          <button
                            key={thread.id}
                            type="button"
                            className={activeThread?.id === thread.id ? "active" : ""}
                            onClick={() => setSelectedThreadId(thread.id)}
                          >
                            <MessageSquare size={14} />
                            <span>
                              <strong>{thread.title}</strong>
                              <small>{thread.messages.length} messages</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </aside>

                    <div className="research-chat-panel">
                      {!activeThread ? (
                        <div className="research-empty-inline">
                          <Bot size={30} />
                          <h3>Create a research thread</h3>
                          <p>
                            Store questions and evidence-backed discussion inside this project.
                          </p>
                          <button
                            className="research-primary-button compact"
                            type="button"
                            onClick={() => setThreadFormOpen(true)}
                          >
                            <Plus size={15} />
                            New thread
                          </button>
                        </div>
                      ) : (
                        <>
                          <header>
                            <div>
                              <span>THREAD</span>
                              <h2>{activeThread.title}</h2>
                            </div>
                            <div
                              className="research-assistant-status"
                              aria-live="polite"
                            >
                              <span className={generating ? "active" : ""}>
                                <i />

                                {generating
                                  ? "Generating evidence-aware reply"
                                  : assistantProvider
                                    ? `${assistantProvider.name.toUpperCase()} · ${assistantProvider.model}`
                                    : "Server assistant ready"}
                              </span>

                              <small>
                                {project.sources.length}
                                {" "}
                                saved source
                                {project.sources.length === 1 ? "" : "s"}
                                {" "}
                                available
                              </small>
                            </div>
                          </header>

                          <div
                            ref={messageStreamRef}
                            className="research-message-stream"
                          >
                            {!activeThread.messages.length && (
                              <div className="research-chat-notice">
                                <Sparkles size={16} />
                                Start by recording your research question or observation.
                              </div>
                            )}

                            {activeThread.messages.map((item) => (
                              <article
                                key={item.id}
                                className={`research-message ${item.role.toLowerCase()}`}
                              >
                                <span>
                                  {item.role === "USER" ? (
                                    <User size={15} />
                                  ) : (
                                    <Bot size={15} />
                                  )}
                                </span>

                                <div>
                                  <small>
                                    {item.role === "ASSISTANT"
                                      ? "AIMERS RESEARCH AI"
                                      : item.role}
                                  </small>

                                  <p>{item.content}</p>

                                  <div className="research-message-meta">
                                    <span>
                                      {formatDate(
                                        item.createdAt,
                                      )}
                                    </span>

                                    {item.model && (
                                      <span>
                                        {item.model}
                                      </span>
                                    )}

                                    {(
                                      typeof item.promptTokens === "number" ||
                                      typeof item.completionTokens === "number"
                                    ) && (
                                      <span>
                                        {(
                                          item.promptTokens ?? 0
                                        ).toLocaleString("en-IN")}
                                        {" + "}
                                        {(
                                          item.completionTokens ?? 0
                                        ).toLocaleString("en-IN")}
                                        {" tokens"}
                                      </span>
                                    )}
                                  </div>

                                  {!!item.citations.length && (
                                    <footer className="research-message-citations">
                                      <Quote size={13} />

                                      <div>
                                        {item.citations.map(
                                          (citation) =>
                                            citation.researchSource.url ? (
                                              <a
                                                key={citation.id}
                                                href={citation.researchSource.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                title={
                                                  citation.quote ||
                                                  citation.researchSource.title
                                                }
                                              >
                                                {citation.label || "Source"}
                                                {" · "}
                                                {citation.researchSource.title}
                                                <ArrowUpRight size={11} />
                                              </a>
                                            ) : (
                                              <span
                                                key={citation.id}
                                                title={
                                                  citation.quote ||
                                                  citation.researchSource.title
                                                }
                                              >
                                                {citation.label || "Source"}
                                                {" · "}
                                                {citation.researchSource.title}
                                              </span>
                                            ),
                                        )}
                                      </div>
                                    </footer>
                                  )}
                                </div>
                              </article>
                            ))}

                            {generatingThreadId === activeThread.id && (
                              <article
                                className="research-message assistant generating"
                                role="status"
                              >
                                <span>
                                  <Bot size={15} />
                                </span>

                                <div>
                                  <small>AIMERS RESEARCH AI</small>

                                  <div className="research-generating-copy">
                                    <LoaderCircle
                                      className="research-spin"
                                      size={15}
                                    />

                                    <span>
                                      Reading project context and saved evidence…
                                    </span>
                                  </div>
                                </div>
                              </article>
                            )}
                          </div>

                          <div className="research-composer">
                            <div className="research-composer-field">
                              <textarea
                                value={message}
                                maxLength={12000}
                                disabled={generating}
                                placeholder="Ask for an evidence-backed explanation, comparison or conclusion…"
                                onChange={(event: ValueChangeEvent) =>
                                  setMessage(
                                    event.target.value,
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" &&
                                    (
                                      event.metaKey ||
                                      event.ctrlKey
                                    )
                                  ) {
                                    event.preventDefault();
                                    void handleSendMessage();
                                  }
                                }}
                              />

                              <footer>
                                <span>
                                  <Sparkles size={12} />
                                  Project, sources and mind map included
                                </span>

                                <small>
                                  ⌘/Ctrl + Enter to send
                                </small>
                              </footer>
                            </div>

                            <button
                              type="button"
                              className={generating ? "generating" : ""}
                              disabled={
                                !message.trim() ||
                                generating ||
                                saving
                              }
                              aria-label={
                                generating
                                  ? "Research AI is generating"
                                  : "Send to Research AI"
                              }
                              title={
                                generating
                                  ? "Generating response"
                                  : "Send message"
                              }
                              onClick={() => void handleSendMessage()}
                            >
                              {generating ? (
                                <LoaderCircle
                                  className="research-spin"
                                  size={16}
                                />
                              ) : (
                                <Send size={16} />
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                )}

                {activeTab === "mind-map" && (
                  <section className="research-map-view">
                    <header>
                      <div>
                        <span>KNOWLEDGE MAP</span>
                        <h2>Connect questions, evidence and conclusions</h2>
                      </div>

                      <div>
                        <button
                          className="research-secondary-button compact"
                          type="button"
                          disabled={project.mindMapNodes.length < 2}
                          onClick={() =>
                            openEdgeBuilder()
                          }
                        >
                          <Link2 size={15} />
                          Connect
                        </button>

                        <button
                          className="research-primary-button compact"
                          type="button"
                          onClick={() =>
                            setNodeFormOpen(
                              true,
                            )
                          }
                        >
                          <Plus size={15} />
                          Add node
                        </button>
                      </div>
                    </header>

                    {!project.mindMapNodes.length ? (
                      <div className="research-empty-inline">
                        <Network size={30} />
                        <h3>Your knowledge map is empty</h3>
                        <p>
                          Add the main question, supporting concepts and evidence nodes.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="research-map-grid">
                          {project.mindMapNodes.map(
                            (
                              node,
                              nodeIndex,
                            ) => {
                              const relationshipCount =
                                project.mindMapEdges.filter(
                                  (edge) =>
                                    edge.sourceNodeId ===
                                      node.id ||
                                    edge.targetNodeId ===
                                      node.id,
                                ).length;

                              const displayContent =
                                visibleMindMapNodeContent(
                                  node.content,
                                );

                              const typeLabel =
                                nodeTypes.find(
                                  (item) =>
                                    item.value ===
                                    node.type,
                                )?.label ??
                                node.type;

                              return (
                                <article
                                  key={node.id}
                                  className="research-map-node-card"
                                  data-node-type={node.type}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`Open ${node.title}`}
                                  onClick={() =>
                                    openMapNodeDetails(
                                      node,
                                    )
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key ===
                                        "Enter" ||
                                      event.key ===
                                        " "
                                    ) {
                                      event.preventDefault();

                                      openMapNodeDetails(
                                        node,
                                      );
                                    }
                                  }}
                                >
                                  <header>
                                    <span>
                                      {typeLabel}
                                    </span>

                                    <div className="research-map-card-actions">
                                      <small>
                                        {relationshipCount}
                                        {" "}
                                        {relationshipCount === 1
                                          ? "link"
                                          : "links"}
                                      </small>

                                      <button
                                        className="move"
                                        type="button"
                                        title="Move node up"
                                        aria-label={`Move ${node.title} up`}
                                        disabled={
                                          saving ||
                                          nodeIndex ===
                                            0
                                        }
                                        onClick={(event) => {
                                          event.stopPropagation();

                                          void handleMoveNode(
                                            node.id,
                                            "up",
                                          );
                                        }}
                                      >
                                        <ChevronUp size={13} />
                                      </button>

                                      <button
                                        className="move"
                                        type="button"
                                        title="Move node down"
                                        aria-label={`Move ${node.title} down`}
                                        disabled={
                                          saving ||
                                          nodeIndex ===
                                            project
                                              .mindMapNodes
                                              .length -
                                              1
                                        }
                                        onClick={(event) => {
                                          event.stopPropagation();

                                          void handleMoveNode(
                                            node.id,
                                            "down",
                                          );
                                        }}
                                      >
                                        <ChevronDown size={13} />
                                      </button>

                                      <button
                                        className="connect"
                                        type="button"
                                        title="Connect from this node"
                                        aria-label={`Connect from ${node.title}`}
                                        disabled={
                                          project.mindMapNodes.length <
                                          2
                                        }
                                        onClick={(event) => {
                                          event.stopPropagation();

                                          openEdgeBuilder(
                                            node.id,
                                          );
                                        }}
                                      >
                                        <Link2 size={13} />
                                      </button>

                                      <button
                                        className="delete"
                                        type="button"
                                        title="Delete node"
                                        aria-label={`Delete ${node.title}`}
                                        disabled={saving}
                                        onClick={(event) => {
                                          event.stopPropagation();

                                          void handleDeleteNode(
                                            node.id,
                                          );
                                        }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </header>

                                  <strong>
                                    {node.title}
                                  </strong>

                                  <p>
                                    {displayContent ||
                                      "No supporting detail."}
                                  </p>

                                  {(node.researchSource ||
                                    node.note) && (
                                    <footer>
                                      <Link2 size={12} />
                                      {node.researchSource
                                        ?.title ??
                                        node.note?.title}
                                    </footer>
                                  )}

                                  <div className="research-map-node-open-hint">
                                    Open details
                                    <ArrowUpRight
                                      size={12}
                                    />
                                  </div>
                                </article>
                              );
                            },
                          )}
                        </div>

                        {!!project.mindMapEdges.length ? (
                          <section className="research-relationship-board">
                            <header>
                              <div>
                                <span>RELATIONSHIPS</span>
                                <small>
                                  How ideas in this project affect one another
                                </small>
                              </div>

                              <strong>
                                {project.mindMapEdges.length}
                              </strong>
                            </header>

                            <div className="research-relationship-list">
                              {project.mindMapEdges.map(
                                (edge) => {
                                  const sourceNode =
                                    project.mindMapNodes.find(
                                      (node) =>
                                        node.id ===
                                        edge.sourceNodeId,
                                    );

                                  const targetNode =
                                    project.mindMapNodes.find(
                                      (node) =>
                                        node.id ===
                                        edge.targetNodeId,
                                    );

                                  const label =
                                    edge.label ||
                                    "related to";

                                  return (
                                    <article
                                      key={edge.id}
                                      data-relation-tone={relationshipTone(
                                        label,
                                      )}
                                    >
                                      <button
                                        className="research-relationship-node"
                                        type="button"
                                        disabled={!sourceNode}
                                        onClick={() => {
                                          if (
                                            sourceNode
                                          ) {
                                            openMapNodeDetails(
                                              sourceNode,
                                            );
                                          }
                                        }}
                                      >
                                        <small>
                                          {sourceNode?.type ??
                                            "NODE"}
                                        </small>

                                        <strong>
                                          {sourceNode?.title ??
                                            "Unknown node"}
                                        </strong>
                                      </button>

                                      <span className="research-relationship-label">
                                        <Link2
                                          size={13}
                                        />
                                        {label}
                                      </span>

                                      <button
                                        className="research-relationship-node"
                                        type="button"
                                        disabled={!targetNode}
                                        onClick={() => {
                                          if (
                                            targetNode
                                          ) {
                                            openMapNodeDetails(
                                              targetNode,
                                            );
                                          }
                                        }}
                                      >
                                        <small>
                                          {targetNode?.type ??
                                            "NODE"}
                                        </small>

                                        <strong>
                                          {targetNode?.title ??
                                            "Unknown node"}
                                        </strong>
                                      </button>

                                      <div className="research-relationship-actions">
                                        <button
                                          className="research-relationship-edit"
                                          type="button"
                                          title="Edit relationship"
                                          aria-label={`Edit ${label} relationship`}
                                          disabled={saving}
                                          onClick={() =>
                                            openEdgeBuilder(
                                              "",
                                              edge,
                                            )
                                          }
                                        >
                                          <Pencil
                                            size={13}
                                          />
                                        </button>

                                        <button
                                          className="research-relationship-delete"
                                          type="button"
                                          title="Delete relationship"
                                          aria-label={`Delete ${label} relationship`}
                                          disabled={saving}
                                          onClick={() =>
                                            void handleDeleteEdge(
                                              edge.id,
                                            )
                                          }
                                        >
                                          <Trash2
                                            size={13}
                                          />
                                        </button>
                                      </div>
                                    </article>
                                  );
                                },
                              )}
                            </div>
                          </section>
                        ) : project.mindMapNodes.length >= 2 ? (
                          <section className="research-relationship-empty">
                            <Link2 size={22} />

                            <div>
                              <strong>
                                No relationships yet
                              </strong>

                              <span>
                                Connect nodes to show what supports, contradicts or explains an idea.
                              </span>
                            </div>

                            <button
                              className="research-secondary-button compact"
                              type="button"
                              onClick={() =>
                                openEdgeBuilder()
                              }
                            >
                              Connect nodes
                            </button>
                          </section>
                        ) : null}
                      </>
                    )}
                  </section>
                )}
              </div>
            </>
          )}
        </section>
      </section>

      {projectFormOpen && (
        <div className="research-modal-backdrop">
          <section className="research-modal">
            <header>
              <div>
                <span>NEW PROJECT</span>
                <h2>Start structured research</h2>
              </div>
              <button
                type="button"
                onClick={() => setProjectFormOpen(false)}
              >
                <X size={17} />
              </button>
            </header>
            <label>
              Project title
              <input
                autoFocus
                value={projectTitle}
                placeholder="Example: Neural control of breathing"
                onChange={(event: ValueChangeEvent) => setProjectTitle(event.target.value)}
              />
            </label>
            <label>
              Research question
              <textarea
                value={projectQuestion}
                placeholder="What exactly do you want to understand?"
                onChange={(event: ValueChangeEvent) => setProjectQuestion(event.target.value)}
              />
            </label>
            <label>
              Context
              <textarea
                value={projectDescription}
                placeholder="Scope, hypothesis or expected output"
                onChange={(event: ValueChangeEvent) => setProjectDescription(event.target.value)}
              />
            </label>
            <footer>
              <button
                className="research-secondary-button"
                type="button"
                onClick={() => setProjectFormOpen(false)}
              >
                Cancel
              </button>
              <button
                className="research-primary-button"
                type="button"
                disabled={!projectTitle.trim() || saving}
                onClick={() => void handleCreateProject()}
              >
                {saving ? <LoaderCircle className="research-spin" size={16} /> : <Plus size={16} />}
                Create project
              </button>
            </footer>
          </section>
        </div>
      )}

      {selectedMapNode && (
        <div
          className="research-map-node-viewer-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeMapNodeDetails();
            }
          }}
        >
          <section
            className="research-map-node-viewer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="research-map-node-viewer-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="research-map-node-viewer-header">
              <div>
                <span>
                  <Network size={18} />
                </span>

                <div>
                  <small>
                    {nodeTypes.find(
                      (item) =>
                        item.value ===
                        selectedMapNode.type,
                    )?.label ??
                      selectedMapNode.type}
                  </small>

                  <h2 id="research-map-node-viewer-title">
                    {selectedMapNode.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                title="Close node details"
                aria-label="Close node details"
                onClick={closeMapNodeDetails}
              >
                <X size={18} />
              </button>
            </header>

            <div className="research-map-node-viewer-meta">
              <span>
                Relationships
                <strong>
                  {selectedMapNodeConnections.length}
                </strong>
              </span>

              <span>
                Linked source
                <strong>
                  {selectedMapNode.researchSource
                    ? "Yes"
                    : "No"}
                </strong>
              </span>

              <span>
                Updated
                <strong>
                  {formatDate(
                    selectedMapNode.updatedAt,
                  )}
                </strong>
              </span>
            </div>

            <div className="research-map-node-viewer-content">
              <section className="research-map-node-editor">
                <header>
                  <div>
                    <span>NODE DETAILS</span>
                    <h3>
                      Edit this knowledge node
                    </h3>
                  </div>

                  <button
                    className="research-secondary-button compact"
                    type="button"
                    disabled={
                      (
                        project
                          ?.mindMapNodes
                          .length ??
                        0
                      ) <
                      2
                    }
                    onClick={() => {
                      const sourceNodeId =
                        selectedMapNode.id;

                      closeMapNodeDetails();

                      openEdgeBuilder(
                        sourceNodeId,
                      );
                    }}
                  >
                    <Link2 size={14} />
                    Connect
                  </button>
                </header>

                <label>
                  Node type
                  <select
                    value={mapNodeEditorType}
                    onChange={(event: ValueChangeEvent) =>
                      setMapNodeEditorType(
                        event.target.value as
                          ResearchMindMapNodeType,
                      )
                    }
                  >
                    {nodeTypes.map(
                      (item) => (
                        <option
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Title
                  <input
                    value={mapNodeEditorTitle}
                    maxLength={240}
                    placeholder="Knowledge node title"
                    onChange={(event: ValueChangeEvent) =>
                      setMapNodeEditorTitle(
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Supporting detail
                  <textarea
                    value={mapNodeEditorContent}
                    placeholder="Explain what this node means and how it contributes to the research."
                    onChange={(event: ValueChangeEvent) =>
                      setMapNodeEditorContent(
                        event.target.value,
                      )
                    }
                  />
                </label>

                {!!hiddenMindMapNodeProvenance(
                  selectedMapNode.content,
                ) && (
                  <small className="research-map-provenance-note">
                    Internal evidence provenance is retained securely when you save and is not shown in this editor.
                  </small>
                )}
              </section>

              {selectedMapNode.researchSource && (
                <section className="research-map-linked-source">
                  <div>
                    <span>LINKED EVIDENCE</span>
                    <h3>
                      {selectedMapNode.researchSource.title}
                    </h3>
                    <small>
                      {selectedMapNode.researchSource.type.replaceAll(
                        "_",
                        " ",
                      )}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={openLinkedSourceFromNode}
                  >
                    Inspect evidence
                    <ArrowUpRight size={14} />
                  </button>
                </section>
              )}

              <section className="research-map-node-connections">
                <header>
                  <div>
                    <span>RELATIONSHIPS</span>
                    <h3>
                      Connected ideas
                    </h3>
                  </div>

                  <strong>
                    {selectedMapNodeConnections.length}
                  </strong>
                </header>

                {!selectedMapNodeConnections.length ? (
                  <div className="research-map-node-connections-empty">
                    <Link2 size={20} />
                    <span>
                      This node has no relationships yet.
                    </span>
                  </div>
                ) : (
                  <div>
                    {selectedMapNodeConnections.map(
                      (connection) => {
                        const label =
                          connection.edge.label ||
                          "related to";

                        return (
                          <article
                            key={connection.edge.id}
                            data-relation-tone={relationshipTone(
                              label,
                            )}
                          >
                            <small>
                              {connection.direction ===
                              "outgoing"
                                ? "THIS NODE →"
                                : "→ THIS NODE"}
                            </small>

                            <span>
                              {label}
                            </span>

                            <button
                              className="research-map-connected-node"
                              type="button"
                              onClick={() =>
                                openMapNodeDetails(
                                  connection.otherNode,
                                )
                              }
                            >
                              {connection.otherNode.title}
                              <ArrowUpRight size={12} />
                            </button>

                            <div className="research-map-connected-actions">
                              <button
                                className="research-map-connected-edit"
                                type="button"
                                title="Edit relationship"
                                aria-label={`Edit ${label} relationship`}
                                disabled={saving}
                                onClick={() => {
                                  const edge =
                                    connection.edge;

                                  closeMapNodeDetails();

                                  openEdgeBuilder(
                                    "",
                                    edge,
                                  );
                                }}
                              >
                                <Pencil size={13} />
                              </button>

                              <button
                                className="research-map-connected-delete"
                                type="button"
                                title="Delete relationship"
                                aria-label={`Delete ${label} relationship`}
                                disabled={saving}
                                onClick={() =>
                                  void handleDeleteEdge(
                                    connection.edge.id,
                                  )
                                }
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                )}
              </section>
            </div>

            <footer className="research-map-node-viewer-footer">
              <button
                className="research-map-node-delete-button"
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleDeleteNode(
                    selectedMapNode.id,
                  )
                }
              >
                <Trash2 size={14} />
                Delete node
              </button>

              <div>
                <button
                  className="research-secondary-button"
                  type="button"
                  onClick={closeMapNodeDetails}
                >
                  Cancel
                </button>

                <button
                  className="research-primary-button"
                  type="button"
                  disabled={
                    !mapNodeEditorTitle.trim() ||
                    saving
                  }
                  onClick={() =>
                    void handleUpdateNode()
                  }
                >
                  {saving ? (
                    <LoaderCircle
                      className="research-spin"
                      size={15}
                    />
                  ) : (
                    <Save size={15} />
                  )}

                  Save changes
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {selectedSource && (
        <div
          className="research-source-viewer-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeSourceViewer();
            }
          }}
        >
          <section
            className="research-source-viewer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="research-source-viewer-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="research-source-viewer-header">
              <div className="research-source-viewer-heading">
                <span>
                  {sourceIcon(
                    selectedSource,
                  )}
                </span>

                <div>
                  <small>
                    {selectedSource.type.replaceAll(
                      "_",
                      " ",
                    )}
                    {" · "}
                    {selectedSource.status}
                  </small>

                  <h2 id="research-source-viewer-title">
                    {selectedSource.title}
                  </h2>
                </div>
              </div>

              <div className="research-source-viewer-header-actions">
                {selectedSource.url && (
                  <a
                    href={selectedSource.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open original
                    <ArrowUpRight size={14} />
                  </a>
                )}

                <button
                  type="button"
                  aria-label="Close source evidence viewer"
                  title="Close source viewer"
                  onClick={closeSourceViewer}
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="research-source-viewer-meta">
              <span
                className={`research-source-status ${selectedSource.status.toLowerCase()}`}
              >
                {selectedSource.status}
              </span>

              {selectedSource.publisher && (
                <span>
                  Publisher
                  <strong>
                    {selectedSource.publisher}
                  </strong>
                </span>
              )}

              {selectedSource.author && (
                <span>
                  Author
                  <strong>
                    {selectedSource.author}
                  </strong>
                </span>
              )}

              {selectedSource.accessedAt && (
                <span>
                  Accessed
                  <strong>
                    {formatDate(
                      selectedSource.accessedAt,
                    )}
                  </strong>
                </span>
              )}

              <span>
                Words
                <strong>
                  {selectedSourceWordCount.toLocaleString(
                    "en-IN",
                  )}
                </strong>
              </span>

              <span>
                Excerpts
                <strong>
                  {selectedSource.excerpts?.length ?? 0}
                </strong>
              </span>
            </div>

            <nav
              className="research-source-viewer-tabs"
              aria-label="Source evidence sections"
            >
              <button
                type="button"
                className={
                  sourceViewerTab === "summary"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSourceViewerTab(
                    "summary",
                  )
                }
              >
                Summary
              </button>

              <button
                type="button"
                className={
                  sourceViewerTab === "excerpts"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSourceViewerTab(
                    "excerpts",
                  )
                }
              >
                Extracted passages
                <b>
                  {selectedSource.excerpts?.length ?? 0}
                </b>
              </button>

              <button
                type="button"
                className={
                  sourceViewerTab === "full-text"
                    ? "active"
                    : ""
                }
                disabled={
                  !selectedSource.rawContent
                }
                onClick={() =>
                  setSourceViewerTab(
                    "full-text",
                  )
                }
              >
                Full readable text
              </button>
            </nav>

            <div className="research-source-viewer-content">
              {sourceViewerTab === "summary" && (
                <div className="research-source-summary-panel">
                  <section>
                    <header>
                      <div>
                        <span>EVIDENCE SUMMARY</span>
                        <h3>
                          What AIMERS extracted
                        </h3>
                      </div>

                      {selectedSource.summary && (
                        <button
                          className="research-source-copy-button"
                          type="button"
                          onClick={() =>
                            void copySourceText(
                              selectedSource.summary ??
                              "",
                              `summary:${selectedSource.id}`,
                            )
                          }
                        >
                          <Quote size={13} />
                          {copiedSourceField ===
                          `summary:${selectedSource.id}`
                            ? "Copied"
                            : "Copy summary"}
                        </button>
                      )}
                    </header>

                    <p>
                      {selectedSource.summary ||
                        "This source has no extracted summary yet."}
                    </p>
                  </section>

                  <section>
                    <header>
                      <div>
                        <span>CITATION-READY TEXT</span>
                        <h3>
                          Reference this source
                        </h3>
                      </div>

                      <button
                        className="research-source-copy-button"
                        type="button"
                        disabled={!selectedSourceCitationText}
                        onClick={() =>
                          void copySourceText(
                            selectedSourceCitationText,
                            `citation:${selectedSource.id}`,
                          )
                        }
                      >
                        <Quote size={13} />
                        {copiedSourceField ===
                        `citation:${selectedSource.id}`
                          ? "Copied"
                          : "Copy citation"}
                      </button>
                    </header>

                    <blockquote>
                      {selectedSourceCitationText ||
                        "No citation text is available."}
                    </blockquote>
                  </section>

                  {selectedSource.processingError && (
                    <section className="research-source-viewer-error">
                      <span>PROCESSING ERROR</span>
                      <p>
                        {selectedSource.processingError}
                      </p>
                    </section>
                  )}
                </div>
              )}

              {sourceViewerTab === "excerpts" && (
                <div className="research-source-excerpt-list">
                  {!selectedSource.excerpts?.length ? (
                    <div className="research-source-viewer-empty">
                      <Quote size={28} />
                      <h3>
                        No extracted passages
                      </h3>
                      <p>
                        Refresh this source after it reaches READY to create evidence excerpts.
                      </p>
                    </div>
                  ) : (
                    selectedSource.excerpts.map(
                      (
                        excerpt,
                        index,
                      ) => {
                        const excerptCitation = [
                          `"${excerpt.quote}"`,
                          selectedSourceCitationText,
                        ]
                          .filter(Boolean)
                          .join("\n\n");

                        const copyKey =
                          `excerpt:${excerpt.id}`;

                        const citationKey =
                          `excerpt-citation:${excerpt.id}`;

                        return (
                          <article
                            key={excerpt.id}
                          >
                            <header>
                              <div>
                                <span>
                                  PASSAGE {index + 1}
                                </span>

                                <small>
                                  {excerpt.locator ||
                                    (
                                      excerpt.pageNumber
                                        ? `Page ${excerpt.pageNumber}`
                                        : "Extracted evidence"
                                    )}
                                </small>
                              </div>

                              <div>
                                <button
                                  className="research-evidence-action-button assistant"
                                  type="button"
                                  disabled={
                                    evidenceActionKey !==
                                      null ||
                                    generating ||
                                    saving
                                  }
                                  onClick={() =>
                                    void handleAskAssistantFromExcerpt(
                                      selectedSource,
                                      excerpt,
                                    )
                                  }
                                >
                                  {evidenceActionKey ===
                                  `assistant:${excerpt.id}` ? (
                                    <LoaderCircle
                                      className="research-spin"
                                      size={13}
                                    />
                                  ) : (
                                    <MessageSquare
                                      size={13}
                                    />
                                  )}

                                  {evidenceActionKey ===
                                  `assistant:${excerpt.id}`
                                    ? "Sending…"
                                    : "Ask Assistant"}
                                </button>

                                <button
                                  className="research-evidence-action-button map"
                                  type="button"
                                  disabled={
                                    evidenceActionKey !==
                                      null ||
                                    generating ||
                                    saving
                                  }
                                  onClick={() =>
                                    void handleCreateEvidenceNode(
                                      selectedSource,
                                      excerpt,
                                    )
                                  }
                                >
                                  {evidenceActionKey ===
                                  `node:${excerpt.id}` ? (
                                    <LoaderCircle
                                      className="research-spin"
                                      size={13}
                                    />
                                  ) : (
                                    <Network
                                      size={13}
                                    />
                                  )}

                                  {evidenceActionKey ===
                                  `node:${excerpt.id}`
                                    ? "Creating…"
                                    : "Add to map"}
                                </button>

                                <button
                                  className="research-source-copy-button"
                                  type="button"
                                  onClick={() =>
                                    void copySourceText(
                                      excerpt.quote,
                                      copyKey,
                                    )
                                  }
                                >
                                  {copiedSourceField ===
                                  copyKey
                                    ? "Copied"
                                    : "Copy quote"}
                                </button>

                                <button
                                  className="research-source-copy-button"
                                  type="button"
                                  onClick={() =>
                                    void copySourceText(
                                      excerptCitation,
                                      citationKey,
                                    )
                                  }
                                >
                                  {copiedSourceField ===
                                  citationKey
                                    ? "Copied"
                                    : "Quote + citation"}
                                </button>
                              </div>
                            </header>

                            <blockquote>
                              {excerpt.quote}
                            </blockquote>

                            {(excerpt.note ||
                              excerpt.startOffset !== null ||
                              excerpt.endOffset !== null) && (
                              <footer>
                                {excerpt.note && (
                                  <span>
                                    {excerpt.note}
                                  </span>
                                )}

                                {excerpt.startOffset !== null &&
                                  excerpt.endOffset !== null && (
                                    <small>
                                      Characters
                                      {" "}
                                      {excerpt.startOffset.toLocaleString(
                                        "en-IN",
                                      )}
                                      {"–"}
                                      {excerpt.endOffset.toLocaleString(
                                        "en-IN",
                                      )}
                                    </small>
                                  )}
                              </footer>
                            )}
                          </article>
                        );
                      },
                    )
                  )}
                </div>
              )}

              {sourceViewerTab === "full-text" && (
                <div className="research-source-full-text">
                  <header>
                    <div>
                      <span>READABLE SOURCE TEXT</span>
                      <h3>
                        Content provided to Research AI
                      </h3>
                    </div>

                    <button
                      className="research-source-copy-button"
                      type="button"
                      disabled={!selectedSource.rawContent}
                      onClick={() =>
                        void copySourceText(
                          selectedSource.rawContent ??
                          "",
                          `full-text:${selectedSource.id}`,
                        )
                      }
                    >
                      <Quote size={13} />
                      {copiedSourceField ===
                      `full-text:${selectedSource.id}`
                        ? "Copied"
                        : "Copy full text"}
                    </button>
                  </header>

                  <pre>
                    {selectedSource.rawContent ||
                      "No readable text has been extracted."}
                  </pre>
                </div>
              )}
            </div>

            <footer className="research-source-viewer-footer">
              <span>
                Press Esc or click outside to close
              </span>

              <button
                className="research-secondary-button"
                type="button"
                onClick={closeSourceViewer}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}

      {sourceFormOpen && project && (
        <div className="research-modal-backdrop">
          <section className="research-modal">
            <header>
              <div>
                <span>ADD SOURCE</span>
                <h2>Expand the evidence library</h2>
              </div>
              <button
                type="button"
                onClick={() => setSourceFormOpen(false)}
              >
                <X size={17} />
              </button>
            </header>
            <label>
              Source type
              <select
                value={sourceTypeValue}
                onChange={(event: ValueChangeEvent) => setSourceTypeValue(event.target.value as ResearchSourceType)}
              >
                {sourceTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input
                autoFocus
                value={sourceTitle}
                placeholder="Source title"
                onChange={(event: ValueChangeEvent) => setSourceTitle(event.target.value)}
              />
            </label>
            <label>
              URL
              <input
                value={sourceUrl}
                inputMode="url"
                placeholder="https://..."
                required={sourceTypeValue === "WEB_PAGE"}
                onChange={(event: ValueChangeEvent) => setSourceUrl(event.target.value)}
              />

              {sourceTypeValue === "WEB_PAGE" && (
                <small className="research-source-form-hint">
                  AIMERS will fetch public HTML or text, remove page chrome and create evidence excerpts.
                </small>
              )}
            </label>
            <label>
              Summary or relevance
              <textarea
                value={sourceSummary}
                placeholder="Why is this source useful?"
                onChange={(event: ValueChangeEvent) => setSourceSummary(event.target.value)}
              />
            </label>
            <footer>
              <button
                className="research-secondary-button"
                type="button"
                onClick={() => setSourceFormOpen(false)}
              >
                Cancel
              </button>
              <button
                className="research-primary-button"
                type="button"
                disabled={
                  !sourceTitle.trim() ||
                  saving ||
                  (
                    sourceTypeValue === "WEB_PAGE" &&
                    !sourceUrl.trim()
                  )
                }
                onClick={() => void handleCreateSource()}
              >
                {saving ? (
                  <LoaderCircle
                    className="research-spin"
                    size={16}
                  />
                ) : (
                  <Plus size={16} />
                )}

                {sourceTypeValue === "WEB_PAGE"
                  ? "Save and ingest"
                  : "Add source"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {threadFormOpen && project && (
        <div className="research-modal-backdrop">
          <section className="research-modal small">
            <header>
              <div>
                <span>NEW THREAD</span>
                <h2>Create a research discussion</h2>
              </div>
              <button
                type="button"
                onClick={() => setThreadFormOpen(false)}
              >
                <X size={17} />
              </button>
            </header>
            <label>
              Thread title
              <input
                autoFocus
                value={threadTitle}
                placeholder="Example: Evidence for hypothesis A"
                onChange={(event: ValueChangeEvent) => setThreadTitle(event.target.value)}
              />
            </label>
            <footer>
              <button
                className="research-secondary-button"
                type="button"
                onClick={() => setThreadFormOpen(false)}
              >
                Cancel
              </button>
              <button
                className="research-primary-button"
                type="button"
                disabled={!threadTitle.trim() || saving}
                onClick={() => void handleCreateThread()}
              >
                <MessageSquare size={16} />
                Create thread
              </button>
            </footer>
          </section>
        </div>
      )}

      {nodeFormOpen && project && (
        <div className="research-modal-backdrop">
          <section className="research-modal">
            <header>
              <div>
                <span>NEW KNOWLEDGE NODE</span>
                <h2>Add an idea to the map</h2>
              </div>
              <button
                type="button"
                onClick={() => setNodeFormOpen(false)}
              >
                <X size={17} />
              </button>
            </header>
            <label>
              Node type
              <select
                value={nodeType}
                onChange={(event: ValueChangeEvent) => setNodeType(event.target.value as ResearchMindMapNodeType)}
              >
                {nodeTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input
                autoFocus
                value={nodeTitle}
                placeholder="Concept, evidence or conclusion"
                onChange={(event: ValueChangeEvent) => setNodeTitle(event.target.value)}
              />
            </label>
            <label>
              Supporting detail
              <textarea
                value={nodeContent}
                placeholder="Explain how this node contributes to the project"
                onChange={(event: ValueChangeEvent) => setNodeContent(event.target.value)}
              />
            </label>
            <footer>
              <button
                className="research-secondary-button"
                type="button"
                onClick={() => setNodeFormOpen(false)}
              >
                Cancel
              </button>
              <button
                className="research-primary-button"
                type="button"
                disabled={!nodeTitle.trim() || saving}
                onClick={() => void handleCreateNode()}
              >
                <Network size={16} />
                Add node
              </button>
            </footer>
          </section>
        </div>
      )}

      {edgeFormOpen && project && (
        <div className="research-modal-backdrop">
          <section className="research-modal research-edge-builder-modal">
            <header>
              <div>
                <span>
                    {editingEdgeId
                      ? "EDIT RELATIONSHIP"
                      : "CONNECT NODES"}
                  </span>
                  <h2>
                    {editingEdgeId
                      ? "Update this knowledge relationship"
                      : "Define a knowledge relationship"}
                  </h2>
              </div>

              <button
                type="button"
                onClick={closeEdgeBuilder}
              >
                <X size={17} />
              </button>
            </header>

            <label>
              From
              <select
                value={edgeSourceId}
                onChange={(event: ValueChangeEvent) => {
                  const value =
                    event.target.value;

                  setEdgeSourceId(
                    value,
                  );

                  if (
                    value ===
                    edgeTargetId
                  ) {
                    setEdgeTargetId(
                      "",
                    );
                  }
                }}
              >
                <option value="">
                  Select source node
                </option>

                {project.mindMapNodes.map(
                  (node) => (
                    <option
                      key={node.id}
                      value={node.id}
                    >
                      {node.title}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              To
              <select
                value={edgeTargetId}
                onChange={(event: ValueChangeEvent) =>
                  setEdgeTargetId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select target node
                </option>

                {project.mindMapNodes
                  .filter(
                    (node) =>
                      node.id !==
                      edgeSourceId,
                  )
                  .map(
                    (node) => (
                      <option
                        key={node.id}
                        value={node.id}
                      >
                        {node.title}
                      </option>
                    ),
                  )}
              </select>
            </label>

            <div className="research-relationship-presets">
              <span>
                QUICK RELATIONSHIPS
              </span>

              <div>
                {relationshipPresets.map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={
                        edgeLabel ===
                        preset
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setEdgeLabel(
                          preset,
                        )
                      }
                    >
                      {preset}
                    </button>
                  ),
                )}
              </div>
            </div>

            <label>
              Relationship label
              <input
                value={edgeLabel}
                maxLength={160}
                placeholder="supports, contradicts, explains..."
                onChange={(event: ValueChangeEvent) =>
                  setEdgeLabel(
                    event.target.value,
                  )
                }
              />
            </label>

            {edgeSourceId &&
              edgeTargetId && (
                <div className="research-edge-preview">
                  <strong>
                    {project.mindMapNodes.find(
                      (node) =>
                        node.id ===
                        edgeSourceId,
                    )?.title ??
                      "Source node"}
                  </strong>

                  <span
                    data-relation-tone={relationshipTone(
                      edgeLabel,
                    )}
                  >
                    <Link2 size={13} />
                    {edgeLabel.trim() ||
                      "related to"}
                  </span>

                  <strong>
                    {project.mindMapNodes.find(
                      (node) =>
                        node.id ===
                        edgeTargetId,
                    )?.title ??
                      "Target node"}
                  </strong>
                </div>
              )}

            <footer>
              <button
                className="research-secondary-button"
                type="button"
                onClick={closeEdgeBuilder}
              >
                Cancel
              </button>

              <button
                className="research-primary-button"
                type="button"
                disabled={
                  !edgeSourceId ||
                  !edgeTargetId ||
                  saving
                }
                onClick={() =>
                  void handleCreateEdge()
                }
              >
                {saving ? (
                  <LoaderCircle
                    className="research-spin"
                    size={15}
                  />
                ) : (
                  <Link2 size={16} />
                )}

                {editingEdgeId
                  ? "Save relationship"
                  : "Connect nodes"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
