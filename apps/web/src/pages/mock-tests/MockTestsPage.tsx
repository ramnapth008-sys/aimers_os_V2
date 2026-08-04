import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FilePenLine,
  Gauge,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from "lucide-react";

import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteMockTestAttempt,
  getMockTest,
  getMockTestWorkspace,
  recordMockTestAttempt,
} from "./mock-tests.service";

import type {
  MockTest,
  MockTestAttempt,
  MockTestSection,
  MockTestWorkspace,
  RecordMockTestAttemptInput,
} from "./mock-tests.types";

import "./mock-tests.css";

interface SectionForm {
  sectionId: string;
  attempted: string;
  correct: string;
  incorrect: string;
  minutes: string;
  topicId: string;
  topicAttempted: string;
  topicCorrect: string;
  topicIncorrect: string;
}

function integer(
  value: string,
): number {
  const parsed =
    Number.parseInt(
      value,
      10,
    );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function durationLabel(
  seconds: number,
): string {
  const minutes =
    Math.round(seconds / 60);

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

function dateLabel(
  value: string | null,
): string {
  if (!value) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function scopeLabel(
  value: MockTest["scope"],
): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function graphPoints(
  values: readonly number[],
): string {
  if (values.length === 0) {
    return "0,112 420,112";
  }

  if (values.length === 1) {
    const y =
      112 -
      values[0] * 0.96;

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
          ) * 420;

        const y =
          112 -
          Math.max(
            0,
            Math.min(
              100,
              value,
            ),
          ) * 0.96;

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
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="mock-metric">
      <span>{icon}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function Empty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mock-empty">
      {icon}
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function AttemptCard({
  attempt,
  deleting,
  onDelete,
}: {
  attempt: MockTestAttempt;
  deleting: boolean;
  onDelete: () => void;
}) {
  const [
    expanded,
    setExpanded,
  ] = useState(false);

  return (
    <article className="mock-attempt">
      <button
        className="mock-attempt-main"
        type="button"
        onClick={() => {
          setExpanded(
            (current) =>
              !current,
          );
        }}
      >
        <span className="mock-score">
          <strong>
            {attempt.percentage}%
          </strong>
          <small>
            {attempt.rawScore}/
            {attempt.mockTest.totalMarks}
          </small>
        </span>

        <span className="mock-attempt-title">
          <small>
            ATTEMPT {attempt.attemptNumber}
          </small>
          <strong>
            {attempt.mockTest.title}
          </strong>
          <span>
            {dateLabel(
              attempt.submittedAt,
            )}
          </span>
        </span>

        <span className="mock-attempt-stat">
          <small>ACCURACY</small>
          <strong>
            {attempt.accuracyPercent}%
          </strong>
        </span>

        <span className="mock-attempt-stat">
          <small>DURATION</small>
          <strong>
            {durationLabel(
              attempt.durationSeconds,
            )}
          </strong>
        </span>

        <ChevronDown
          className={
            expanded
              ? "expanded"
              : ""
          }
          size={18}
        />
      </button>

      {expanded && (
        <div className="mock-attempt-detail">
          <div className="mock-answer-grid">
            <span>
              Correct
              <strong>
                {attempt.correctAnswers}
              </strong>
            </span>

            <span>
              Incorrect
              <strong>
                {attempt.incorrectAnswers}
              </strong>
            </span>

            <span>
              Unanswered
              <strong>
                {attempt.unansweredQuestions}
              </strong>
            </span>

            <span>
              Attempted
              <strong>
                {attempt.attemptedQuestions}
              </strong>
            </span>
          </div>

          <div className="mock-section-results">
            {attempt.sectionResults.map(
              (result) => (
                <section key={result.id}>
                  <div>
                    <strong>
                      {
                        result
                          .mockTestSection
                          .name
                      }
                    </strong>
                    <small>
                      {
                        result
                          .attemptedQuestions
                      } attempted
                    </small>
                  </div>

                  <span>
                    {result.score}/
                    {result.maxScore}
                  </span>

                  <span>
                    {
                      result
                        .accuracyPercent
                    }% accuracy
                  </span>
                </section>
              ),
            )}
          </div>

          <footer>
            <span>
              {attempt.notes ||
                "No notes recorded."}
            </span>

            <button
              disabled={deleting}
              type="button"
              onClick={onDelete}
            >
              {deleting ? (
                <LoaderCircle
                  className="mock-spin"
                  size={14}
                />
              ) : (
                <Trash2 size={14} />
              )}
              Delete
            </button>
          </footer>
        </div>
      )}
    </article>
  );
}

export function MockTestsPage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] = useState<MockTestWorkspace | null>(
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
    selectedTest,
    setSelectedTest,
  ] = useState<MockTest | null>(
    null,
  );

  const [
    modalLoadingId,
    setModalLoadingId,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState("");

  const [
    durationMinutes,
    setDurationMinutes,
  ] = useState("180");

  const [
    percentile,
    setPercentile,
  ] = useState("");

  const [
    rank,
    setRank,
  ] = useState("");

  const [
    rankOutOf,
    setRankOutOf,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    sectionForms,
    setSectionForms,
  ] = useState<SectionForm[]>([]);

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
          setWorkspace(
            await getMockTestWorkspace(
              apiFetch,
            ),
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load mock-test data.",
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

  const trend =
    workspace?.trend ?? [];

  const scorePoints =
    useMemo(
      () =>
        graphPoints(
          trend.map(
            (item) =>
              item.percentage,
          ),
        ),
      [trend],
    );

  const accuracyPoints =
    useMemo(
      () =>
        graphPoints(
          trend.map(
            (item) =>
              item.accuracyPercent,
          ),
        ),
      [trend],
    );

  async function openForm(
    test: MockTest,
  ) {
    setModalLoadingId(test.id);
    setError("");

    try {
      const detail =
        await getMockTest(
          apiFetch,
          test.id,
        );

      setSelectedTest(detail);
      setDurationMinutes(
        String(
          detail.durationMinutes,
        ),
      );
      setPercentile("");
      setRank("");
      setRankOutOf("");
      setNotes("");

      setSectionForms(
        detail.sections.map(
          (section) => ({
            sectionId: section.id,
            attempted: "0",
            correct: "0",
            incorrect: "0",
            minutes:
              String(
                Math.max(
                  1,
                  Math.round(
                    detail
                      .durationMinutes *
                    (
                      section
                        .totalQuestions /
                      Math.max(
                        1,
                        detail
                          .totalQuestions,
                      )
                    ),
                  ),
                ),
              ),
            topicId: "",
            topicAttempted: "0",
            topicCorrect: "0",
            topicIncorrect: "0",
          }),
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to retrieve the mock test.",
      );
    } finally {
      setModalLoadingId("");
    }
  }

  function updateSection(
    sectionId: string,
    field: keyof SectionForm,
    value: string,
  ) {
    setSectionForms(
      (current) =>
        current.map(
          (form) =>
            form.sectionId ===
            sectionId
              ? {
                  ...form,
                  [field]: value,
                }
              : form,
        ),
    );
  }

  async function submitAttempt(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!selectedTest) {
      return;
    }

    const sections:
      RecordMockTestAttemptInput["sections"] =
      [];

    for (
      const form
      of sectionForms
    ) {
      const section =
        selectedTest.sections.find(
          (item) =>
            item.id ===
            form.sectionId,
        );

      if (!section) {
        setError(
          "A test section is missing.",
        );
        return;
      }

      const attempted =
        integer(form.attempted);

      const correct =
        integer(form.correct);

      const incorrect =
        integer(form.incorrect);

      if (
        attempted !==
        correct + incorrect
      ) {
        setError(
          `${section.name}: attempted must equal correct plus incorrect.`,
        );
        return;
      }

      if (
        attempted >
        section.totalQuestions
      ) {
        setError(
          `${section.name}: maximum ${section.totalQuestions} questions.`,
        );
        return;
      }

      const topicResults =
        [];

      if (form.topicId) {
        const topicAttempted =
          integer(
            form.topicAttempted,
          );

        const topicCorrect =
          integer(
            form.topicCorrect,
          );

        const topicIncorrect =
          integer(
            form.topicIncorrect,
          );

        if (
          topicAttempted !==
          topicCorrect +
            topicIncorrect
        ) {
          setError(
            `${section.name}: topic attempted must equal correct plus incorrect.`,
          );
          return;
        }

        if (topicAttempted > 0) {
          topicResults.push({
            topicId: form.topicId,
            attemptedQuestions:
              topicAttempted,
            correctAnswers:
              topicCorrect,
            incorrectAnswers:
              topicIncorrect,
          });
        }
      }

      sections.push({
        sectionId: section.id,
        attemptedQuestions:
          attempted,
        correctAnswers:
          correct,
        incorrectAnswers:
          incorrect,
        timeSpentSeconds:
          integer(form.minutes) *
          60,
        topicResults,
      });
    }

    const duration =
      integer(durationMinutes);

    const parsedRank =
      integer(rank);

    const parsedRankOutOf =
      integer(rankOutOf);

    if (duration < 1) {
      setError(
        "Duration must be at least one minute.",
      );
      return;
    }

    if (
      parsedRank > 0 &&
      parsedRankOutOf > 0 &&
      parsedRank >
        parsedRankOutOf
    ) {
      setError(
        "Rank cannot exceed rank out of.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await recordMockTestAttempt(
        apiFetch,
        selectedTest.id,
        {
          durationSeconds:
            duration * 60,
          percentile:
            integer(percentile) ||
            undefined,
          rank:
            parsedRank ||
            undefined,
          rankOutOf:
            parsedRankOutOf ||
            undefined,
          notes:
            notes.trim() ||
            undefined,
          sections,
        },
      );

      setSelectedTest(null);
      await loadWorkspace(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to record the result.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeAttempt(
    attemptId: string,
  ) {
    if (
      !window.confirm(
        "Delete this attempt and its analytics?",
      )
    ) {
      return;
    }

    setDeletingId(attemptId);
    setError("");

    try {
      await deleteMockTestAttempt(
        apiFetch,
        attemptId,
      );

      await loadWorkspace(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to delete the attempt.",
      );
    } finally {
      setDeletingId("");
    }
  }

  if (loading) {
    return (
      <div className="mock-page mock-state-page">
        <section className="mock-state-card">
          <LoaderCircle
            className="mock-spin"
            size={30}
          />
          <h1>
            Loading assessment data
          </h1>
          <p>
            Connecting tests, attempts and
            analytics…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mock-page mock-state-page">
        <section className="mock-state-card error">
          <AlertTriangle size={30} />
          <h1>
            Mock tests unavailable
          </h1>
          <p>
            {error ||
              "No workspace is available."}
          </p>
          <button
            type="button"
            onClick={() => {
              void loadWorkspace();
            }}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="mock-page">
      <header className="mock-hero">
        <div>
          <span className="mock-eyebrow">
            <Sparkles size={14} />
            ASSESSMENT INTELLIGENCE
          </span>

          <h1>
            Test. Analyse.
            <strong> Improve.</strong>
          </h1>

          <p>
            Record completed mock-test results,
            compare subject performance, detect
            weak topics and build a trustworthy
            score history.
          </p>

          <div className="mock-tags">
            <span>
              <Target size={15} />
              Real score calculation
            </span>
            <span>
              <Brain size={15} />
              Topic weakness mapping
            </span>
            <span>
              <TrendingUp size={15} />
              Attempt trends
            </span>
          </div>
        </div>

        <div className="mock-readiness">
          <Gauge size={30} />
          <small>
            PREDICTION READINESS
          </small>
          <strong>
            {
              workspace.summary
                .predictionReady
                ? "Ready"
                : `${workspace.summary.attemptCount}/3`
            }
          </strong>
          <p>
            {
              workspace.summary
                .predictionReady
                ? "Minimum assessment history reached."
                : "Three evaluated attempts are required."
            }
          </p>
        </div>
      </header>

      {error && (
        <div className="mock-inline-error">
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

      <section className="mock-metrics">
        <Metric
          icon={
            <BookOpenCheck size={19} />
          }
          label="AVAILABLE TESTS"
          value={
            `${workspace.summary.availableTestCount}`
          }
          detail="Published for your syllabus"
        />

        <Metric
          icon={<Target size={19} />}
          label="ATTEMPTS"
          value={
            `${workspace.summary.attemptCount}`
          }
          detail="Evaluated results"
        />

        <Metric
          icon={<BarChart3 size={19} />}
          label="AVERAGE SCORE"
          value={
            `${workspace.summary.averagePercentage}%`
          }
          detail="Across all attempts"
        />

        <Metric
          icon={<Gauge size={19} />}
          label="ACCURACY"
          value={
            `${workspace.summary.averageAccuracy}%`
          }
          detail="Correct out of attempted"
        />

        <Metric
          icon={<Trophy size={19} />}
          label="BEST SCORE"
          value={
            `${workspace.summary.bestPercentage}%`
          }
          detail="Highest percentage"
        />
      </section>

      <section className="mock-layout">
        <div className="mock-primary">
          <article className="mock-panel">
            <header className="mock-panel-header">
              <div>
                <span>
                  AVAILABLE ASSESSMENTS
                </span>
                <h2>
                  Mock-test catalogue
                </h2>
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
                      ? "mock-spin"
                      : ""
                  }
                  size={15}
                />
                Refresh
              </button>
            </header>

            {workspace.availableTests.length ===
            0 ? (
              <Empty
                icon={
                  <BookOpenCheck
                    size={30}
                  />
                }
                title="No published tests"
                description="Seed or publish a test for the active syllabus."
              />
            ) : (
              <div className="mock-test-list">
                {workspace.availableTests.map(
                  (test) => {
                    const latest =
                      test.attempts?.[0];

                    return (
                      <section
                        key={test.id}
                        className="mock-test-card"
                      >
                        <span className="mock-test-icon">
                          <FilePenLine
                            size={22}
                          />
                        </span>

                        <div className="mock-test-copy">
                          <small>
                            {
                              test.code ||
                              "MOCK TEST"
                            }
                          </small>
                          <h3>
                            {test.title}
                          </h3>
                          <p>
                            {
                              test.description ||
                              "No description."
                            }
                          </p>

                          <div>
                            <span>
                              <Target
                                size={13}
                              />
                              {
                                test.totalQuestions
                              } questions
                            </span>
                            <span>
                              <Trophy
                                size={13}
                              />
                              {
                                test.totalMarks
                              } marks
                            </span>
                            <span>
                              <Clock3
                                size={13}
                              />
                              {
                                test.durationMinutes
                              } min
                            </span>
                            <span>
                              {
                                scopeLabel(
                                  test.scope,
                                )
                              }
                            </span>
                          </div>
                        </div>

                        <div className="mock-test-action">
                          {latest && (
                            <span>
                              Last:{" "}
                              <strong>
                                {
                                  latest
                                    .percentage
                                }%
                              </strong>
                            </span>
                          )}

                          <button
                            disabled={
                              modalLoadingId ===
                              test.id
                            }
                            type="button"
                            onClick={() => {
                              void openForm(
                                test,
                              );
                            }}
                          >
                            {modalLoadingId ===
                            test.id ? (
                              <LoaderCircle
                                className="mock-spin"
                                size={15}
                              />
                            ) : (
                              <Plus
                                size={15}
                              />
                            )}
                            Record result
                          </button>
                        </div>
                      </section>
                    );
                  },
                )}
              </div>
            )}
          </article>

          <article className="mock-panel">
            <header className="mock-panel-header">
              <div>
                <span>RESULT HISTORY</span>
                <h2>
                  Evaluated attempts
                </h2>
              </div>

              <strong className="mock-count">
                {workspace.attempts.length}
              </strong>
            </header>

            {workspace.attempts.length ===
            0 ? (
              <Empty
                icon={<Target size={30} />}
                title="No attempts yet"
                description="Record a completed test result to begin."
              />
            ) : (
              <div className="mock-attempt-list">
                {workspace.attempts.map(
                  (attempt) => (
                    <AttemptCard
                      key={attempt.id}
                      attempt={attempt}
                      deleting={
                        deletingId ===
                        attempt.id
                      }
                      onDelete={() => {
                        void removeAttempt(
                          attempt.id,
                        );
                      }}
                    />
                  ),
                )}
              </div>
            )}
          </article>
        </div>

        <aside className="mock-secondary">
          <article className="mock-panel">
            <header className="mock-panel-header">
              <div>
                <span>
                  PERFORMANCE TREND
                </span>
                <h2>
                  Score and accuracy
                </h2>
              </div>
              <TrendingUp size={18} />
            </header>

            {trend.length === 0 ? (
              <Empty
                icon={
                  <TrendingUp size={29} />
                }
                title="No trend yet"
                description="At least one attempt is required."
              />
            ) : (
              <>
                <div className="mock-chart">
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
                    >
                      <polyline
                        className="score-line"
                        points={scorePoints}
                        fill="none"
                        strokeWidth="4"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polyline
                        className="accuracy-line"
                        points={accuracyPoints}
                        fill="none"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    <div>
                      {trend.map(
                        (
                          item,
                          index,
                        ) => (
                          <span
                            key={
                              item.attemptId
                            }
                          >
                            A{index + 1}
                          </span>
                        ),
                      )}
                    </div>
                  </section>
                </div>

                <footer className="mock-legend">
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
          </article>

          <article className="mock-panel">
            <header className="mock-panel-header">
              <div>
                <span>
                  WEAK-TOPIC SIGNALS
                </span>
                <h2>
                  Needs reinforcement
                </h2>
              </div>
              <Zap size={18} />
            </header>

            {workspace.weakTopics.length ===
            0 ? (
              <Empty
                icon={<Zap size={29} />}
                title="No weak topics"
                description="Add topic-level results while recording an attempt."
              />
            ) : (
              <div className="mock-weak-list">
                {workspace.weakTopics.map(
                  (item) => (
                    <section
                      key={item.topicId}
                    >
                      <span>
                        <Zap size={14} />
                      </span>
                      <div>
                        <strong>
                          {item.topic}
                        </strong>
                        <small>
                          {item.subject} ·{" "}
                          {item.chapter}
                        </small>
                      </div>
                      <b>
                        {
                          item.averageAccuracy
                        }%
                      </b>
                      <em>
                        {item.occurrences}×
                      </em>
                    </section>
                  ),
                )}
              </div>
            )}
          </article>

          <article className="mock-panel mock-ready-panel">
            <header className="mock-panel-header">
              <div>
                <span>
                  PREDICTION FOUNDATION
                </span>
                <h2>Data readiness</h2>
              </div>
              <Gauge size={18} />
            </header>

            <div className="mock-ready-ring">
              <div
                style={
                  {
                    "--ready-value":
                      `${Math.min(
                        100,
                        (
                          workspace.summary
                            .attemptCount /
                          3
                        ) * 100,
                      )}%`,
                  } as CSSProperties
                }
              >
                <strong>
                  {
                    workspace.summary
                      .attemptCount
                  }/3
                </strong>
                <span>attempts</span>
              </div>
            </div>

            <p>
              {
                workspace.summary
                  .predictionReady
                  ? "Enough evaluated attempts exist for the future prediction milestone."
                  : "No score or rank forecast will be shown until three attempts exist."
              }
            </p>
          </article>
        </aside>
      </section>

      {selectedTest && (
        <div className="mock-modal-backdrop">
          <section className="mock-modal">
            <header>
              <div>
                <span>
                  RECORD COMPLETED RESULT
                </span>
                <h2>
                  {selectedTest.title}
                </h2>
                <p>
                  Enter actual section totals
                  from a completed test.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTest(null);
                }}
              >
                <X size={19} />
              </button>
            </header>

            <form
              onSubmit={submitAttempt}
            >
              <div className="mock-form-grid">
                <label>
                  Total duration (minutes)
                  <input
                    required
                    min={1}
                    max={1440}
                    type="number"
                    value={durationMinutes}
                    onChange={(event) => {
                      setDurationMinutes(
                        event.target.value,
                      );
                    }}
                  />
                </label>

                <label>
                  Percentile
                  <input
                    min={0}
                    max={100}
                    type="number"
                    value={percentile}
                    onChange={(event) => {
                      setPercentile(
                        event.target.value,
                      );
                    }}
                  />
                </label>

                <label>
                  Rank
                  <input
                    min={1}
                    type="number"
                    value={rank}
                    onChange={(event) => {
                      setRank(
                        event.target.value,
                      );
                    }}
                  />
                </label>

                <label>
                  Rank out of
                  <input
                    min={1}
                    type="number"
                    value={rankOutOf}
                    onChange={(event) => {
                      setRankOutOf(
                        event.target.value,
                      );
                    }}
                  />
                </label>
              </div>

              <section className="mock-section-form-list">
                {selectedTest.sections.map(
                  (
                    section:
                      MockTestSection,
                  ) => {
                    const form =
                      sectionForms.find(
                        (item) =>
                          item.sectionId ===
                          section.id,
                      );

                    if (!form) {
                      return null;
                    }

                    return (
                      <article
                        key={section.id}
                        className="mock-section-form"
                      >
                        <header>
                          <div>
                            <span>
                              SECTION{" "}
                              {
                                section.sequenceNumber
                              }
                            </span>
                            <h3>
                              {section.name}
                            </h3>
                          </div>

                          <strong>
                            {
                              section.totalQuestions
                            } questions ·{" "}
                            {
                              section.totalMarks
                            } marks
                          </strong>
                        </header>

                        <div className="mock-form-grid section-grid">
                          {(
                            [
                              [
                                "Attempted",
                                "attempted",
                              ],
                              [
                                "Correct",
                                "correct",
                              ],
                              [
                                "Incorrect",
                                "incorrect",
                              ],
                              [
                                "Minutes",
                                "minutes",
                              ],
                            ] as const
                          ).map(
                            (
                              [
                                label,
                                field,
                              ],
                            ) => (
                              <label
                                key={field}
                              >
                                {label}
                                <input
                                  required
                                  min={0}
                                  type="number"
                                  value={
                                    form[field]
                                  }
                                  onChange={(
                                    event,
                                  ) => {
                                    updateSection(
                                      section.id,
                                      field,
                                      event
                                        .target
                                        .value,
                                    );
                                  }}
                                />
                              </label>
                            ),
                          )}
                        </div>

                        <details className="mock-topic-form">
                          <summary>
                            Optional weak-topic
                            result
                            <ChevronDown
                              size={15}
                            />
                          </summary>

                          <div className="mock-form-grid">
                            <label>
                              Topic
                              <select
                                value={
                                  form.topicId
                                }
                                onChange={(
                                  event,
                                ) => {
                                  updateSection(
                                    section.id,
                                    "topicId",
                                    event
                                      .target
                                      .value,
                                  );
                                }}
                              >
                                <option value="">
                                  No topic
                                </option>

                                {(
                                  section
                                    .topicBlueprints ??
                                  []
                                ).map(
                                  (blueprint) => (
                                    <option
                                      key={
                                        blueprint.id
                                      }
                                      value={
                                        blueprint
                                          .topicId
                                      }
                                    >
                                      {
                                        blueprint
                                          .topic
                                          .name
                                      }
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>

                            {(
                              [
                                [
                                  "Attempted",
                                  "topicAttempted",
                                ],
                                [
                                  "Correct",
                                  "topicCorrect",
                                ],
                                [
                                  "Incorrect",
                                  "topicIncorrect",
                                ],
                              ] as const
                            ).map(
                              (
                                [
                                  label,
                                  field,
                                ],
                              ) => (
                                <label
                                  key={field}
                                >
                                  {label}
                                  <input
                                    min={0}
                                    type="number"
                                    value={
                                      form[field]
                                    }
                                    onChange={(
                                      event,
                                    ) => {
                                      updateSection(
                                        section.id,
                                        field,
                                        event
                                          .target
                                          .value,
                                      );
                                    }}
                                  />
                                </label>
                              ),
                            )}
                          </div>
                        </details>
                      </article>
                    );
                  },
                )}
              </section>

              <label>
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => {
                    setNotes(
                      event.target.value,
                    );
                  }}
                  placeholder="What should be revised next?"
                />
              </label>

              <div className="mock-warning">
                <AlertTriangle size={16} />
                Enter only real completed-test
                results. AIMERS calculates the
                score from the marking scheme.
              </div>

              <button
                className="mock-submit"
                disabled={saving}
                type="submit"
              >
                {saving ? (
                  <LoaderCircle
                    className="mock-spin"
                    size={16}
                  />
                ) : (
                  <CheckCircle2
                    size={16}
                  />
                )}
                Save evaluated attempt
                <ArrowRight size={15} />
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
