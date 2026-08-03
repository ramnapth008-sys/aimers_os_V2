import {
  useAuth,
} from "@aimers/auth";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  FlaskConical,
  GraduationCap,
  Leaf,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getAcademicWorkspace,
} from "../subjects/subjects.service";

import type {
  AcademicChapter,
  AcademicSyllabusSubject,
  AcademicWorkspace,
  ChapterProgress,
  TopicMastery,
} from "../subjects/subjects.types";

import "./dashboard.css";

type MetricTone =
  | "violet"
  | "blue"
  | "green"
  | "orange"
  | "pink";

interface MetricProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: MetricTone;
  progress?: number;
}

interface ChapterEntry {
  subject: AcademicSyllabusSubject;
  chapter: AcademicChapter;
}

function clampPercent(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

function chapterPriority(
  progress: ChapterProgress | undefined,
): number {
  if (
    progress?.state === "IN_PROGRESS"
  ) {
    return 0;
  }

  if (
    !progress ||
    progress.state === "NOT_STARTED"
  ) {
    return 1;
  }

  if (
    progress.state === "SKIPPED"
  ) {
    return 2;
  }

  return 3;
}

function isAssessed(
  mastery: TopicMastery | undefined,
): mastery is TopicMastery {
  return Boolean(
    mastery &&
    (
      mastery.attempts > 0 ||
      mastery.lastAssessedAt ||
      mastery.level !== "NOT_ASSESSED"
    ),
  );
}

function subjectTone(
  code: string,
): string {
  const normalized =
    code.toUpperCase();

  if (normalized.includes("PHYS")) {
    return "physics";
  }

  if (normalized.includes("CHEM")) {
    return "chemistry";
  }

  if (
    normalized.includes("BIO") ||
    normalized.includes("BOT") ||
    normalized.includes("ZOO")
  ) {
    return "biology";
  }

  return "other";
}

function SubjectIcon({
  code,
}: {
  code: string;
}) {
  const tone = subjectTone(code);

  if (tone === "physics") {
    return <Zap size={18} />;
  }

  if (tone === "chemistry") {
    return <FlaskConical size={18} />;
  }

  if (tone === "biology") {
    return <Leaf size={18} />;
  }

  return <BookOpenCheck size={18} />;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not studied yet";
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

function Metric({
  label,
  value,
  detail,
  icon,
  tone,
  progress,
}: MetricProps) {
  return (
    <article
      className={`live-metric live-metric-${tone}`}
    >
      <header>
        <span>{icon}</span>
        <small>{label}</small>
      </header>

      <strong>{value}</strong>
      <p>{detail}</p>

      {typeof progress === "number" && (
        <div className="live-metric-track">
          <i
            style={{
              width:
                `${clampPercent(progress)}%`,
            }}
          />
        </div>
      )}
    </article>
  );
}

function LoadingState() {
  return (
    <section className="live-dashboard-state">
      <LoaderCircle
        className="live-dashboard-spinner"
        size={30}
      />

      <h1>
        Loading your learning system
      </h1>

      <p>
        Connecting syllabus progress,
        mastery and practice data…
      </p>
    </section>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="live-dashboard-state error">
      <AlertTriangle size={30} />

      <h1>
        Dashboard data is unavailable
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

export function DashboardPage() {
  const {
    apiFetch,
    user,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
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

  const loadWorkspace =
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
          const result =
            await getAcademicWorkspace(
              apiFetch,
            );

          setWorkspace(result);
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load academic data.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [apiFetch],
    );

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const dashboard =
    useMemo(() => {
      if (!workspace) {
        return null;
      }

      const subjects =
        workspace
          .syllabusVersion
          .subjects;

      const chapterEntries:
        ChapterEntry[] =
        subjects.flatMap(
          (subject) =>
            subject.units.flatMap(
              (unit) =>
                unit.chapters.map(
                  (chapter) => ({
                    subject,
                    chapter,
                  }),
                ),
            ),
        );

      const topicEntries =
        chapterEntries.flatMap(
          ({
            subject,
            chapter,
          }) =>
            chapter.topics.map(
              (topic) => ({
                subject,
                chapter,
                topic,
              }),
            ),
        );

      const progressByChapter =
        new Map(
          workspace.chapterProgress.map(
            (progress) => [
              progress.chapterId,
              progress,
            ],
          ),
        );

      const masteryByTopic =
        new Map(
          workspace.topicMastery.map(
            (mastery) => [
              mastery.topicId,
              mastery,
            ],
          ),
        );

      const overallProgress =
        chapterEntries.length === 0
          ? 0
          : clampPercent(
              chapterEntries.reduce(
                (
                  total,
                  {
                    chapter,
                  },
                ) =>
                  total +
                  (
                    progressByChapter.get(
                      chapter.id,
                    )?.completionPercent ??
                    0
                  ),
                0,
              ) /
              chapterEntries.length,
            );

      const completedChapters =
        chapterEntries.filter(
          ({
            chapter,
          }) =>
            progressByChapter.get(
              chapter.id,
            )?.state === "COMPLETED",
        ).length;

      const inProgressChapters =
        chapterEntries.filter(
          ({
            chapter,
          }) =>
            progressByChapter.get(
              chapter.id,
            )?.state === "IN_PROGRESS",
        ).length;

      const questionAttempts =
        workspace.chapterProgress.reduce(
          (
            total,
            progress,
          ) =>
            total +
            progress.questionAttempts,
          0,
        );

      const correctAnswers =
        workspace.chapterProgress.reduce(
          (
            total,
            progress,
          ) =>
            total +
            progress.correctAnswers,
          0,
        );

      const accuracy =
        questionAttempts === 0
          ? 0
          : clampPercent(
              (
                correctAnswers /
                questionAttempts
              ) * 100,
            );

      const assessedMasteries =
        workspace.topicMastery.filter(
          (mastery) =>
            isAssessed(mastery),
        );

      const masteryScore =
        assessedMasteries.length === 0
          ? 0
          : clampPercent(
              assessedMasteries.reduce(
                (
                  total,
                  mastery,
                ) =>
                  total +
                  mastery.masteryScore,
                0,
              ) /
              assessedMasteries.length,
            );

      const masteredTopics =
        workspace.topicMastery.filter(
          (mastery) =>
            mastery.level === "MASTERED",
        ).length;

      const subjectProgress =
        subjects.map((subject) => {
          const chapters =
            subject.units.flatMap(
              (unit) =>
                unit.chapters,
            );

          const progress =
            chapters.length === 0
              ? 0
              : clampPercent(
                  chapters.reduce(
                    (
                      total,
                      chapter,
                    ) =>
                      total +
                      (
                        progressByChapter.get(
                          chapter.id,
                        )
                          ?.completionPercent ??
                        0
                      ),
                    0,
                  ) /
                  chapters.length,
                );

          return {
            id: subject.id,
            code:
              subject.subject.code,
            name:
              subject.subject.name,
            progress,
          };
        });

      const queue =
        [...chapterEntries]
          .sort(
            (
              left,
              right,
            ) => {
              const leftProgress =
                progressByChapter.get(
                  left.chapter.id,
                );

              const rightProgress =
                progressByChapter.get(
                  right.chapter.id,
                );

              const priority =
                chapterPriority(
                  leftProgress,
                ) -
                chapterPriority(
                  rightProgress,
                );

              if (priority !== 0) {
                return priority;
              }

              return (
                (
                  rightProgress
                    ?.completionPercent ??
                  0
                ) -
                (
                  leftProgress
                    ?.completionPercent ??
                  0
                )
              );
            },
          )
          .slice(0, 5)
          .map(
            ({
              subject,
              chapter,
            }) => {
              const progress =
                progressByChapter.get(
                  chapter.id,
                );

              return {
                id: chapter.id,
                subject:
                  subject.subject.name,
                chapter: chapter.name,
                topics:
                  chapter.topics.length,
                percent:
                  progress
                    ?.completionPercent ??
                  0,
                state:
                  progress?.state ??
                  "NOT_STARTED",
              };
            },
          );

      const weakTopics =
        topicEntries
          .map(
            ({
              subject,
              topic,
            }) => {
              const mastery =
                masteryByTopic.get(
                  topic.id,
                );

              const assessed =
                isAssessed(mastery);

              return {
                id: topic.id,
                subject:
                  subject.subject.name,
                topic: topic.name,
                assessed,
                score:
                  mastery
                    ?.masteryScore ?? 0,
              };
            },
          )
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
          )
          .slice(0, 5);

      const chapterLookup =
        new Map(
          chapterEntries.map(
            (entry) => [
              entry.chapter.id,
              entry,
            ],
          ),
        );

      const recentActivity =
        [...workspace.chapterProgress]
          .filter(
            (progress) =>
              Boolean(
                progress.lastStudiedAt,
              ),
          )
          .sort(
            (
              left,
              right,
            ) =>
              new Date(
                right.lastStudiedAt ??
                0,
              ).getTime() -
              new Date(
                left.lastStudiedAt ??
                0,
              ).getTime(),
          )
          .slice(0, 5)
          .flatMap(
            (progress) => {
              const entry =
                chapterLookup.get(
                  progress.chapterId,
                );

              if (!entry) {
                return [];
              }

              return [
                {
                  id: progress.id,
                  subject:
                    entry.subject.subject.name,
                  chapter:
                    entry.chapter.name,
                  percent:
                    progress.completionPercent,
                  state: progress.state,
                  lastStudiedAt:
                    progress.lastStudiedAt,
                },
              ];
            },
          );

      const weakestSubject =
        [...subjectProgress].sort(
          (
            left,
            right,
          ) =>
            left.progress -
            right.progress,
        )[0] ?? null;

      return {
        subjects,
        chapterEntries,
        topicEntries,
        overallProgress,
        completedChapters,
        inProgressChapters,
        questionAttempts,
        correctAnswers,
        accuracy,
        masteryScore,
        masteredTopics,
        assessedTopicCount:
          assessedMasteries.length,
        subjectProgress,
        queue,
        weakTopics,
        recentActivity,
        weakestSubject,
      };
    }, [workspace]);

  if (loading) {
    return (
      <div className="live-dashboard-page state-page">
        <LoadingState />
      </div>
    );
  }

  if (
    !workspace ||
    !dashboard
  ) {
    return (
      <div className="live-dashboard-page state-page">
        <ErrorState
          message={
            error ||
            "No academic workspace is available."
          }
          onRetry={() => {
            void loadWorkspace();
          }}
        />
      </div>
    );
  }

  const programme =
    workspace
      .syllabusVersion
      .programme;

  const firstName =
    user?.firstName?.trim() ||
    "Student";

  const overallStyle = {
    "--live-progress":
      `${dashboard.overallProgress}%`,
  } as CSSProperties;

  return (
    <div className="live-dashboard-page">
      <header className="live-dashboard-hero">
        <div>
          <span className="live-dashboard-eyebrow">
            <i />
            LIVE ACADEMIC INTELLIGENCE
          </span>

          <h1>
            Welcome back,{" "}
            <strong>{firstName}.</strong>
          </h1>

          <p>
            Your dashboard now reads directly
            from the academic catalogue,
            chapter progress, topic mastery and
            recorded question attempts.
          </p>

          <div className="live-dashboard-meta">
            <span>
              <GraduationCap size={15} />
              {programme.name}
            </span>

            <span>
              <BookOpenCheck size={15} />
              {
                workspace
                  .syllabusVersion
                  .name
              }
            </span>

            <span>
              <CheckCircle2 size={15} />
              {workspace.status}
            </span>
          </div>
        </div>

        <div className="live-dashboard-hero-progress">
          <div
            className="live-dashboard-ring"
            style={overallStyle}
          >
            <div>
              <strong>
                {
                  dashboard
                    .overallProgress
                }%
              </strong>
              <span>syllabus</span>
            </div>
          </div>

          <button
            disabled={refreshing}
            type="button"
            onClick={() => {
              void loadWorkspace(true);
            }}
          >
            <RefreshCw
              className={
                refreshing
                  ? "live-dashboard-spinner"
                  : ""
              }
              size={15}
            />
            Refresh data
          </button>
        </div>
      </header>

      {error && (
        <div
          className="live-dashboard-inline-error"
          role="alert"
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <section className="live-dashboard-metrics">
        <Metric
          label="SYLLABUS PROGRESS"
          value={
            `${dashboard.overallProgress}%`
          }
          detail="Average chapter completion"
          icon={
            <TrendingUp size={17} />
          }
          tone="violet"
          progress={
            dashboard.overallProgress
          }
        />

        <Metric
          label="MASTERY SCORE"
          value={
            `${dashboard.masteryScore}%`
          }
          detail={
            `${dashboard.assessedTopicCount} topics assessed`
          }
          icon={<Brain size={17} />}
          tone="blue"
          progress={
            dashboard.masteryScore
          }
        />

        <Metric
          label="CHAPTERS COMPLETE"
          value={
            `${dashboard.completedChapters}/${dashboard.chapterEntries.length}`
          }
          detail={
            `${dashboard.inProgressChapters} in progress`
          }
          icon={
            <CheckCircle2 size={17} />
          }
          tone="green"
          progress={
            dashboard.chapterEntries
              .length === 0
              ? 0
              : (
                  dashboard
                    .completedChapters /
                  dashboard
                    .chapterEntries
                    .length
                ) * 100
          }
        />

        <Metric
          label="QUESTIONS ATTEMPTED"
          value={
            `${dashboard.questionAttempts}`
          }
          detail={
            `${dashboard.correctAnswers} correct answers`
          }
          icon={<Activity size={17} />}
          tone="orange"
        />

        <Metric
          label="ACCURACY"
          value={
            `${dashboard.accuracy}%`
          }
          detail={
            dashboard.questionAttempts > 0
              ? "Across recorded attempts"
              : "No attempts recorded yet"
          }
          icon={<Target size={17} />}
          tone="pink"
          progress={
            dashboard.accuracy
          }
        />
      </section>

      <section className="live-dashboard-layout">
        <article className="live-dashboard-card queue-card">
          <header>
            <div>
              <span>STUDY EXECUTION</span>
              <h2>Current chapter queue</h2>
            </div>

            <Link to="/subjects">
              Open Subjects
              <ArrowRight size={15} />
            </Link>
          </header>

          <div className="live-queue-list">
            {dashboard.queue.map(
              (item) => (
                <section key={item.id}>
                  <span
                    className={
                      item.state ===
                      "COMPLETED"
                        ? "queue-status completed"
                        : item.state ===
                            "IN_PROGRESS"
                          ? "queue-status active"
                          : "queue-status"
                    }
                  >
                    {item.state ===
                    "COMPLETED" ? (
                      <CheckCircle2
                        size={15}
                      />
                    ) : item.state ===
                      "IN_PROGRESS" ? (
                      <TrendingUp
                        size={15}
                      />
                    ) : (
                      <CircleDashed
                        size={15}
                      />
                    )}
                  </span>

                  <div>
                    <small>
                      {item.subject}
                    </small>
                    <strong>
                      {item.chapter}
                    </strong>
                    <p>
                      {item.topics} topics
                    </p>
                  </div>

                  <div className="queue-progress">
                    <span>
                      <i
                        style={{
                          width:
                            `${item.percent}%`,
                        }}
                      />
                    </span>
                    <strong>
                      {item.percent}%
                    </strong>
                  </div>

                  <ChevronRight
                    size={16}
                  />
                </section>
              ),
            )}
          </div>
        </article>

        <article className="live-dashboard-card subjects-card">
          <header>
            <div>
              <span>SUBJECT ANALYTICS</span>
              <h2>Subject-wise progress</h2>
            </div>

            <BarChart3 size={18} />
          </header>

          <div className="live-subject-list">
            {dashboard.subjectProgress.map(
              (subject) => (
                <section
                  key={subject.id}
                  className={
                    subjectTone(
                      subject.code,
                    )
                  }
                >
                  <span>
                    <SubjectIcon
                      code={subject.code}
                    />
                  </span>

                  <div>
                    <strong>
                      {subject.name}
                    </strong>

                    <div>
                      <i
                        style={{
                          width:
                            `${subject.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <b>
                    {subject.progress}%
                  </b>
                </section>
              ),
            )}
          </div>
        </article>

        <article className="live-dashboard-card weak-card">
          <header>
            <div>
              <span>MASTERY SIGNALS</span>
              <h2>Topics to strengthen</h2>
            </div>

            <Zap size={18} />
          </header>

          <div className="live-weak-list">
            {dashboard.weakTopics.length ===
            0 ? (
              <div className="live-card-empty">
                <CheckCircle2 size={24} />
                <strong>
                  No weak topics detected
                </strong>
                <p>
                  Continue assessing more
                  topics.
                </p>
              </div>
            ) : (
              dashboard.weakTopics.map(
                (item) => (
                  <section key={item.id}>
                    <span>
                      <Zap size={13} />
                    </span>

                    <div>
                      <strong>
                        {item.topic}
                      </strong>
                      <small>
                        {item.subject}
                      </small>
                    </div>

                    <b>
                      {item.assessed
                        ? `${item.score}%`
                        : "Not assessed"}
                    </b>
                  </section>
                ),
              )
            )}
          </div>
        </article>

        <article className="live-dashboard-card activity-card">
          <header>
            <div>
              <span>RECENT ACTIVITY</span>
              <h2>Latest chapter updates</h2>
            </div>

            <Clock3 size={18} />
          </header>

          <div className="live-activity-list">
            {dashboard.recentActivity.length ===
            0 ? (
              <div className="live-card-empty">
                <Clock3 size={24} />
                <strong>
                  No activity recorded
                </strong>
                <p>
                  Update progress from the
                  Subjects workspace.
                </p>
              </div>
            ) : (
              dashboard.recentActivity.map(
                (item) => (
                  <section key={item.id}>
                    <span>
                      <BookOpenCheck
                        size={14}
                      />
                    </span>

                    <div>
                      <strong>
                        {item.subject}:{" "}
                        {item.chapter}
                      </strong>

                      <small>
                        {item.percent}% complete
                        {" · "}
                        {
                          item.state.replace(
                            "_",
                            " ",
                          )
                        }
                      </small>
                    </div>

                    <time>
                      {formatDate(
                        item.lastStudiedAt,
                      )}
                    </time>
                  </section>
                ),
              )
            )}
          </div>
        </article>

        <article className="live-dashboard-card insight-card">
          <header>
            <div>
              <span>ACADEMIC INSIGHT</span>
              <h2>Recommended next move</h2>
            </div>

            <Sparkles size={18} />
          </header>

          <div className="live-insight-content">
            <span>
              <Brain size={28} />
            </span>

            <div>
              <p>
                Current priority
              </p>

              <strong>
                {
                  dashboard
                    .weakestSubject
                    ?.name ??
                  programme.name
                }
              </strong>

              <small>
                {dashboard.weakestSubject
                  ? `${dashboard.weakestSubject.name} is at ${dashboard.weakestSubject.progress}% progress. Continue with ${dashboard.queue[0]?.chapter ?? "the next chapter"}.`
                  : "Continue building syllabus coverage."}
              </small>
            </div>
          </div>

          <Link to="/ai-mentor">
            Ask AIMERS about this
            <ArrowRight size={15} />
          </Link>
        </article>

        <article className="live-dashboard-card prediction-card">
          <header>
            <div>
              <span>PREDICTION ENGINE</span>
              <h2>Performance forecast</h2>
            </div>

            <Target size={18} />
          </header>

          <div className="live-prediction-empty">
            <Target size={30} />

            <strong>
              No valid prediction yet
            </strong>

            <p>
              Mock-test history is required.
              AIMERS will not invent a score
              or rank.
            </p>
          </div>

          <Link to="/prediction">
            Open Prediction
            <ArrowRight size={15} />
          </Link>
        </article>
      </section>

      <section className="live-dashboard-quick-links">
        <Link to="/subjects">
          <BookOpenCheck size={16} />
          Subjects
        </Link>

        <Link to="/analytics">
          <BarChart3 size={16} />
          Analytics
        </Link>

        <Link to="/memory-engine">
          <Brain size={16} />
          Memory Engine
        </Link>

        <Link to="/question-bank">
          <Target size={16} />
          Question Bank
        </Link>
      </section>
    </div>
  );
}
