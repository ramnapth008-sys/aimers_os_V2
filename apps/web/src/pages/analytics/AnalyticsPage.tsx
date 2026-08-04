import {
  useAuth,
} from "@aimers/auth";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Gauge,
  Layers3,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  Trophy,
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
  getAnalyticsWorkspace,
} from "./analytics.service";

import type {
  AnalyticsDataQuality,
  AnalyticsSubject,
  AnalyticsTimelineType,
  AnalyticsWorkspace,
} from "./analytics.types";

import "./analytics.css";

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

function dateTimeLabel(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

function graphPoints(
  values: readonly number[],
  maximum: number,
): string {
  if (values.length === 0) {
    return "0,112 420,112";
  }

  const safeMaximum =
    Math.max(
      1,
      maximum,
    );

  if (values.length === 1) {
    const y =
      112 -
      (
        values[0] /
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
              Math.min(
                safeMaximum,
                value,
              ),
            ) /
            safeMaximum
          ) *
            96;

        return `${x},${y}`;
      },
    )
    .join(" ");
}

function Metric({
  icon,
  label,
  value,
  detail,
  to,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  to: string;
}) {
  return (
    <article className="analytics-metric">
      <span>{icon}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>

      <Link
        to={to}
        aria-label={`Open ${label}`}
      >
        <ArrowRight size={14} />
      </Link>
    </article>
  );
}

function Panel({
  eyebrow,
  title,
  action,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={
        `analytics-panel ${className}`
      }
    >
      <header className="analytics-panel-header">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>

        {action}
      </header>

      {children}
    </article>
  );
}

