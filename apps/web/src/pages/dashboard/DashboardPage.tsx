
import { useAuth } from "@aimers/auth";
import {
  Activity, AppWindow, ArrowRight, ArrowUpRight, BarChart3, BookOpenCheck,
  Bot, Brain, Check, ChevronRight, CircleCheckBig, Clock3, FileText, Flame, Globe2,
  Headphones, Library, LoaderCircle, Mic2, Pin, Play, Plus, Radio, RefreshCw,
  Sparkles, Target, TrendingUp, Video, Zap,
} from "lucide-react";
import {
  type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useState,
} from "react";
import { Link } from "react-router-dom";
import { getAcademicWorkspace } from "../subjects/subjects.service";
import { getPlannerWorkspace } from "../planner/planner.service";
import { getMockTestWorkspace } from "../mock-tests/mock-tests.service";
import {
  createNote,
  getNotesWorkspace,
} from "../notes/notes.service";
import type {
  NotesWorkspace,
} from "../notes/notes.types";
import {
  getResearchWorkspace,
} from "../research-ai/research-ai.service";
import type {
  ResearchWorkspace,
} from "../research-ai/research-ai.types";
import type {
  PlannerWorkspace,
  StudyTask,
} from "../planner/planner.types";
import type {
  MockTestWorkspace,
} from "../mock-tests/mock-tests.types";
import type {
  AcademicChapter, AcademicSyllabusSubject, AcademicWorkspace,
  ChapterProgress, TopicMastery,
} from "../subjects/subjects.types";
import "./dashboard.css";

type Tone = "orange" | "blue" | "violet" | "pink" | "green";
type SignalTone = "danger" | "warning" | "success";

interface ChapterEntry {
  subject: AcademicSyllabusSubject;
  chapter: AcademicChapter;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function assessed(value: TopicMastery | undefined): value is TopicMastery {
  return Boolean(
    value &&
    (value.attempts > 0 || value.lastAssessedAt || value.level !== "NOT_ASSESSED"),
  );
}

function chapterPriority(progress: ChapterProgress | undefined): number {
  if (progress?.state === "IN_PROGRESS") return 0;
  if (!progress || progress.state === "NOT_STARTED") return 1;
  if (progress.state === "SKIPPED") return 2;
  return 3;
}

function signalTone(score: number, isAssessed: boolean): SignalTone {
  if (!isAssessed) return "warning";
  if (score < 40) return "danger";
  if (score < 60) return "warning";
  return "success";
}

function formatStudyMinutes(
  minutes: number,
): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  const remainder =
    minutes % 60;

  return remainder > 0
    ? `${hours}h ${remainder}m`
    : `${hours}h`;
}

function formatChartMinutes(
  minutes: number,
): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours =
    minutes / 60;

  return Number.isInteger(hours)
    ? `${hours}h`
    : `${hours.toFixed(1)}h`;
}

function formatNoteUpdated(
  value: string,
): string {
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();

  if (!Number.isFinite(elapsed) || elapsed < 0) {
    return "Recently";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (elapsed < minute) {
    return "Just now";
  }

  if (elapsed < hour) {
    return `${Math.floor(elapsed / minute)}m ago`;
  }

  if (elapsed < day) {
    return `${Math.floor(elapsed / hour)}h ago`;
  }

  if (elapsed < 7 * day) {
    return `${Math.floor(elapsed / day)}d ago`;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    },
  ).format(date);
}

function formatResearchUpdated(
  value: string,
): string {
  return formatNoteUpdated(value);
}

function studyDayLabel(
  dateKey: string,
): string {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      weekday: "short",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      `${dateKey}T00:00:00Z`,
    ),
  );
}

function makeMinutePoints(
  values: readonly number[],
  maximum: number,
): string {
  const safeMaximum =
    Math.max(
      1,
      maximum,
    );

  if (values.length === 0) {
    return "0,112 420,112";
  }

  if (values.length === 1) {
    const y =
      112 -
      (
        Math.max(
          0,
          values[0],
        ) /
        safeMaximum
      ) *
      96;

    return `0,${y} 420,${y}`;
  }

  return values
    .map(
      (
        value,
        index,
      ) => {
        const x =
          (
            index /
            (
              values.length -
              1
            )
          ) *
          420;

        const y =
          112 -
          (
            Math.max(
              0,
              value,
            ) /
            safeMaximum
          ) *
          96;

        return `${x},${y}`;
      },
    )
    .join(" ");
}

function dateKeyInTimeZone(
  value: string | null,
  timeZone: string,
): string | null {
  if (!value) {
    return null;
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      new Date(value),
    );

  const values =
    new Map(
      parts.map(
        (part) => [
          part.type,
          part.value,
        ],
      ),
    );

  return [
    values.get("year"),
    values.get("month"),
    values.get("day"),
  ].join("-");
}

function plannerTaskRank(
  task: StudyTask,
  todayDateKey: string,
  timeZone: string,
): number {
  if (
    task.status === "COMPLETED"
  ) {
    return 4;
  }

  const dueTime =
    task.dueAt
      ? new Date(
          task.dueAt,
        ).getTime()
      : null;

  if (
    dueTime !== null &&
    dueTime < Date.now()
  ) {
    return 0;
  }

  const scheduledToday =
    dateKeyInTimeZone(
      task.scheduledFor,
      timeZone,
    ) === todayDateKey;

  const dueToday =
    dateKeyInTimeZone(
      task.dueAt,
      timeZone,
    ) === todayDateKey;

  if (
    scheduledToday ||
    dueToday
  ) {
    return 1;
  }

  if (
    task.status === "IN_PROGRESS"
  ) {
    return 2;
  }

  return 3;
}

