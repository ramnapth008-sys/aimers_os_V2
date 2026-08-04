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
  updateResearchProject,
  updateResearchSource,
} from "./research-ai.service";

import type {
  ResearchAssistantProviderInfo,
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
  ] = useState<WorkspaceTab>("overview");

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

  const activeThread = useMemo(
    () =>
      project?.threads.find(
        (thread) => thread.id === selectedThreadId,
      ) ??
      project?.threads[0] ??
      null,
    [project, selectedThreadId],
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
      quiet
        ? setRefreshing(true)
        : setLoading(true);

      setError("");

      try {
        const next = await getResearchWorkspace(
          apiFetch,
          {
            status,
            search,
          },
        );

        setWorkspace(next);

        if (
          selectedProjectId &&
          !next.projects.some(
            (item) => item.id === selectedProjectId,
          )
        ) {
          setSelectedProjectId(
            next.projects[0]?.id ?? null,
          );
        }

        if (!selectedProjectId && next.projects[0]) {
          setSelectedProjectId(next.projects[0].id);
        }
      } catch (requestError) {
        setError(messageFrom(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      apiFetch,
      search,
      selectedProjectId,
      status,
    ],
  );

  const loadProject = useCallback(
    async (
      projectId: string,
      quiet = false,
    ) => {
      if (!quiet) {
        setOpening(true);
      }

      setError("");

      try {
        const next = await getResearchProject(
          apiFetch,
          projectId,
        );

        setProject(next);

        setSelectedThreadId(
          (current) =>
            next.threads.some(
              (thread) => thread.id === current,
            )
              ? current
              : next.threads[0]?.id ?? null,
        );
      } catch (requestError) {
        setError(messageFrom(requestError));
        setProject(null);
      } finally {
        setOpening(false);
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
      if (!selectedProjectId) {
        setProject(null);
        setAssistantProvider(null);
        return;
      }

      setAssistantProvider(null);
      void loadProject(selectedProjectId);
    },
    [loadProject, selectedProjectId],
  );

  const refreshAll = async () => {
    await loadWorkspace(true);

    if (selectedProjectId) {
      await loadProject(selectedProjectId, true);
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
      setSelectedProjectId(created.id);
      setProject(created);
      await loadWorkspace(true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProject = async () => {
    if (!project) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await updateResearchProject(
        apiFetch,
        project.id,
        {
          title: project.title.trim() || "Untitled research project",
          researchQuestion:
            project.researchQuestion?.trim() || null,
          description:
            project.description?.trim() || null,
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

      setProject(null);
      setSelectedProjectId(null);
      setStatus(nextStatus);
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
      setProject(null);
      setSelectedProjectId(null);
      await loadWorkspace(true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSource = async () => {
    if (!project || !sourceTitle.trim()) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createResearchSource(
        apiFetch,
        project.id,
        {
          type: sourceTypeValue,
          title: sourceTitle.trim(),
          url: sourceUrl.trim() || null,
          summary: sourceSummary.trim() || null,
          status: "SAVED",
        },
      );

      setSourceFormOpen(false);
      setSourceTitle("");
      setSourceUrl("");
      setSourceSummary("");
      await refreshAll();
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
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

    setSaving(true);

    try {
      await deleteResearchMindMapNode(
        apiFetch,
        project.id,
        nodeId,
      );
      await loadProject(project.id, true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEdge = async () => {
    if (
      !project ||
      !edgeSourceId ||
      !edgeTargetId ||
      edgeSourceId === edgeTargetId
    ) {
      return;
    }

    setSaving(true);

    try {
      await createResearchMindMapEdge(
        apiFetch,
        project.id,
        {
          sourceNodeId: edgeSourceId,
          targetNodeId: edgeTargetId,
          label: edgeLabel.trim() || null,
        },
      );

      setEdgeFormOpen(false);
      setEdgeSourceId("");
      setEdgeTargetId("");
      setEdgeLabel("");
      await loadProject(project.id, true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEdge = async (
    edgeId: string,
  ) => {
    if (!project) {
      return;
    }

    setSaving(true);

    try {
      await deleteResearchMindMapEdge(
        apiFetch,
        project.id,
        edgeId,
      );
      await loadProject(project.id, true);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
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
                  setStatus(item.value);
                  setSelectedProjectId(null);
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
                className={selectedProjectId === item.id ? "active" : ""}
                onClick={() => setSelectedProjectId(item.id)}
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
                  />
                  <small>
                    Updated {formatDate(project.updatedAt)}
                  </small>
                </div>

                <div className="research-project-actions">
                  <button
                    type="button"
                    title={project.isPinned ? "Unpin" : "Pin"}
                    onClick={() => void handleToggleProjectPin()}
                  >
                    {project.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                  <button
                    type="button"
                    title="Save project"
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

                            <p>
                              {source.summary || source.author || "No summary added yet."}
                            </p>

                            <footer>
                              <span className={`research-source-status ${source.status.toLowerCase()}`}>
                                {source.status}
                              </span>
                              <span>
                                {source._count?.citations ?? 0} citations
                              </span>
                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open <ArrowUpRight size={13} />
                                </a>
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
                          onClick={() => setEdgeFormOpen(true)}
                        >
                          <Link2 size={15} />
                          Connect
                        </button>
                        <button
                          className="research-primary-button compact"
                          type="button"
                          onClick={() => setNodeFormOpen(true)}
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
                          {project.mindMapNodes.map((node) => (
                            <article
                              key={node.id}
                              data-node-type={node.type}
                            >
                              <header>
                                <span>{node.type}</span>
                                <button
                                  type="button"
                                  aria-label="Delete node"
                                  onClick={() => void handleDeleteNode(node.id)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </header>
                              <strong>{node.title}</strong>
                              <p>{node.content || "No supporting detail."}</p>
                              {(node.researchSource || node.note) && (
                                <footer>
                                  <Link2 size={12} />
                                  {node.researchSource?.title ?? node.note?.title}
                                </footer>
                              )}
                            </article>
                          ))}
                        </div>

                        {!!project.mindMapEdges.length && (
                          <div className="research-edge-list">
                            <span>CONNECTIONS</span>
                            {project.mindMapEdges.map((edge) => {
                              const sourceNode = project.mindMapNodes.find(
                                (node) => node.id === edge.sourceNodeId,
                              );
                              const targetNode = project.mindMapNodes.find(
                                (node) => node.id === edge.targetNodeId,
                              );

                              return (
                                <article key={edge.id}>
                                  <strong>{sourceNode?.title ?? "Unknown node"}</strong>
                                  <Link2 size={13} />
                                  <strong>{targetNode?.title ?? "Unknown node"}</strong>
                                  <span>{edge.label || "related to"}</span>
                                  <button
                                    type="button"
                                    aria-label="Delete connection"
                                    onClick={() => void handleDeleteEdge(edge.id)}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </article>
                              );
                            })}
                          </div>
                        )}
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
                placeholder="https://..."
                onChange={(event: ValueChangeEvent) => setSourceUrl(event.target.value)}
              />
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
                disabled={!sourceTitle.trim() || saving}
                onClick={() => void handleCreateSource()}
              >
                <Plus size={16} />
                Add source
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
          <section className="research-modal">
            <header>
              <div>
                <span>CONNECT NODES</span>
                <h2>Define a knowledge relationship</h2>
              </div>
              <button
                type="button"
                onClick={() => setEdgeFormOpen(false)}
              >
                <X size={17} />
              </button>
            </header>
            <label>
              From
              <select
                value={edgeSourceId}
                onChange={(event: ValueChangeEvent) => setEdgeSourceId(event.target.value)}
              >
                <option value="">Select source node</option>
                {project.mindMapNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              To
              <select
                value={edgeTargetId}
                onChange={(event: ValueChangeEvent) => setEdgeTargetId(event.target.value)}
              >
                <option value="">Select target node</option>
                {project.mindMapNodes
                  .filter((node) => node.id !== edgeSourceId)
                  .map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Relationship label
              <input
                value={edgeLabel}
                placeholder="supports, contradicts, explains..."
                onChange={(event: ValueChangeEvent) => setEdgeLabel(event.target.value)}
              />
            </label>
            <footer>
              <button
                className="research-secondary-button"
                type="button"
                onClick={() => setEdgeFormOpen(false)}
              >
                Cancel
              </button>
              <button
                className="research-primary-button"
                type="button"
                disabled={!edgeSourceId || !edgeTargetId || saving}
                onClick={() => void handleCreateEdge()}
              >
                <Link2 size={16} />
                Connect nodes
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
