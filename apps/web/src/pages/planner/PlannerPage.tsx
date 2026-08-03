import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Flame,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAcademicWorkspace,
} from "../subjects/subjects.service";

import type {
  AcademicChapter,
  AcademicSyllabusSubject,
  AcademicWorkspace,
} from "../subjects/subjects.types";

import {
  completeStudySession,
  createStudyPlan,
  createStudyTask,
  deleteStudyTask,
  getPlannerWorkspace,
  startStudySession,
  updateStudyTask,
} from "./planner.service";

import type {
  PlannerWorkspace,
  StudyTask,
  StudyTaskPriority,
  StudyTaskStatus,
  StudyTaskType,
} from "./planner.types";

import "./planner.css";

type TaskFilter =
  | "ALL"
  | "ACTIVE"
  | "COMPLETED"
  | "OVERDUE";

interface TaskFormState {
  title: string;
  description: string;
  studyPlanId: string;
  subjectId: string;
  chapterId: string;
  type: StudyTaskType;
  priority: StudyTaskPriority;
  scheduledFor: string;
  dueAt: string;
  estimatedMinutes: string;
}

const initialTaskForm:
  TaskFormState = {
    title: "",
    description: "",
    studyPlanId: "",
    subjectId: "",
    chapterId: "",
    type: "STUDY",
    priority: "MEDIUM",
    scheduledFor: "",
    dueAt: "",
    estimatedMinutes: "45",
  };