function makePoints(values: readonly number[]): string {
  if (values.length < 2) return "0,112 420,112";
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 420;
      const y = 112 - clamp(value) * 0.92;
      return `${x},${y}`;
    })
    .join(" ");
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  change,
  icon,
  tone,
  progress,
  to = "/subjects",
}: {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  change: string;
  icon: ReactNode;
  tone: Tone;
  progress?: number;
  to?: string;
}) {
  return (
    <article className={`ref-metric ref-${tone}`}>
      <header>
        <span>{icon}</span>
        <small>{label}</small>
        <Link to={to} aria-label={`Open ${label}`}>
          <ArrowUpRight size={12} />
        </Link>
      </header>

      <div className="ref-metric-value">
        <strong>{value}</strong>
        {unit && <span>{unit}</span>}
      </div>

      <p>{detail}</p>

      {typeof progress === "number" ? (
        <div className="ref-metric-track">
          <i style={{ width: `${clamp(progress)}%` }} />
        </div>
      ) : (
        <div className="ref-metric-divider" />
      )}

      <small>{change}</small>
    </article>
  );
}

function Panel({
  title, eyebrow, action, children, className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`ref-panel ${className}`}>
      <header className="ref-panel-heading">
        <div>
          {eyebrow && <span>{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </article>
  );
}

function ProgressRing({ value }: { value: number }) {
  const normalized = clamp(value);
  const style = { "--ref-ring": `${normalized * 3.6}deg` } as CSSProperties;

  return (
    <div className="ref-progress-ring" style={style}>
      <div>
        <strong>{normalized}%</strong>
        <span>Completed</span>
      </div>
    </div>
  );
}

function DashboardState({
  error, retry,
}: {
  error?: string;
  retry?: () => void;
}) {
  return (
    <section className={`ref-state ${error ? "error" : ""}`}>
      {error ? <Zap size={29} /> : <LoaderCircle className="ref-spin" size={29} />}
      <h1>{error ? "Dashboard data is unavailable" : "Loading your command centre"}</h1>
      <p>{error || "Connecting academic progress, mastery and practice data…"}</p>
      {retry && (
        <button type="button" onClick={retry}>
          <RefreshCw size={16} />
          Try again
        </button>
      )}
    </section>
  );
}

export function DashboardPage() {
  const { apiFetch, user } = useAuth();
  const [workspace, setWorkspace] = useState<AcademicWorkspace | null>(null);
  const [planner, setPlanner] = useState<PlannerWorkspace | null>(null);
  const [mockTests, setMockTests] = useState<MockTestWorkspace | null>(null);
  const [notes, setNotes] = useState<NotesWorkspace | null>(null);
  const [research, setResearch] = useState<ResearchWorkspace | null>(null);
  const [quickNoteTitle, setQuickNoteTitle] = useState("");
  const [quickNoteContent, setQuickNoteContent] = useState("");
  const [creatingQuickNote, setCreatingQuickNote] = useState(false);
  const [quickNoteMessage, setQuickNoteMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");

    try {
      const [
        academicResult,
        plannerResult,
        mockTestResult,
        notesResult,
        researchResult,
      ] = await Promise.all([
        getAcademicWorkspace(
          apiFetch,
        ),
        getPlannerWorkspace(
          apiFetch,
        ),
        getMockTestWorkspace(
          apiFetch,
        ),
        getNotesWorkspace(
          apiFetch,
          {
            status: "ACTIVE",
          },
        ),
        getResearchWorkspace(
          apiFetch,
        ),
      ]);

      setWorkspace(
        academicResult,
      );

      setPlanner(
        plannerResult,
      );

      setMockTests(
        mockTestResult,
      );

      setNotes(
        notesResult,
      );

      setResearch(
        researchResult,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const data = useMemo(() => {
    if (
      !workspace ||
      !planner ||
      !mockTests ||
      !notes ||
      !research
    ) {
      return null;
    }

    const subjects = workspace.syllabusVersion.subjects;
    const chapters: ChapterEntry[] = subjects.flatMap((subject) =>
      subject.units.flatMap((unit) =>
        unit.chapters.map((chapter) => ({ subject, chapter })),
      ),
    );

    const topics = chapters.flatMap(({ subject, chapter }) =>
      chapter.topics.map((topic) => ({ subject, chapter, topic })),
    );

    const progressByChapter = new Map(
      workspace.chapterProgress.map((progress) => [progress.chapterId, progress]),
    );

    const masteryByTopic = new Map(
      workspace.topicMastery.map((mastery) => [mastery.topicId, mastery]),
    );

    const overall = chapters.length === 0
      ? 0
      : clamp(
          chapters.reduce(
            (sum, item) =>
              sum + (progressByChapter.get(item.chapter.id)?.completionPercent ?? 0),
            0,
          ) / chapters.length,
        );

    const completed = chapters.filter(
      (item) => progressByChapter.get(item.chapter.id)?.state === "COMPLETED",
    ).length;

    const active = chapters.filter(
      (item) => progressByChapter.get(item.chapter.id)?.state === "IN_PROGRESS",
    ).length;

    const attempts =
      mockTests.attempts.reduce(
        (
          total,
          attempt,
        ) =>
          total +
          attempt.attemptedQuestions,
        0,
      );

    const correct =
      mockTests.attempts.reduce(
        (
          total,
          attempt,
        ) =>
          total +
          attempt.correctAnswers,
        0,
      );

    const accuracy =
      attempts === 0
        ? 0
        : clamp(
            (
              correct /
              attempts
            ) *
            100,
          );
    const assessedTopics = workspace.topicMastery.filter((item) => assessed(item));
    const mastery = assessedTopics.length === 0
      ? 0
      : clamp(
          assessedTopics.reduce((sum, item) => sum + item.masteryScore, 0) /
            assessedTopics.length,
        );

    const mastered = workspace.topicMastery.filter(
      (item) => item.level === "MASTERED",
    ).length;

    const subjectProgress = subjects.map((subject) => {
      const subjectChapters = subject.units.flatMap((unit) => unit.chapters);
      const value = subjectChapters.length === 0
        ? 0
        : clamp(
            subjectChapters.reduce(
              (sum, chapter) =>
                sum + (progressByChapter.get(chapter.id)?.completionPercent ?? 0),
              0,
            ) / subjectChapters.length,
          );

      return {
        id: subject.id,
        name: subject.subject.name,
        code: subject.subject.code,
        value,
      };
    });

    const academicMissions = [...chapters]
      .sort((left, right) => {
        const leftProgress = progressByChapter.get(left.chapter.id);
        const rightProgress = progressByChapter.get(right.chapter.id);
        const priority = chapterPriority(leftProgress) - chapterPriority(rightProgress);

        if (priority !== 0) return priority;

        return (
          (rightProgress?.completionPercent ?? 0) -
          (leftProgress?.completionPercent ?? 0)
        );
      })
      .slice(0, 4)
      .map(({ subject, chapter }) => {
        const progress = progressByChapter.get(chapter.id);
        return {
          id: chapter.id,
          title: `${subject.subject.name}: ${chapter.name}`,
          detail: `${chapter.topics.length} topics · ${progress?.completionPercent ?? 0}% complete`,
          completed: progress?.state === "COMPLETED",
          percent:
            progress?.completionPercent ?? 0,
          source: "academic" as const,
        };
      });

    const academicWeakTopics = topics
      .map(({ subject, topic }) => {
        const record =
          masteryByTopic.get(
            topic.id,
          );

        const isAssessed =
          assessed(record);

        const score =
          record?.masteryScore ??
          0;

        return {
          id:
            `academic-${topic.id}`,

          topic:
            topic.name,

          subject:
            subject.subject.name,

          detail:
            subject.subject.name,

          assessed:
            isAssessed,

          score,

          tone:
            signalTone(
              score,
              isAssessed,
            ),

          source:
            "academic" as const,
        };
      })
      .filter(
        (item) =>
          !item.assessed ||
          item.score < 60,
      )
      .sort(
        (
          left,
          right,
        ) => {
          if (
            left.assessed !==
            right.assessed
          ) {
            return left.assessed
              ? -1
              : 1;
          }

          return (
            left.score -
            right.score
          );
        },
      );

    const mockWeakTopics =
      mockTests.weakTopics.map(
        (item) => ({
          id:
            `mock-${item.topicId}`,

          topic:
            item.topic,

          subject:
            item.subject,

          detail:
            `${item.subject} · ${item.occurrences} weak signal${item.occurrences === 1 ? "" : "s"}`,

          assessed: true,

          score:
            item.averageAccuracy,

          tone:
            signalTone(
              item.averageAccuracy,
              true,
            ),

          source:
            "mock-tests" as const,
        }),
      );

    const mockWeakTopicIds =
      new Set(
        mockTests.weakTopics.map(
          (item) =>
            item.topicId,
        ),
      );

    const weakTopics = [
      ...mockWeakTopics,
      ...academicWeakTopics.filter(
        (item) =>
          !mockWeakTopicIds.has(
            item.id.replace(
              "academic-",
              "",
            ),
          ),
      ),
    ].slice(0, 4);

    const {
      timeZone,
      todayDateKey,
    } = planner.activity;

    const priorityOrder = {
      URGENT: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    } as const;

    const completedToday =
      planner.tasks.filter(
        (task) =>
          task.status ===
            "COMPLETED" &&
          dateKeyInTimeZone(
            task.completedAt,
            timeZone,
          ) === todayDateKey,
      );

    const activePlannerTasks =
      planner.tasks.filter(
        (task) =>
          task.status === "TODO" ||
          task.status ===
            "IN_PROGRESS",
      );

    const plannerMissions = [
      ...activePlannerTasks,
      ...completedToday,
    ]
      .sort(
        (left, right) => {
          const rankDifference =
            plannerTaskRank(
              left,
              todayDateKey,
              timeZone,
            ) -
            plannerTaskRank(
              right,
              todayDateKey,
              timeZone,
            );

          if (
            rankDifference !== 0
          ) {
            return rankDifference;
          }

          const priorityDifference =
            priorityOrder[
              left.priority
            ] -
            priorityOrder[
              right.priority
            ];

          if (
            priorityDifference !== 0
          ) {
            return priorityDifference;
          }

          return (
            new Date(
              left.scheduledFor ??
              left.dueAt ??
              left.createdAt,
            ).getTime() -
            new Date(
              right.scheduledFor ??
              right.dueAt ??
              right.createdAt,
            ).getTime()
          );
        },
      )
      .slice(0, 4)
      .map((task) => ({
        id: task.id,
        title: task.title,

        detail:
          `${task.type.replaceAll("_", " ")} · ${task.estimatedMinutes} min · ${task.completionPercent}% complete`,

        completed:
          task.status ===
          "COMPLETED",

        percent:
          task.completionPercent,

        source: "planner" as const,
      }));

    const missions =
      plannerMissions.length > 0
        ? plannerMissions
        : academicMissions;

    const missionProgress =
      missions.length === 0
        ? 0
        : clamp(
            missions.reduce(
              (
                total,
                mission,
              ) =>
                total +
                mission.percent,
              0,
            ) /
            missions.length,
          );

    const missionSource =
      plannerMissions.length > 0
        ? "planner"
        : "academic";

    const activeStudySession =
      planner.sessions.find(
        (session) =>
          session.status ===
          "ACTIVE",
      ) ?? null;

    const studyDays =
      planner.activity.dailyMinutes.map(
        (
          day,
          index,
          days,
        ) => ({
          ...day,

          label:
            index ===
            days.length - 1
              ? "Today"
              : studyDayLabel(
                  day.dateKey,
                ),
        }),
      );

    const studySeries =
      studyDays.map(
        (day) =>
          day.durationMinutes,
      );

    const focusSeries =
      studyDays.map(
        (day) =>
          day.focusMinutes,
      );

    const studyChartMaximum =
      Math.max(
        30,
        ...studySeries,
        ...focusSeries,
      );

    const studyChartLabels = [
      studyChartMaximum,
      studyChartMaximum * 0.75,
      studyChartMaximum * 0.5,
      studyChartMaximum * 0.25,
      0,
    ].map(
      formatChartMinutes,
    );

    const mockScoreSeries =
      mockTests.trend.map(
        (item) =>
          item.percentage,
      );

    const latestMockScore =
      mockScoreSeries.length > 0
        ? mockScoreSeries[
            mockScoreSeries.length -
            1
          ]
        : null;

    const previousMockScore =
      mockScoreSeries.length > 1
        ? mockScoreSeries[
            mockScoreSeries.length -
            2
          ]
        : null;

    const scoreMovement =
      latestMockScore !== null &&
      previousMockScore !== null
        ? latestMockScore -
          previousMockScore
        : null;

    const predictionPoints =
      makePoints(
        mockScoreSeries,
      );

    const weakestSubject = [...subjectProgress].sort(
      (left, right) => left.value - right.value,
    )[0] ?? null;

    const recentNotes =
      [...notes.notes]
        .sort((left, right) => {
          const pinDifference =
            Number(right.isPinned) -
            Number(left.isPinned);

          if (pinDifference !== 0) {
            return pinDifference;
          }

          return (
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime()
          );
        })
        .slice(0, 4);


    const recentResearchProjects =
      [...research.projects]
        .sort((left, right) => {
          const pinDifference =
            Number(right.isPinned) -
            Number(left.isPinned);

          if (pinDifference !== 0) {
            return pinDifference;
          }

          return (
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime()
          );
        })
        .slice(0, 4);

    const recentResearchSources =
      [...research.recentSources]
        .sort((left, right) => {
          const pinDifference =
            Number(right.isPinned) -
            Number(left.isPinned);

          if (pinDifference !== 0) {
            return pinDifference;
          }

          return (
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime()
          );
        })
        .slice(0, 4);

    return {
      subjects,
      chapters,
      topics,
      overall,
      completed,
      active,
      attempts,
      correct,
      accuracy,
      mastery,
      mastered,
      assessedCount: assessedTopics.length,
      subjectProgress,
      missions,
      missionProgress,
      missionSource,
      weakTopics,
      studyDays,
      studySeries,
      focusSeries,
      studyChartMaximum,
      studyChartLabels,
      studyPoints:
        makeMinutePoints(
          studySeries,
          studyChartMaximum,
        ),
      focusPoints:
        makeMinutePoints(
          focusSeries,
          studyChartMaximum,
        ),
      weakestSubject,
      currentMission: missions.find((item) => !item.completed) ?? missions[0] ?? null,
      studyStreakDays:
        planner.activity.studyStreakDays,
      todayStudyMinutes:
        planner.activity.todayMinutes,
      weeklyStudyMinutes:
        planner.activity.weeklyMinutes,
      completedSessionCount:
        planner.activity.completedSessionCount,
      activeStudySession,
      mockSummary:
        mockTests.summary,
      mockTrendCount:
        mockTests.trend.length,
      latestMockScore,
      scoreMovement,
      predictionPoints,
      mockWeakTopicCount:
        mockWeakTopics.length,
      weakTopicLink:
        mockWeakTopics.length > 0
          ? "/mock-tests"
          : "/subjects",
      recentNotes,
      recentResearchProjects,
      recentResearchSources,
    };
  }, [
    mockTests,
    notes,
    planner,
    research,
    workspace,
  ]);

  const handleQuickNote =
    async () => {
      const nextTitle =
        quickNoteTitle.trim();

      const nextContent =
        quickNoteContent.trim();

      if (
        !nextTitle &&
        !nextContent
      ) {
        return;
      }

      setCreatingQuickNote(true);
      setQuickNoteMessage("");
      setError("");

      try {
        await createNote(
          apiFetch,
          {
            title:
              nextTitle ||
              "Quick note",
            content:
              quickNoteContent,
            contentFormat:
              "MARKDOWN",
            sourceType:
              "MANUAL",
          },
        );

        setQuickNoteTitle("");
        setQuickNoteContent("");

        setNotes(
          await getNotesWorkspace(
            apiFetch,
            {
              status: "ACTIVE",
            },
          ),
        );

        setQuickNoteMessage(
          "Quick note saved",
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to save the quick note.",
        );
      } finally {
        setCreatingQuickNote(false);
      }
    };

  if (loading) {
    return (
      <div className="ref-dashboard state-page">
        <DashboardState />
      </div>
    );
  }

  if (
    !workspace ||
    !planner ||
    !mockTests ||
    !notes ||
    !research ||
    !data
  ) {
    return (
      <div className="ref-dashboard state-page">
        <DashboardState
          error={error || "No academic workspace is available."}
          retry={() => void load()}
        />
      </div>
    );
  }

  const preferredName =
    user?.displayName?.trim() ||
    user?.firstName?.trim() ||
    user?.email
      ?.split("@")[0]
      ?.trim() ||
    "Student";

  const firstName =
    preferredName
      .split(/\s+/)[0] ||
    "Student";
  const programme = workspace.syllabusVersion.programme;
  const missionCompleted = data.missions.filter((item) => item.completed).length;
  const subjectRing = {
    "--ref-subject-ring": `${data.overall * 3.6}deg`,
  } as CSSProperties;

  return (
    <div className="ref-dashboard">
      {error && (
        <div className="ref-inline-error" role="alert">
          <Zap size={15} />
          {error}
        </div>
      )}

      <section className="ref-metrics">
        <MetricCard
          label="Study Streak"
          value={`${data.studyStreakDays}`}
          unit="days"
          detail={`${data.completedSessionCount} completed sessions`}
          change={`Timezone: ${planner.activity.timeZone}`}
          icon={<Flame size={17} />}
          tone="orange"
          to="/planner"
        />
        <MetricCard
          label="AI Score"
          value={`${data.mastery}%`}
          detail="Current topic mastery"
          change={`${data.assessedCount} topics assessed`}
          icon={<BarChart3 size={17} />}
          tone="violet"
          progress={data.mastery}
          to="/subjects"
        />
        <MetricCard
          label="Study Time"
          value={formatStudyMinutes(data.todayStudyMinutes)}
          detail="Completed study time today"
          change={`${formatStudyMinutes(data.weeklyStudyMinutes)} this week`}
          icon={<Clock3 size={17} />}
          tone="blue"
          to="/planner"
        />
        <MetricCard
          label="Questions Solved"
          value={`${data.attempts}`}
          detail={`${data.correct} correct answers`}
          change={`${data.mockSummary.attemptCount} evaluated mock test${data.mockSummary.attemptCount === 1 ? "" : "s"}`}
          icon={<CircleCheckBig size={17} />}
          tone="pink"
          to="/mock-tests"
        />
        <MetricCard
          label="Accuracy"
          value={`${data.accuracy}%`}
          detail={
            data.attempts > 0
              ? "Across evaluated mock tests"
              : "No evaluated tests yet"
          }
          change="Calculated from real test answers"
          icon={<Target size={17} />}
          tone="green"
          progress={data.accuracy}
          to="/mock-tests"
        />
      </section>

      {data.activeStudySession && (
        <section className="ref-active-session">
          <div>
            <span>
              <Flame size={18} />
            </span>

            <div>
              <small>
                ACTIVE STUDY SESSION
              </small>

              <strong>
                {data.activeStudySession.studyTask?.title ?? "Focused study session"}
              </strong>

              <p>
                Session timer is running in your Planner workspace.
              </p>
            </div>
          </div>

          <Link to="/planner">
            Open Planner
            <ArrowRight size={14} />
          </Link>
        </section>
      )}

      <section className="ref-main">
        <div className="ref-primary">
          <section className="ref-top-grid">
            <Panel
              title="Today's Mission"
              eyebrow={data.missionSource === "planner" ? "Live planner queue" : "Live chapter queue"}
              className="ref-mission-panel"
              action={
                <span className="ref-tag">
                  {missionCompleted}/{data.missions.length} completed
                </span>
              }
            >
              <div className="ref-mission-content">
                <div className="ref-mission-list">
                  {data.missions.map((mission) => (
                    <section key={mission.id} className={mission.completed ? "done" : ""}>
                      <span>
                        {mission.completed ? <Check size={13} /> : <Play size={12} />}
                      </span>
                      <div>
                        <strong>{mission.title}</strong>
                        <small>{mission.detail}</small>
                      </div>
                      <ChevronRight size={15} />
                    </section>
                  ))}
                </div>
                <ProgressRing value={data.missionProgress} />
              </div>

              <footer className="ref-mission-footer">
                <span>
                  <CircleCheckBig size={15} />
                  {data.missionSource === "planner"
                    ? "Synced with Study Planner"
                    : "Synced with Subjects"}
                </span>

                <Link
                  to={
                    data.missionSource === "planner"
                      ? "/planner"
                      : "/subjects"
                  }
                >
                  Continue Mission
                  <ArrowRight size={14} />
                </Link>
              </footer>
            </Panel>

            <Panel
              title="AI Mentor"
              eyebrow="Live recommendation"
              className="ref-mentor-panel"
              action={<Sparkles size={18} />}
            >
              <div className="ref-chat">
                <div className="assistant">
                  <span><Bot size={15} /></span>
                  <p>
                    {data.weakTopics[0] ? (
                      <>
                        {firstName}, focus on <strong>{data.weakTopics[0].topic}</strong>{" "}
                        in {data.weakTopics[0].subject}.
                      </>
                    ) : (
                      <>{firstName}, no weak topic is currently detected.</>
                    )}
                  </p>
                </div>

                <div className="user">
                  Build today&apos;s best study sequence.
                </div>

                <div className="assistant compact">
                  <span><TrendingUp size={15} /></span>
                  <p>
                    {data.currentMission ? (
                      <>Begin with <strong>{data.currentMission.title}</strong>.</>
                    ) : (
                      "Your current queue is complete."
                    )}
                  </p>
                </div>
              </div>

              <div className="ref-mentor-input">
                <span>Ask AIMERS anything…</span>
                <Mic2 size={16} />
                <Link to="/ai-mentor">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </Panel>
          </section>

          <section className="ref-analysis-grid">
            <Panel
              title="Study Analytics"
              eyebrow="Last 7 days · completed sessions"
              action={
                <span className="ref-tag">
                  {formatStudyMinutes(data.weeklyStudyMinutes)} week
                </span>
              }
            >
              <div className="ref-chart ref-session-chart">
                <div>
                  {data.studyChartLabels.map(
                    (label) => (
                      <span key={label}>
                        {label}
                      </span>
                    ),
                  )}
                </div>

                <section>
                  <svg
                    viewBox="0 0 420 120"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Seven-day study and focus time"
                  >
                    <polyline
                      className="study-line"
                      points={data.studyPoints}
                      fill="none"
                      strokeWidth="4"
                      vectorEffect="non-scaling-stroke"
                    />

                    <polyline
                      className="focus-line"
                      points={data.focusPoints}
                      fill="none"
                      strokeWidth="3"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  <div>
                    {data.studyDays.map(
                      (day) => (
                        <span key={day.dateKey}>
                          {day.label}
                        </span>
                      ),
                    )}
                  </div>
                </section>
              </div>

              <footer className="ref-chart-legend">
                <span>
                  <i className="study" />
                  Study Time
                </span>

                <span>
                  <i className="focus" />
                  Focus Time
                </span>
              </footer>

              <div className="ref-chart-summary">
                <span>
                  Today
                  <strong>
                    {formatStudyMinutes(data.todayStudyMinutes)}
                  </strong>
                </span>

                <span>
                  This week
                  <strong>
                    {formatStudyMinutes(data.weeklyStudyMinutes)}
                  </strong>
                </span>

                <span>
                  Sessions
                  <strong>
                    {data.completedSessionCount}
                  </strong>
                </span>
              </div>
            </Panel>

            <Panel title="Subject Wise Progress" eyebrow="Live syllabus data">
              <div className="ref-subject-progress">
                <div className="ref-subject-ring" style={subjectRing}>
                  <div>
                    <strong>{data.overall}%</strong>
                    <span>Overall</span>
                  </div>
                </div>

                <div className="ref-subject-list">
                  {data.subjectProgress.map((subject) => (
                    <span key={subject.id}>
                      <i
                        className={
                          subject.code.toLowerCase().includes("phys")
                            ? "physics"
                            : subject.code.toLowerCase().includes("chem")
                              ? "chemistry"
                              : "biology"
                        }
                      />
                      {subject.name}
                      <strong>{subject.value}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel
              title="Weak Topics"
              eyebrow={
                data.mockWeakTopicCount > 0
                  ? "Mock-test + mastery signals"
                  : "Mastery signals"
              }
              action={
                <span className="ref-tag">
                  {data.mockWeakTopicCount > 0
                    ? "Tests connected"
                    : "Live"}
                </span>
              }
            >
              <div className="ref-weak-list">
                {data.weakTopics.map((item) => (
                  <section key={item.id}>
                    <span className={item.tone}><Zap size={13} /></span>
                    <div>
                      <strong>{item.topic}</strong>
                      <small>{item.detail}</small>
                    </div>
                    <b className={item.tone}>
                      {item.assessed ? `${item.score}%` : "Not assessed"}
                    </b>
                  </section>
                ))}
              </div>

              <Link className="ref-panel-link" to={data.weakTopicLink}>
                Review weak-topic evidence
              </Link>
            </Panel>

            <Panel
              title="Predicted Performance"
              eyebrow="Observed mock-test evidence"
              action={
                <span
                  className={
                    data.mockSummary.predictionReady
                      ? "ref-tag ready"
                      : "ref-tag"
                  }
                >
                  {data.mockSummary.predictionReady
                    ? "Baseline ready"
                    : `${data.mockSummary.attemptCount}/3 tests`}
                </span>
              }
            >
              {data.mockSummary.attemptCount === 0 ? (
                <div className="ref-prediction">
                  <Target size={28} />
                  <strong>No valid forecast yet</strong>
                  <p>
                    Real mock-test history is required before showing
                    performance evidence.
                  </p>
                </div>
              ) : (
                <div className="ref-prediction has-data">
                  <div className="ref-prediction-head">
                    <span>
                      <Target size={18} />
                    </span>

                    <div>
                      <small>LATEST OBSERVED SCORE</small>
                      <strong>{data.latestMockScore}%</strong>
                    </div>
                  </div>

                  <div className="ref-prediction-stats">
                    <span>
                      Average
                      <strong>
                        {data.mockSummary.averagePercentage}%
                      </strong>
                    </span>

                    <span>
                      Best
                      <strong>
                        {data.mockSummary.bestPercentage}%
                      </strong>
                    </span>

                    <span>
                      Movement
                      <strong
                        className={
                          data.scoreMovement === null
                            ? ""
                            : data.scoreMovement >= 0
                              ? "positive"
                              : "negative"
                        }
                      >
                        {data.scoreMovement === null
                          ? "—"
                          : `${data.scoreMovement > 0 ? "+" : ""}${data.scoreMovement}%`}
                      </strong>
                    </span>
                  </div>

                  {data.mockTrendCount > 1 && (
                    <div className="ref-prediction-trend">
                      <svg
                        viewBox="0 0 420 120"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label="Observed mock-test score movement"
                      >
                        <polyline
                          points={data.predictionPoints}
                          fill="none"
                          strokeWidth="4"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                  )}

                  <p>
                    {data.mockSummary.predictionReady
                      ? "Assessment baseline ready. No rank prediction is generated until a validated prediction model is added."
                      : `${Math.max(0, 3 - data.mockSummary.attemptCount)} more evaluated test${3 - data.mockSummary.attemptCount === 1 ? "" : "s"} required before enabling prediction readiness.`}
                  </p>
                </div>
              )}

              <Link className="ref-panel-link" to="/mock-tests">
                Open mock-test analytics
              </Link>
            </Panel>
          </section>

          <section className="ref-notes-dashboard">
            <Panel
              title="Connected Notes"
              eyebrow="Live knowledge workspace"
              className="ref-notes-panel"
              action={
                <Link
                  className="ref-notes-open"
                  to="/notes"
                >
                  Open Notes
                  <ArrowUpRight size={13} />
                </Link>
              }
            >
              <div className="ref-notes-summary">
                <span>
                  <FileText size={14} />
                  <small>Active</small>
                  <strong>
                    {notes.summary.activeNotes}
                  </strong>
                </span>

                <span>
                  <Pin size={14} />
                  <small>Pinned</small>
                  <strong>
                    {notes.summary.pinnedNotes}
                  </strong>
                </span>

                <span>
                  <BookOpenCheck size={14} />
                  <small>Words</small>
                  <strong>
                    {notes.summary.totalWords.toLocaleString(
                      "en-IN",
                    )}
                  </strong>
                </span>
              </div>

              <div className="ref-notes-dashboard-grid">
                <form
                  className="ref-quick-note-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleQuickNote();
                  }}
                >
                  <header>
                    <span>
                      <Plus size={14} />
                    </span>

                    <div>
                      <strong>
                        Quick capture
                      </strong>

                      <small>
                        Save an idea without leaving the dashboard.
                      </small>
                    </div>
                  </header>

                  <input
                    value={quickNoteTitle}
                    maxLength={160}
                    placeholder="Note title"
                    onChange={(event) => {
                      setQuickNoteTitle(
                        event.target.value,
                      );
                      setQuickNoteMessage("");
                    }}
                  />

                  <textarea
                    value={quickNoteContent}
                    rows={4}
                    placeholder="Write a thought, formula, doubt or revision point…"
                    onChange={(event) => {
                      setQuickNoteContent(
                        event.target.value,
                      );
                      setQuickNoteMessage("");
                    }}
                  />

                  <footer>
                    <small>
                      Markdown supported
                    </small>

                    <button
                      type="submit"
                      disabled={
                        creatingQuickNote ||
                        (
                          !quickNoteTitle.trim() &&
                          !quickNoteContent.trim()
                        )
                      }
                    >
                      {creatingQuickNote ? (
                        <LoaderCircle
                          className="ref-spin"
                          size={14}
                        />
                      ) : (
                        <Plus size={14} />
                      )}

                      Save note
                    </button>
                  </footer>

                  {quickNoteMessage && (
                    <p className="ref-quick-note-message">
                      <Check size={13} />
                      {quickNoteMessage}
                    </p>
                  )}
                </form>

                <div className="ref-recent-notes">
                  <header>
                    <div>
                      <strong>
                        Recent and pinned
                      </strong>

                      <small>
                        Pinned notes stay at the top.
                      </small>
                    </div>

                    <Link to="/notes">
                      View all
                      <ArrowRight size={12} />
                    </Link>
                  </header>

                  {data.recentNotes.length ===
                  0 ? (
                    <div className="ref-recent-notes-empty">
                      <FileText size={24} />

                      <strong>
                        No active notes yet
                      </strong>

                      <small>
                        Create your first note from the quick capture form.
                      </small>
                    </div>
                  ) : (
                    <div className="ref-recent-notes-list">
                      {data.recentNotes.map(
                        (note) => (
                          <Link
                            key={note.id}
                            className="ref-recent-note"
                            to="/notes"
                            aria-label={`Open Notes workspace for ${note.title}`}
                          >
                            <header>
                              <strong>
                                {note.title}
                              </strong>

                              {note.isPinned && (
                                <Pin size={12} />
                              )}
                            </header>

                            <p>
                              {note.excerpt ||
                                "Empty note"}
                            </p>

                            <footer>
                              <span>
                                {note.subject?.name ||
                                  note.folder?.name ||
                                  "General note"}
                              </span>

                              <small>
                                {formatNoteUpdated(
                                  note.updatedAt,
                                )}
                              </small>
                            </footer>
                          </Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </section>

          <section className="ref-quick-actions">
            <header><h2>Quick Actions</h2></header>
            <div>
              <Link to="/mock-tests"><Target size={16} />Mock Test</Link>
              <Link to="/flashcards"><BookOpenCheck size={16} />Flashcards</Link>
              <Link to="/ai-mentor"><Bot size={16} />AI Doubt Solver</Link>
              <Link to="/notes"><FileText size={16} />Quick Note</Link>
              <Link to="/research-ai"><Sparkles size={16} />Research AI</Link>
              <Link to="/memory-engine"><Brain size={16} />Memory Review</Link>
              <Link to="/question-bank"><Library size={16} />Question Bank</Link>
              <Link to="/planner"><Clock3 size={16} />Study Planner</Link>
              <Link to="/focus-room"><Headphones size={16} />Focus Music</Link>
            </div>
          </section>
        </div>

        <aside className="ref-secondary">
          <Panel
            title="AIMERS Brain"
            eyebrow="Your cognitive intelligence map"
            className="ref-brain-panel"
            action={<span className="ref-live"><i />Live</span>}
          >
            <div className="ref-brain-map">
              <div className="ref-brain-signals left">
                <span>Syllabus Engine<strong>{data.overall}%</strong></span>
                <span>Mastery Engine<strong>{data.mastery}%</strong></span>
                <span>Accuracy Core<strong>{data.accuracy}%</strong></span>
                <span>Knowledge Map<strong>{data.assessedCount}</strong></span>
              </div>

              <div className="ref-brain-visual">
                <div className="orbit one" />
                <div className="orbit two" />
                <div className="orbit three" />
                <Brain size={126} />
                <i className="node one" />
                <i className="node two" />
                <i className="node three" />
                <i className="node four" />
              </div>

              <div className="ref-brain-signals right">
                <span>Subjects<strong>{data.subjects.length}</strong></span>
                <span>Chapters<strong>{data.chapters.length}</strong></span>
                <span>Questions<strong>{data.attempts}</strong></span>
                <span>Study Sessions<strong>{data.completedSessionCount}</strong></span>
              </div>
            </div>

            <footer className="ref-brain-status">
              <span><i />Academic systems connected</span>
              <small>{programme.name}</small>
            </footer>
          </Panel>

          <section className="ref-insight-grid">
            <Panel title="AI Insights" eyebrow="Personalized for you">
              <div className="ref-insight">
                <div>
                  <p>Current priority</p>
                  <strong>{data.weakestSubject?.name ?? programme.name}</strong>
                  <small>
                    {data.weakestSubject
                      ? `${data.weakestSubject.name} is currently at ${data.weakestSubject.value}% progress.`
                      : "Continue building syllabus coverage."}
                  </small>
                </div>
                <div className="ref-focus-dial">
                  <span>NOW</span><Target size={27} /><span>NEXT</span>
                </div>
              </div>
            </Panel>

            <Panel
              title="Digital Activity Monitor"
              eyebrow="With your consent"
              action={<span className="ref-offline">Not connected</span>}
            >
              <div className="ref-activity-list">
                <span><Globe2 size={14} />Study Websites<strong>—</strong></span>
                <span><Video size={14} />YouTube Education<strong>—</strong></span>
                <span><AppWindow size={14} />Notes Applications<strong>—</strong></span>
                <span><BookOpenCheck size={14} />Practice Platforms<strong>—</strong></span>
                <span><Activity size={14} />Other Applications<strong>—</strong></span>
              </div>

              <Link className="ref-panel-link" to="/digital-activity">
                Configure activity tracking
              </Link>
            </Panel>
          </section>

          <section className="ref-secondary-lower">
            <Panel title="Memory Engine" eyebrow="Real mastery status" className="ref-memory">
              <div className="ref-memory-score">
                <strong>{data.mastery}%</strong><span>Mastery Score</span>
              </div>
              <div className="ref-memory-track">
                <span style={{ width: `${data.mastery}%` }} />
              </div>
              <footer>
                <span>{data.mastered} mastered</span>
                <span>{data.assessedCount} assessed</span>
              </footer>
            </Panel>

            <Panel
              title="AI Voice Assistant"
              eyebrow="Open voice workspace"
              className="ref-voice"
            >
              <Link to="/ai-mentor" aria-label="Open AI voice assistant">
                <Radio size={20} />
                <span><Mic2 size={29} /></span>
              </Link>
            </Panel>
          </section>
        </aside>
      </section>

      <section className="ref-research-dashboard">
        <Panel
          title="Research AI"
          eyebrow="Connected evidence workspace"
          className="ref-research-panel"
          action={
            <Link
              className="ref-research-open"
              to="/research-ai"
            >
              Open Research AI
              <ArrowUpRight size={13} />
            </Link>
          }
        >
          <div className="ref-research-summary">
            <span>
              <Library size={14} />
              <small>Active</small>
              <strong>
                {research.summary.activeProjects}
              </strong>
            </span>

            <span>
              <FileText size={14} />
              <small>Ready sources</small>
              <strong>
                {research.summary.readySources}
              </strong>
            </span>

            <span>
              <Sparkles size={14} />
              <small>Threads</small>
              <strong>
                {research.summary.totalThreads}
              </strong>
            </span>

            <span>
              <Brain size={14} />
              <small>Knowledge nodes</small>
              <strong>
                {research.summary.totalNodes}
              </strong>
            </span>
          </div>

          <div className="ref-research-dashboard-grid">
            <section className="ref-research-projects">
              <header>
                <div>
                  <strong>
                    Recent projects
                  </strong>

                  <small>
                    Pinned and recently updated research.
                  </small>
                </div>

                <Link to="/research-ai">
                  View all
                  <ArrowRight size={12} />
                </Link>
              </header>

              {data.recentResearchProjects.length ===
              0 ? (
                <div className="ref-research-empty">
                  <Brain size={24} />

                  <strong>
                    No research projects yet
                  </strong>

                  <small>
                    Build a focused question and connect supporting evidence.
                  </small>

                  <Link to="/research-ai">
                    <Plus size={13} />
                    Start a project
                  </Link>
                </div>
              ) : (
                <div className="ref-research-project-list">
                  {data.recentResearchProjects.map(
                    (project) => (
                      <Link
                        key={project.id}
                        className="ref-research-project"
                        to="/research-ai"
                        aria-label={`Open Research AI project ${project.title}`}
                      >
                        <span>
                          <Brain size={15} />
                        </span>

                        <div>
                          <header>
                            <strong>
                              {project.title}
                            </strong>

                            {project.isPinned && (
                              <Pin size={11} />
                            )}
                          </header>

                          <p>
                            {project.researchQuestion ||
                              project.description ||
                              "Structured evidence project"}
                          </p>

                          <footer>
                            <span>
                              {project.subject?.name ||
                                "Independent research"}
                            </span>

                            <small>
                              {project._count.sources}
                              {" "}
                              source
                              {project._count.sources === 1
                                ? ""
                                : "s"}
                              {" · "}
                              {project._count.mindMapNodes}
                              {" "}
                              node
                              {project._count.mindMapNodes === 1
                                ? ""
                                : "s"}
                            </small>
                          </footer>
                        </div>

                        <ArrowRight size={13} />
                      </Link>
                    ),
                  )}
                </div>
              )}
            </section>

            <section className="ref-research-sources">
              <header>
                <div>
                  <strong>
                    Evidence library
                  </strong>

                  <small>
                    Recently saved sources across projects.
                  </small>
                </div>

                <span>
                  {research.summary.totalSources}
                  {" "}
                  total
                </span>
              </header>

              {data.recentResearchSources.length ===
              0 ? (
                <div className="ref-research-empty compact">
                  <FileText size={22} />

                  <strong>
                    No evidence sources yet
                  </strong>

                  <small>
                    Add papers, web pages, books, videos or notes from Research AI.
                  </small>
                </div>
              ) : (
                <div className="ref-research-source-list">
                  {data.recentResearchSources.map(
                    (source) => (
                      <Link
                        key={source.id}
                        className="ref-research-source"
                        to="/research-ai"
                        aria-label={`Open Research AI source ${source.title}`}
                      >
                        <span>
                          <FileText size={14} />
                        </span>

                        <div>
                          <strong>
                            {source.title}
                          </strong>

                          <small>
                            {source.researchProject?.title ||
                              source.type.replaceAll("_", " ")}
                          </small>
                        </div>

                        <footer>
                          <b
                            className={
                              source.status.toLowerCase()
                            }
                          >
                            {source.status}
                          </b>

                          <small>
                            {formatResearchUpdated(
                              source.updatedAt,
                            )}
                          </small>
                        </footer>
                      </Link>
                    ),
                  )}
                </div>
              )}
            </section>
          </div>
        </Panel>
      </section>

      <footer className="ref-footer">
        <span>
          <i />
          {data.activeStudySession
            ? "Study session active"
            : "Academic, planner, mock-test, notes and research data connected"}
        </span>
        <button disabled={refreshing} type="button" onClick={() => void load(true)}>
          <RefreshCw className={refreshing ? "ref-spin" : ""} size={14} />
          Refresh
        </button>
      </footer>
    </div>
  );
}