function Empty({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="analytics-empty">
      {icon}
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function qualityIcon(
  item: AnalyticsDataQuality,
) {
  if (item.status === "READY") {
    return (
      <CheckCircle2 size={15} />
    );
  }

  if (
    item.status === "PARTIAL"
  ) {
    return (
      <CircleDashed size={15} />
    );
  }

  return (
    <AlertTriangle size={15} />
  );
}

function timelineIcon(
  type: AnalyticsTimelineType,
) {
  if (
    type === "STUDY_SESSION"
  ) {
    return <Clock3 size={15} />;
  }

  if (type === "MOCK_TEST") {
    return <Target size={15} />;
  }

  return (
    <BookOpenCheck size={15} />
  );
}

function SubjectCard({
  subject,
}: {
  subject: AnalyticsSubject;
}) {
  const progressStyle = {
    "--analytics-subject-progress":
      `${subject.syllabusProgressPercent}%`,
  } as CSSProperties;

  return (
    <article className="analytics-subject">
      <header>
        <div>
          <small>{subject.code}</small>
          <h3>{subject.name}</h3>
        </div>

        <span
          className={
            subject.risk
              .toLowerCase()
          }
        >
          {subject.risk.replace(
            "_",
            " ",
          )}
        </span>
      </header>

      <div className="analytics-subject-main">
        <div
          className="analytics-subject-ring"
          style={progressStyle}
        >
          <strong>
            {
              subject
                .syllabusProgressPercent
            }%
          </strong>
        </div>

        <div>
          <span>
            Chapters
            <strong>
              {
                subject
                  .completedChapters
              }/
              {
                subject
                  .totalChapters
              }
            </strong>
          </span>

          <span>
            Mastery
            <strong>
              {subject.masteryScore}%
            </strong>
          </span>

          <span>
            Assessed
            <strong>
              {subject.assessedTopics}
            </strong>
          </span>
        </div>
      </div>

      <footer>
        <span>
          Test score
          <strong>
            {
              subject
                .mockScorePercent ===
              null
                ? "—"
                : `${subject.mockScorePercent}%`
            }
          </strong>
        </span>

        <span>
          Accuracy
          <strong>
            {
              subject
                .mockAccuracyPercent ===
              null
                ? "—"
                : `${subject.mockAccuracyPercent}%`
            }
          </strong>
        </span>

        <span>
          Movement
          <strong
            className={
              subject.mockMovement ===
              null
                ? ""
                : subject.mockMovement >=
                    0
                  ? "positive"
                  : "negative"
            }
          >
            {
              subject
                .mockMovement ===
              null
                ? "—"
                : `${subject.mockMovement > 0 ? "+" : ""}${subject.mockMovement}%`
            }
          </strong>
        </span>
      </footer>
    </article>
  );
}

export function AnalyticsPage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] = useState<AnalyticsWorkspace | null>(
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

  const load =
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
          setWorkspace(
            await getAnalyticsWorkspace(
              apiFetch,
            ),
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load analytics.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [apiFetch],
    );

  useEffect(() => {
    void load();
  }, [load]);

  const studyMaximum =
    useMemo(
      () =>
        Math.max(
          30,
          ...(
            workspace?.studyDays
              .flatMap(
                (day) => [
                  day.durationMinutes,
                  day.focusMinutes,
                ],
              ) ?? []
          ),
        ),
      [workspace],
    );

  const studyPoints =
    useMemo(
      () =>
        graphPoints(
          workspace?.studyDays.map(
            (day) =>
              day.durationMinutes,
          ) ?? [],
          studyMaximum,
        ),
      [
        studyMaximum,
        workspace,
      ],
    );

  const focusPoints =
    useMemo(
      () =>
        graphPoints(
          workspace?.studyDays.map(
            (day) =>
              day.focusMinutes,
          ) ?? [],
          studyMaximum,
        ),
      [
        studyMaximum,
        workspace,
      ],
    );

  const scorePoints =
    useMemo(
      () =>
        graphPoints(
          workspace?.testTrend.map(
            (point) =>
              point.percentage,
          ) ?? [],
          100,
        ),
      [workspace],
    );

  const accuracyPoints =
    useMemo(
      () =>
        graphPoints(
          workspace?.testTrend.map(
            (point) =>
              point.accuracyPercent,
          ) ?? [],
          100,
        ),
      [workspace],
    );

  if (loading) {
    return (
      <div className="analytics-page analytics-state-page">
        <section className="analytics-state">
          <LoaderCircle
            className="analytics-spin"
            size={31}
          />

          <h1>
            Connecting learning evidence
          </h1>

          <p>
            Loading academic progress, planner
            activity and evaluated mock tests…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="analytics-page analytics-state-page">
        <section className="analytics-state error">
          <AlertTriangle size={31} />

          <h1>
            Analytics unavailable
          </h1>

          <p>
            {error ||
              "No analytics workspace was returned."}
          </p>

          <button
            type="button"
            onClick={() => {
              void load();
            }}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      </div>
    );
  }

  const outcomes =
    workspace.questionOutcomes;

  const outcomeTotal =
    outcomes.correct +
    outcomes.incorrect +
    outcomes.unanswered;

  const correctShare =
    outcomeTotal === 0
      ? 0
      : (
          outcomes.correct /
          outcomeTotal
        ) *
        100;

  const incorrectShare =
    outcomeTotal === 0
      ? 0
      : (
          outcomes.incorrect /
          outcomeTotal
        ) *
        100;

  const outcomeStyle = {
    "--analytics-correct":
      `${correctShare}%`,
    "--analytics-incorrect":
      `${correctShare + incorrectShare}%`,
  } as CSSProperties;

  return (
    <div className="analytics-page">
      <header className="analytics-hero">
        <div>
          <span className="analytics-eyebrow">
            <Sparkles size={14} />
            LEARNING ANALYTICS
          </span>

          <h1>
            One workspace.
            <strong>
              {" "}Every real signal.
            </strong>
          </h1>

          <p>
            Academic progress, study sessions and
            evaluated tests are combined into a
            transparent evidence layer. AIMERS does
            not claim causation where the data only
            shows timing or association.
          </p>

          <div className="analytics-hero-actions">
            <Link to="/planner">
              Open Planner
              <ArrowRight size={15} />
            </Link>

            <Link to="/mock-tests">
              Open Mock Tests
              <ArrowRight size={15} />
            </Link>

            <button
              disabled={refreshing}
              type="button"
              onClick={() => {
                void load(true);
              }}
            >
              <RefreshCw
                className={
                  refreshing
                    ? "analytics-spin"
                    : ""
                }
                size={15}
              />
              Refresh
            </button>
          </div>
        </div>

        <section className="analytics-hero-status">
          <span>
            <Layers3 size={28} />
          </span>

          <small>
            CONNECTED SOURCES
          </small>

          <strong>3/3</strong>

          <p>
            Academic · Planner · Mock Tests
          </p>
        </section>
      </header>

      {error && (
        <div className="analytics-inline-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="analytics-metrics">
        <Metric
          icon={<Clock3 size={19} />}
          label="WEEKLY STUDY"
          value={
            formatMinutes(
              workspace.summary
                .weeklyStudyMinutes,
            )
          }
          detail={
            `${workspace.summary.completedSessionCount} completed sessions`
          }
          to="/planner"
        />

        <Metric
          icon={<TimerReset size={19} />}
          label="FOCUS RATE"
          value={
            `${workspace.summary.focusRate}%`
          }
          detail="Focus minutes within study time"
          to="/planner"
        />

        <Metric
          icon={<BookOpenCheck size={19} />}
          label="SYLLABUS PROGRESS"
          value={
            `${workspace.summary.syllabusProgressPercent}%`
          }
          detail={
            `${workspace.summary.completedChapters}/${workspace.summary.totalChapters} chapters`
          }
          to="/subjects"
        />

        <Metric
          icon={<Trophy size={19} />}
          label="AVERAGE TEST"
          value={
            `${workspace.summary.averageTestScore}%`
          }
          detail={
            `${workspace.summary.mockAttemptCount} evaluated tests`
          }
          to="/mock-tests"
        />

        <Metric
          icon={<Target size={19} />}
          label="QUESTIONS"
          value={
            `${workspace.summary.questionAttempts}`
          }
          detail={
            `${workspace.summary.correctAnswers} correct answers`
          }
          to="/mock-tests"
        />

        <Metric
          icon={<Activity size={19} />}
          label="STUDY STREAK"
          value={
            `${workspace.summary.studyStreakDays}d`
          }
          detail={
            `Today: ${formatMinutes(workspace.summary.todayStudyMinutes)}`
          }
          to="/planner"
        />
      </section>

      <section className="analytics-layout">
        <div className="analytics-primary">
          <Panel
            eyebrow="LAST 7 DAYS"
            title="Study and focus rhythm"
            action={
              <span className="analytics-tag">
                {workspace.timeZone}
              </span>
            }
          >
            <div className="analytics-chart analytics-study-chart">
              <div>
                <span>
                  {formatMinutes(
                    studyMaximum,
                  )}
                </span>
                <span>
                  {formatMinutes(
                    Math.round(
                      studyMaximum *
                      0.75,
                    ),
                  )}
                </span>
                <span>
                  {formatMinutes(
                    Math.round(
                      studyMaximum *
                      0.5,
                    ),
                  )}
                </span>
                <span>
                  {formatMinutes(
                    Math.round(
                      studyMaximum *
                      0.25,
                    ),
                  )}
                </span>
                <span>0m</span>
              </div>

              <section>
                <svg
                  viewBox="0 0 420 120"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Seven day study and focus history"
                >
                  <polyline
                    className="analytics-study-line"
                    points={studyPoints}
                    fill="none"
                    strokeWidth="4"
                    vectorEffect="non-scaling-stroke"
                  />

                  <polyline
                    className="analytics-focus-line"
                    points={focusPoints}
                    fill="none"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <div>
                  {workspace.studyDays.map(
                    (day) => (
                      <span
                        key={day.dateKey}
                      >
                        {day.label}
                      </span>
                    ),
                  )}
                </div>
              </section>
            </div>

            <footer className="analytics-legend">
              <span>
                <i className="study" />
                Study time
              </span>

              <span>
                <i className="focus" />
                Focus time
              </span>
            </footer>
          </Panel>

          <Panel
            eyebrow="SUBJECT INTELLIGENCE"
            title="Syllabus and test performance"
            action={
              <BrainCircuit size={19} />
            }
          >
            <div className="analytics-subject-grid">
              {workspace.subjects.map(
                (subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                  />
                ),
              )}
            </div>
          </Panel>

          <Panel
            eyebrow="ASSESSMENT HISTORY"
            title="Score and accuracy trend"
            action={
              <span className="analytics-tag">
                {
                  workspace
                    .testTrend
                    .length
                } tests
              </span>
            }
          >
            {workspace.testTrend.length ===
            0 ? (
              <Empty
                icon={<Target size={30} />}
                title="No test history"
                detail="Record an evaluated mock test to begin."
              />
            ) : (
              <>
                <div className="analytics-chart analytics-test-chart">
                  <div>
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>

                  <section>
                    <svg
                      viewBox="0 0 420 120"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Mock-test score and accuracy history"
                    >
                      <polyline
                        className="analytics-score-line"
                        points={scorePoints}
                        fill="none"
                        strokeWidth="4"
                        vectorEffect="non-scaling-stroke"
                      />

                      <polyline
                        className="analytics-accuracy-line"
                        points={accuracyPoints}
                        fill="none"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    <div>
                      {workspace.testTrend.map(
                        (
                          point,
                          index,
                        ) => (
                          <span
                            key={
                              point.attemptId
                            }
                          >
                            A{index + 1}
                          </span>
                        ),
                      )}
                    </div>
                  </section>
                </div>

                <footer className="analytics-legend">
                  <span>
                    <i className="score" />
                    Score
                  </span>

                  <span>
                    <i className="accuracy" />
                    Accuracy
                  </span>
                </footer>
              </>
            )}
          </Panel>
        </div>

        <aside className="analytics-secondary">
          <Panel
            eyebrow="QUESTION OUTCOMES"
            title="Answer distribution"
            action={
              <Gauge size={19} />
            }
          >
            <div className="analytics-outcomes">
              <div
                className="analytics-outcome-ring"
                style={outcomeStyle}
              >
                <div>
                  <strong>
                    {
                      outcomes
                        .accuracyPercent
                    }%
                  </strong>
                  <span>accuracy</span>
                </div>
              </div>

              <div>
                <span className="correct">
                  Correct
                  <strong>
                    {outcomes.correct}
                  </strong>
                </span>

                <span className="incorrect">
                  Incorrect
                  <strong>
                    {outcomes.incorrect}
                  </strong>
                </span>

                <span className="unanswered">
                  Unanswered
                  <strong>
                    {outcomes.unanswered}
                  </strong>
                </span>
              </div>
            </div>
          </Panel>

          <Panel
            eyebrow="SESSION DISTRIBUTION"
            title="When study happens"
            action={
              <CalendarClock size={19} />
            }
          >
            <div className="analytics-distribution">
              {workspace.sessionDistribution.map(
                (bucket) => (
                  <section
                    key={bucket.key}
                  >
                    <header>
                      <span>
                        {bucket.label}
                      </span>

                      <strong>
                        {
                          bucket.sessionCount
                        } sessions
                      </strong>
                    </header>

                    <div>
                      <i
                        style={{
                          width:
                            `${bucket.sharePercent}%`,
                        }}
                      />
                    </div>

                    <small>
                      {formatMinutes(
                        bucket.totalMinutes,
                      )}
                    </small>
                  </section>
                ),
              )}
            </div>
          </Panel>

          <Panel
            eyebrow="CROSS-SOURCE EVIDENCE"
            title="Study time and test days"
            action={
              <span className="analytics-tag">
                {
                  workspace
                    .pairedStudyScoreDays
                } paired
              </span>
            }
          >
            <div className="analytics-pairs">
              {workspace.studyScorePairs.map(
                (pair) => (
                  <section
                    key={pair.dateKey}
                  >
                    <strong>
                      {pair.label}
                    </strong>

                    <span>
                      Study
                      <b>
                        {formatMinutes(
                          pair.studyMinutes,
                        )}
                      </b>
                    </span>

                    <span>
                      Test
                      <b>
                        {pair.testScore ===
                        null
                          ? "—"
                          : `${pair.testScore}%`}
                      </b>
                    </span>
                  </section>
                ),
              )}
            </div>

            <p className="analytics-evidence-note">
              Same-day pairing is descriptive only.
              No correlation or causal effect is
              calculated from the current sample.
            </p>
          </Panel>

          <Panel
            eyebrow="WEAK-TOPIC RISK"
            title="Repeated low-accuracy signals"
            action={<Zap size={19} />}
          >
            {workspace.weakTopics.length ===
            0 ? (
              <Empty
                icon={
                  <CheckCircle2
                    size={28}
                  />
                }
                title="No weak-topic evidence"
                detail="Topic-level test results have not identified a weak signal."
              />
            ) : (
              <div className="analytics-weak-list">
                {workspace.weakTopics
                  .slice(0, 6)
                  .map(
                    (topic) => (
                      <section
                        key={
                          topic.topicId
                        }
                      >
                        <span>
                          <Zap size={13} />
                        </span>

                        <div>
                          <strong>
                            {topic.topic}
                          </strong>

                          <small>
                            {topic.subject} ·{" "}
                            {topic.chapter}
                          </small>
                        </div>

                        <b>
                          {
                            topic
                              .averageAccuracy
                          }%
                        </b>

                        <em>
                          {topic.occurrences}×
                        </em>
                      </section>
                    ),
                  )}
              </div>
            )}
          </Panel>
        </aside>
      </section>

      <section className="analytics-lower-grid">
        <Panel
          eyebrow="RECENT ACTIVITY"
          title="Connected learning timeline"
          action={<Activity size={19} />}
        >
          {workspace.recentActivity.length ===
          0 ? (
            <Empty
              icon={<Activity size={29} />}
              title="No recent activity"
              detail="Study sessions, chapter updates and tests will appear here."
            />
          ) : (
            <div className="analytics-timeline">
              {workspace.recentActivity.map(
                (item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                  >
                    <span
                      className={
                        item.type
                          .toLowerCase()
                          .replaceAll(
                            "_",
                            "-",
                          )
                      }
                    >
                      {timelineIcon(
                        item.type,
                      )}
                    </span>

                    <div>
                      <strong>
                        {item.title}
                      </strong>

                      <small>
                        {item.detail}
                      </small>
                    </div>

                    <time>
                      {dateTimeLabel(
                        item.occurredAt,
                      )}
                    </time>
                  </Link>
                ),
              )}
            </div>
          )}
        </Panel>

        <Panel
          eyebrow="DATA READINESS"
          title="Evidence quality"
          action={
            <ShieldCheck size={19} />
          }
        >
          <div className="analytics-quality-list">
            {workspace.dataQuality.map(
              (item) => (
                <section
                  key={item.key}
                  className={
                    item.status
                      .toLowerCase()
                  }
                >
                  <span>
                    {qualityIcon(item)}
                  </span>

                  <div>
                    <strong>
                      {item.label}
                    </strong>

                    <small>
                      {item.detail}
                    </small>
                  </div>

                  <b>
                    {item.status}
                  </b>
                </section>
              ),
            )}
          </div>

          <Link
            className="analytics-panel-link"
            to="/prediction"
          >
            Review prediction readiness
            <ArrowRight size={14} />
          </Link>
        </Panel>
      </section>
    </div>
  );
}