function toIso(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function dateInputValue(
  offsetDays = 0,
): string {
  const date = new Date();

  date.setDate(
    date.getDate() + offsetDays,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function formatMinutes(
  minutes: number,
): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(minutes / 60);

  const remainder =
    minutes % 60;

  return remainder
    ? `${hours}h ${remainder}m`
    : `${hours}h`;
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function isOverdue(
  task: StudyTask,
): boolean {
  return Boolean(
    task.status !== "COMPLETED" &&
    task.dueAt &&
    new Date(task.dueAt).getTime() <
      Date.now(),
  );
}

function taskStatusIcon(
  status: StudyTaskStatus,
): ReactNode {
  if (status === "COMPLETED") {
    return <Check size={14} />;
  }

  if (status === "IN_PROGRESS") {
    return <TrendingUp size={14} />;
  }

  return <Circle size={14} />;
}

function PlannerLoading() {
  return (
    <section className="planner-state-card">
      <LoaderCircle
        className="planner-spinner"
        size={30}
      />

      <h1>
        Loading your study planner
      </h1>

      <p>
        Connecting plans, tasks and study
        sessions…
      </p>
    </section>
  );
}

function PlannerError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="planner-state-card error">
      <AlertTriangle size={30} />

      <h1>
        Planner could not be loaded
      </h1>

      <p>{message}</p>

      <button
        type="button"
        onClick={onRetry}
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </section>
  );
}

function PlannerMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="planner-metric">
      <span>{icon}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

export function PlannerPage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] = useState<PlannerWorkspace | null>(
    null,
  );

  const [
    academic,
    setAcademic,
  ] = useState<AcademicWorkspace | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showTaskForm,
    setShowTaskForm,
  ] = useState(false);

  const [
    showPlanForm,
    setShowPlanForm,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    busyTaskId,
    setBusyTaskId,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<TaskFilter>("ALL");

  const [
    taskForm,
    setTaskForm,
  ] = useState<TaskFormState>(
    initialTaskForm,
  );

  const [
    planName,
    setPlanName,
  ] = useState(
    "NEET Study Plan",
  );

  const [
    planDescription,
    setPlanDescription,
  ] = useState("");

  const [
    planStartDate,
    setPlanStartDate,
  ] = useState(
    dateInputValue(),
  );

  const [
    planEndDate,
    setPlanEndDate,
  ] = useState(
    dateInputValue(30),
  );

  const loadData =
    useCallback(
      async (
        refresh = false,
      ) => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const [
            plannerResult,
            academicResult,
          ] = await Promise.all([
            getPlannerWorkspace(
              apiFetch,
            ),
            getAcademicWorkspace(
              apiFetch,
            ),
          ]);

          setWorkspace(plannerResult);
          setAcademic(academicResult);
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load planner data.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [apiFetch],
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const subjects =
    academic
      ?.syllabusVersion
      .subjects ?? [];

  const selectedSubject =
    subjects.find(
      (subject) =>
        subject.subject.id ===
        taskForm.subjectId,
    ) ?? null;

  const availableChapters:
    AcademicChapter[] =
    selectedSubject
      ? selectedSubject.units.flatMap(
          (unit) =>
            unit.chapters,
        )
      : [];

  const activeSession =
    workspace?.sessions.find(
      (session) =>
        session.status === "ACTIVE",
    ) ?? null;

  const filteredTasks =
    useMemo(() => {
      const tasks =
        workspace?.tasks ?? [];

      return tasks.filter((task) => {
        if (filter === "ACTIVE") {
          return (
            task.status === "TODO" ||
            task.status ===
              "IN_PROGRESS"
          );
        }

        if (filter === "COMPLETED") {
          return (
            task.status ===
            "COMPLETED"
          );
        }

        if (filter === "OVERDUE") {
          return isOverdue(task);
        }

        return true;
      });
    }, [
      filter,
      workspace,
    ]);

  const selectedPlan =
    workspace?.plans.find(
      (plan) =>
        plan.id ===
        taskForm.studyPlanId,
    ) ?? null;

  async function handleCreatePlan(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const plan =
        await createStudyPlan(
          apiFetch,
          {
            name: planName,
            description:
              planDescription ||
              undefined,
            startDate:
              planStartDate,
            endDate:
              planEndDate ||
              undefined,
          },
        );

      setTaskForm(
        (current) => ({
          ...current,
          studyPlanId: plan.id,
        }),
      );

      setShowPlanForm(false);

      await loadData(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create the study plan.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTask(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await createStudyTask(
        apiFetch,
        {
          title:
            taskForm.title,
          description:
            taskForm.description ||
            undefined,
          studyPlanId:
            taskForm.studyPlanId ||
            undefined,
          subjectId:
            taskForm.subjectId ||
            undefined,
          chapterId:
            taskForm.chapterId ||
            undefined,
          type:
            taskForm.type,
          priority:
            taskForm.priority,
          scheduledFor:
            toIso(
              taskForm.scheduledFor,
            ),
          dueAt:
            toIso(
              taskForm.dueAt,
            ),
          estimatedMinutes:
            Number(
              taskForm
                .estimatedMinutes,
            ),
        },
      );

      setTaskForm(
        initialTaskForm,
      );

      setShowTaskForm(false);

      await loadData(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create the study task.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(
    task: StudyTask,
    completionPercent: number,
  ) {
    setBusyTaskId(task.id);
    setError("");

    try {
      await updateStudyTask(
        apiFetch,
        task.id,
        {
          completionPercent,
        },
      );

      await loadData(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update the task.",
      );
    } finally {
      setBusyTaskId("");
    }
  }

  async function completeTask(
    task: StudyTask,
  ) {
    setBusyTaskId(task.id);
    setError("");

    try {
      await updateStudyTask(
        apiFetch,
        task.id,
        {
          status: "COMPLETED",
        },
      );

      await loadData(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to complete the task.",
      );
    } finally {
      setBusyTaskId("");
    }
  }

  async function removeTask(
    task: StudyTask,
  ) {
    setBusyTaskId(task.id);
    setError("");

    try {
      await deleteStudyTask(
        apiFetch,
        task.id,
      );

      await loadData(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to delete the task.",
      );
    } finally {
      setBusyTaskId("");
    }
  }

  async function startSession(
    task: StudyTask,
  ) {
    setBusyTaskId(task.id);
    setError("");

    try {
      await startStudySession(
        apiFetch,
        task.id,
      );

      await loadData(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to start the study session.",
      );
    } finally {
      setBusyTaskId("");
    }
  }

  async function completeSession() {
    if (!activeSession) {
      return;
    }

    setBusyTaskId(
      activeSession.studyTaskId ??
      activeSession.id,
    );

    setError("");

    try {
      await completeStudySession(
        apiFetch,
        activeSession.id,
      );

      await loadData(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to complete the study session.",
      );
    } finally {
      setBusyTaskId("");
    }
  }

  if (loading) {
    return (
      <div className="planner-page planner-state-page">
        <PlannerLoading />
      </div>
    );
  }

  if (
    !workspace ||
    !academic
  ) {
    return (
      <div className="planner-page planner-state-page">
        <PlannerError
          message={
            error ||
            "No planner workspace is available."
          }
          onRetry={() => {
            void loadData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="planner-page">
      <header className="planner-hero">
        <div>
          <span className="planner-eyebrow">
            <Sparkles size={14} />
            LEARNING EXECUTION
          </span>

          <h1>
            Plan the work.
            <strong> Execute the plan.</strong>
          </h1>

          <p>
            Convert your syllabus into scheduled,
            measurable study tasks and focused
            sessions.
          </p>

          <div className="planner-hero-actions">
            <button
              type="button"
              onClick={() => {
                setShowTaskForm(true);
              }}
            >
              <Plus size={16} />
              New task
            </button>

            <button
              className="secondary"
              type="button"
              onClick={() => {
                setShowPlanForm(true);
              }}
            >
              <CalendarDays size={16} />
              New plan
            </button>
          </div>
        </div>

        <div className="planner-hero-focus">
          <Timer size={31} />

          <small>
            COMPLETED STUDY TIME
          </small>

          <strong>
            {
              formatMinutes(
                workspace
                  .summary
                  .completedSessionMinutes,
              )
            }
          </strong>

          <p>
            Recorded from completed sessions
          </p>
        </div>
      </header>

      {error && (
        <div
          className="planner-inline-error"
          role="alert"
        >
          <AlertTriangle size={16} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => {
              setError("");
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {activeSession && (
        <section className="planner-active-session">
          <div>
            <span>
              <Flame size={18} />
            </span>

            <div>
              <small>
                ACTIVE STUDY SESSION
              </small>

              <strong>
                {
                  activeSession
                    .studyTask
                    ?.title ??
                  "Focused study session"
                }
              </strong>

              <p>
                Started{" "}
                {
                  formatDateTime(
                    activeSession
                      .startedAt,
                  )
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void completeSession();
            }}
          >
            <CheckCircle2 size={16} />
            Finish session
          </button>
        </section>
      )}

      <section className="planner-metrics">
        <PlannerMetric
          icon={
            <CalendarDays size={19} />
          }
          label="PLANS"
          value={
            `${workspace.summary.planCount}`
          }
          detail="Active study plans"
        />

        <PlannerMetric
          icon={<Target size={19} />}
          label="ACTIVE TASKS"
          value={
            `${workspace.summary.activeTaskCount}`
          }
          detail="Waiting for execution"
        />

        <PlannerMetric
          icon={
            <CheckCircle2 size={19} />
          }
          label="COMPLETED"
          value={
            `${workspace.summary.completedTaskCount}`
          }
          detail="Finished tasks"
        />

        <PlannerMetric
          icon={<Clock3 size={19} />}
          label="PLANNED TIME"
          value={
            formatMinutes(
              workspace.summary
                .plannedMinutes,
            )
          }
          detail="Across active tasks"
        />

        <PlannerMetric
          icon={
            <AlertTriangle size={19} />
          }
          label="OVERDUE"
          value={
            `${workspace.summary.overdueTaskCount}`
          }
          detail="Needs attention"
        />
      </section>

      <section className="planner-workspace">
        <header>
          <div>
            <span>STUDY QUEUE</span>
            <h2>Your tasks</h2>
            <p>
              {
                filteredTasks.length
              } visible tasks
            </p>
          </div>

          <div className="planner-filters">
            {(
              [
                "ALL",
                "ACTIVE",
                "COMPLETED",
                "OVERDUE",
              ] as TaskFilter[]
            ).map((item) => (
              <button
                key={item}
                className={
                  filter === item
                    ? "active"
                    : ""
                }
                type="button"
                onClick={() => {
                  setFilter(item);
                }}
              >
                {item}
              </button>
            ))}

            <button
              className="planner-refresh"
              disabled={refreshing}
              type="button"
              onClick={() => {
                void loadData(true);
              }}
            >
              <RefreshCw
                className={
                  refreshing
                    ? "planner-spinner"
                    : ""
                }
                size={15}
              />
            </button>
          </div>
        </header>

        {filteredTasks.length === 0 ? (
          <div className="planner-empty">
            <Target size={31} />
            <h3>No tasks in this view</h3>
            <p>
              Create a task or choose another
              filter.
            </p>
          </div>
        ) : (
          <div className="planner-task-list">
            {filteredTasks.map((task) => {
              const busy =
                busyTaskId ===
                task.id;

              const overdue =
                isOverdue(task);

              return (
                <article
                  key={task.id}
                  className={
                    `planner-task ${
                      task.status
                        .toLowerCase()
                        .replace(
                          "_",
                          "-",
                        )
                    } ${
                      overdue
                        ? "overdue"
                        : ""
                    }`
                  }
                >
                  <div className="planner-task-status">
                    {taskStatusIcon(
                      task.status,
                    )}
                  </div>

                  <div className="planner-task-content">
                    <div className="planner-task-heading">
                      <div>
                        <span>
                          {task.type}
                        </span>

                        <h3>
                          {task.title}
                        </h3>
                      </div>

                      <span
                        className={
                          `priority ${
                            task.priority
                              .toLowerCase()
                          }`
                        }
                      >
                        {task.priority}
                      </span>
                    </div>

                    <p>
                      {
                        task.description ||
                        "No description"
                      }
                    </p>

                    <div className="planner-task-meta">
                      <span>
                        <BookOpenCheck
                          size={13}
                        />
                        {
                          task.chapter
                            ?.name ??
                          task.subject
                            ?.name ??
                          "General study"
                        }
                      </span>

                      <span>
                        <Clock3 size={13} />
                        {
                          task
                            .estimatedMinutes
                        } min planned
                      </span>

                      <span>
                        <CalendarDays
                          size={13}
                        />
                        {
                          formatDateTime(
                            task
                              .scheduledFor,
                          )
                        }
                      </span>

                      {task.dueAt && (
                        <span
                          className={
                            overdue
                              ? "overdue"
                              : ""
                          }
                        >
                          <AlertTriangle
                            size={13}
                          />
                          Due{" "}
                          {
                            formatDateTime(
                              task.dueAt,
                            )
                          }
                        </span>
                      )}
                    </div>

                    <div className="planner-task-progress">
                      <span>
                        <i
                          style={{
                            width:
                              `${task.completionPercent}%`,
                          }}
                        />
                      </span>

                      <strong>
                        {
                          task
                            .completionPercent
                        }%
                      </strong>
                    </div>

                    <div className="planner-task-actions">
                      {task.status !==
                        "COMPLETED" && (
                        <>
                          <button
                            disabled={
                              busy ||
                              task
                                .completionPercent >=
                                100
                            }
                            type="button"
                            onClick={() => {
                              void updateTask(
                                task,
                                Math.min(
                                  100,
                                  task
                                    .completionPercent +
                                    25,
                                ),
                              );
                            }}
                          >
                            <TrendingUp
                              size={14}
                            />
                            Advance 25%
                          </button>

                          <button
                            disabled={
                              busy ||
                              Boolean(
                                activeSession,
                              )
                            }
                            type="button"
                            onClick={() => {
                              void startSession(
                                task,
                              );
                            }}
                          >
                            <Timer size={14} />
                            Start session
                          </button>

                          <button
                            className="complete"
                            disabled={busy}
                            type="button"
                            onClick={() => {
                              void completeTask(
                                task,
                              );
                            }}
                          >
                            <CheckCircle2
                              size={14}
                            />
                            Complete
                          </button>
                        </>
                      )}

                      <button
                        className="delete"
                        disabled={busy}
                        type="button"
                        onClick={() => {
                          void removeTask(
                            task,
                          );
                        }}
                      >
                        {busy ? (
                          <LoaderCircle
                            className="planner-spinner"
                            size={14}
                          />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <ChevronRight
                    className="planner-task-chevron"
                    size={18}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showPlanForm && (
        <div className="planner-modal-backdrop">
          <section className="planner-modal">
            <header>
              <div>
                <span>NEW STUDY PLAN</span>
                <h2>Create execution plan</h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPlanForm(false);
                }}
              >
                <X size={18} />
              </button>
            </header>

            <form
              onSubmit={handleCreatePlan}
            >
              <label>
                Plan name
                <input
                  required
                  minLength={2}
                  value={planName}
                  onChange={(event) => {
                    setPlanName(
                      event.target.value,
                    );
                  }}
                />
              </label>

              <label>
                Description
                <textarea
                  value={planDescription}
                  onChange={(event) => {
                    setPlanDescription(
                      event.target.value,
                    );
                  }}
                />
              </label>

              <div className="planner-form-grid">
                <label>
                  Start date
                  <input
                    required
                    type="date"
                    value={planStartDate}
                    onChange={(event) => {
                      setPlanStartDate(
                        event.target.value,
                      );
                    }}
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    value={planEndDate}
                    onChange={(event) => {
                      setPlanEndDate(
                        event.target.value,
                      );
                    }}
                  />
                </label>
              </div>

              <button
                className="planner-submit"
                disabled={saving}
                type="submit"
              >
                {saving ? (
                  <LoaderCircle
                    className="planner-spinner"
                    size={16}
                  />
                ) : (
                  <Plus size={16} />
                )}
                Create plan
              </button>
            </form>
          </section>
        </div>
      )}

      {showTaskForm && (
        <div className="planner-modal-backdrop">
          <section className="planner-modal task-modal">
            <header>
              <div>
                <span>NEW STUDY TASK</span>
                <h2>Add to your queue</h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowTaskForm(false);
                }}
              >
                <X size={18} />
              </button>
            </header>

            <form
              onSubmit={handleCreateTask}
            >
              <label>
                Task title
                <input
                  required
                  minLength={2}
                  value={taskForm.title}
                  onChange={(event) => {
                    setTaskForm(
                      (current) => ({
                        ...current,
                        title:
                          event
                            .target
                            .value,
                      }),
                    );
                  }}
                />
              </label>

              <label>
                Description
                <textarea
                  value={
                    taskForm.description
                  }
                  onChange={(event) => {
                    setTaskForm(
                      (current) => ({
                        ...current,
                        description:
                          event
                            .target
                            .value,
                      }),
                    );
                  }}
                />
              </label>

              <div className="planner-form-grid">
                <label>
                  Study plan
                  <select
                    value={
                      taskForm.studyPlanId
                    }
                    onChange={(event) => {
                      setTaskForm(
                        (current) => ({
                          ...current,
                          studyPlanId:
                            event
                              .target
                              .value,
                        }),
                      );
                    }}
                  >
                    <option value="">
                      No plan
                    </option>

                    {workspace.plans.map(
                      (plan) => (
                        <option
                          key={plan.id}
                          value={plan.id}
                        >
                          {plan.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Subject
                  <select
                    value={
                      taskForm.subjectId
                    }
                    onChange={(event) => {
                      setTaskForm(
                        (current) => ({
                          ...current,
                          subjectId:
                            event
                              .target
                              .value,
                          chapterId: "",
                        }),
                      );
                    }}
                  >
                    <option value="">
                      General
                    </option>

                    {subjects.map(
                      (
                        subject:
                          AcademicSyllabusSubject,
                      ) => (
                        <option
                          key={
                            subject
                              .subject
                              .id
                          }
                          value={
                            subject
                              .subject
                              .id
                          }
                        >
                          {
                            subject
                              .subject
                              .name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Chapter
                  <select
                    disabled={
                      !selectedSubject
                    }
                    value={
                      taskForm.chapterId
                    }
                    onChange={(event) => {
                      setTaskForm(
                        (current) => ({
                          ...current,
                          chapterId:
                            event
                              .target
                              .value,
                        }),
                      );
                    }}
                  >
                    <option value="">
                      No chapter
                    </option>

                    {availableChapters.map(
                      (chapter) => (
                        <option
                          key={chapter.id}
                          value={chapter.id}
                        >
                          {chapter.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Task type
                  <select
                    value={taskForm.type}
                    onChange={(event) => {
                      setTaskForm(
                        (current) => ({
                          ...current,
                          type:
                            event
                              .target
                              .value as StudyTaskType,
                        }),
                      );
                    }}
                  >
                    <option value="STUDY">
                      Study
                    </option>
                    <option value="REVISION">
                      Revision
                    </option>
                    <option value="PRACTICE">
                      Practice
                    </option>
                    <option value="LECTURE">
                      Lecture
                    </option>
                    <option value="MOCK_TEST">
                      Mock test
                    </option>
                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={
                      taskForm.priority
                    }
                    onChange={(event) => {
                      setTaskForm(
                        (current) => ({
                          ...current,
                          priority:
                            event
                              .target
                              .value as StudyTaskPriority,
                        }),
                      );
                    }}
                  >
                    <option value="LOW">
                      Low
                    </option>
                    <option value="MEDIUM">
                      Medium
                    </option>
                    <option value="HIGH">
                      High
                    </option>
                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>
                </label>

                <label>
                  Planned minutes
                  <input
                    required
                    min={5}
                    max={1440}
                    type="number"
                    value={
                      taskForm
                        .estimatedMinutes
                    }
                    onChange={(event) => {
                      setTaskForm(
                        (current) => ({
                          ...current,
                          estimatedMinutes:
                            event
                              .target
                              .value,
                        }),
                      );
                    }}
                  />
                </label>

                <label>
                  Scheduled for
                  <input
                    type="datetime-local"
                    value={
                      taskForm
                        .scheduledFor
                    }
                    onChange={(event) => {
                      setTaskForm(
                        (current) => ({
                          ...current,
                          scheduledFor:
                            event
                              .target
                              .value,
                        }),
                      );
                    }}
                  />
                </label>

                <label>
                  Due at
                  <input
                    type="datetime-local"
                    value={taskForm.dueAt}
                    onChange={(event) => {
                      setTaskForm(
                        (current) => ({
                          ...current,
                          dueAt:
                            event
                              .target
                              .value,
                        }),
                      );
                    }}
                  />
                </label>
              </div>

              {selectedPlan && (
                <p className="planner-form-note">
                  Adding to{" "}
                  <strong>
                    {selectedPlan.name}
                  </strong>
                </p>
              )}

              <button
                className="planner-submit"
                disabled={saving}
                type="submit"
              >
                {saving ? (
                  <LoaderCircle
                    className="planner-spinner"
                    size={16}
                  />
                ) : (
                  <Plus size={16} />
                )}
                Create task
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
