import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleDashed,
  Gauge,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
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
  getPredictionWorkspace,
} from "./prediction.service";

import type {
  PredictionConfidence,
  PredictionSubjectSignal,
  PredictionWorkspace,
} from "./prediction.types";

import "./prediction.css";

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
          ) *
          0.96;

        return `${x},${y}`;
      },
    )
    .join(" ");
}

function dateLabel(
  value: string | null,
): string {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    },
  ).format(
    new Date(value),
  );
}

function confidenceLabel(
  confidence: PredictionConfidence,
): string {
  return confidence
    .toLowerCase()
    .replace(
      /^\w/,
      (letter) =>
        letter.toUpperCase(),
    );
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
    <article className="prediction-metric">
      <span>{icon}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function SubjectCard({
  subject,
}: {
  subject:
    PredictionSubjectSignal;
}) {
  const movement =
    subject.movement;

  return (
    <article className="prediction-subject">
      <header>
        <div>
          <small>
            {subject.attemptCount} TEST
            {subject.attemptCount === 1
              ? ""
              : "S"}
          </small>

          <h3>{subject.name}</h3>
        </div>

        <span
          className={
            subject.risk
              .toLowerCase()
          }
        >
          {subject.risk}
        </span>
      </header>

      <div className="prediction-subject-score">
        <strong>
          {subject.scorePercent}%
        </strong>

        <span>
          score baseline
        </span>
      </div>

      <div className="prediction-subject-track">
        <i
          style={{
            width:
              `${subject.scorePercent}%`,
          }}
        />
      </div>

      <footer>
        <span>
          Accuracy
          <strong>
            {subject.accuracyPercent}%
          </strong>
        </span>

        <span>
          Movement
          <strong
            className={
              movement === null
                ? ""
                : movement >= 0
                  ? "positive"
                  : "negative"
            }
          >
            {movement === null
              ? "—"
              : `${movement > 0 ? "+" : ""}${movement}%`}
          </strong>
        </span>
      </footer>
    </article>
  );
}

export function PredictionPage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] = useState<PredictionWorkspace | null>(
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
            await getPredictionWorkspace(
              apiFetch,
            ),
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load prediction evidence.",
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

  const scorePoints =
    useMemo(
      () =>
        graphPoints(
          workspace?.trend.map(
            (item) =>
              item.percentage,
          ) ?? [],
        ),
      [workspace],
    );

  const accuracyPoints =
    useMemo(
      () =>
        graphPoints(
          workspace?.trend.map(
            (item) =>
              item.accuracyPercent,
          ) ?? [],
        ),
      [workspace],
    );

  if (loading) {
    return (
      <div className="prediction-page prediction-state-page">
        <section className="prediction-state">
          <LoaderCircle
            className="prediction-spin"
            size={31}
          />

          <h1>
            Building evidence workspace
          </h1>

          <p>
            Reading evaluated tests, subject
            results and weak-topic signals…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="prediction-page prediction-state-page">
        <section className="prediction-state error">
          <AlertTriangle size={31} />

          <h1>
            Prediction evidence unavailable
          </h1>

          <p>
            {error ||
              "No assessment evidence was returned."}
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

  const {
    evidence,
    baselineRange,
  } = workspace;

  const readinessStyle = {
    "--prediction-readiness":
      `${evidence.readinessPercent}%`,
  } as CSSProperties;

  return (
    <div className="prediction-page">
      <header className="prediction-hero">
        <div>
          <span className="prediction-eyebrow">
            <Sparkles size={14} />
            PERFORMANCE EVIDENCE
          </span>

          <h1>
            Know the trend.
            <strong>
              {" "}Respect the uncertainty.
            </strong>
          </h1>

          <p>
            AIMERS analyses completed mock tests,
            subject balance, consistency and weak
            topics. It shows observed evidence and
            a conservative baseline—not a fabricated
            exam rank.
          </p>

          <div className="prediction-hero-actions">
            <Link to="/mock-tests">
              Record another test
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
                    ? "prediction-spin"
                    : ""
                }
                size={15}
              />
              Refresh evidence
            </button>
          </div>
        </div>

        <section className="prediction-readiness-card">
          <div
            className="prediction-readiness-ring"
            style={readinessStyle}
          >
            <div>
              <strong>
                {evidence.attemptCount}/
                {evidence.requiredAttempts}
              </strong>
              <span>minimum tests</span>
            </div>
          </div>

          <small>
            BASELINE READINESS
          </small>

          <strong>
            {evidence.predictionReady
              ? "Ready"
              : "Collecting"}
          </strong>

          <p>
            Confidence:{" "}
            {confidenceLabel(
              evidence.confidence,
            )}
          </p>
        </section>
      </header>

      {error && (
        <div className="prediction-inline-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="prediction-metrics">
        <Metric
          icon={<Target size={19} />}
          label="LATEST SCORE"
          value={
            evidence.latestScore ===
            null
              ? "—"
              : `${evidence.latestScore}%`
          }
          detail="Most recent evaluated test"
        />

        <Metric
          icon={<BarChart3 size={19} />}
          label="AVERAGE SCORE"
          value={
            `${evidence.averageScore}%`
          }
          detail="Across evaluated tests"
        />

        <Metric
          icon={<Trophy size={19} />}
          label="BEST SCORE"
          value={
            `${evidence.bestScore}%`
          }
          detail="Highest observed result"
        />

        <Metric
          icon={<Gauge size={19} />}
          label="AVERAGE ACCURACY"
          value={
            `${evidence.averageAccuracy}%`
          }
          detail="Correct out of attempted"
        />

        <Metric
          icon={
            evidence.movement ===
              null ||
            evidence.movement >= 0
              ? <TrendingUp size={19} />
              : <TrendingDown size={19} />
          }
          label="RECENT MOVEMENT"
          value={
            evidence.movement === null
              ? "—"
              : `${evidence.movement > 0 ? "+" : ""}${evidence.movement}%`
          }
          detail="Latest versus previous test"
        />
      </section>

      <section className="prediction-layout">
        <div className="prediction-primary">
          <article className="prediction-panel prediction-chart-panel">
            <header className="prediction-panel-header">
              <div>
                <span>
                  OBSERVED PERFORMANCE
                </span>
                <h2>
                  Score and accuracy trend
                </h2>
              </div>

              <strong>
                {workspace.trend.length}
                {" "}data point
                {workspace.trend.length === 1
                  ? ""
                  : "s"}
              </strong>
            </header>

            {workspace.trend.length ===
            0 ? (
              <div className="prediction-empty">
                <CircleDashed size={31} />
                <strong>
                  No assessment history
                </strong>
                <p>
                  Complete and record a mock test
                  to begin.
                </p>
              </div>
            ) : (
              <>
                <div className="prediction-chart">
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
                      aria-label="Observed score and accuracy history"
                    >
                      <polyline
                        className="prediction-score-line"
                        points={scorePoints}
                        fill="none"
                        strokeWidth="4"
                        vectorEffect="non-scaling-stroke"
                      />

                      <polyline
                        className="prediction-accuracy-line"
                        points={accuracyPoints}
                        fill="none"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    <div>
                      {workspace.trend.map(
                        (
                          point,
                          index,
                        ) => (
                          <span
                            key={
                              point.attemptId
                            }
                          >
                            {dateLabel(
                              point.submittedAt,
                            ) ||
                              `A${index + 1}`}
                          </span>
                        ),
                      )}
                    </div>
                  </section>
                </div>

                <footer className="prediction-legend">
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

          <article className="prediction-panel">
            <header className="prediction-panel-header">
              <div>
                <span>
                  SUBJECT EVIDENCE
                </span>
                <h2>
                  Performance balance
                </h2>
              </div>

              <BrainCircuit size={19} />
            </header>

            {workspace.subjects.length ===
            0 ? (
              <div className="prediction-empty">
                <BrainCircuit size={31} />
                <strong>
                  No subject results
                </strong>
                <p>
                  Section-level results are required.
                </p>
              </div>
            ) : (
              <div className="prediction-subject-grid">
                {workspace.subjects.map(
                  (subject) => (
                    <SubjectCard
                      key={subject.key}
                      subject={subject}
                    />
                  ),
                )}
              </div>
            )}
          </article>
        </div>

        <aside className="prediction-secondary">
          <article className="prediction-panel prediction-baseline-panel">
            <header className="prediction-panel-header">
              <div>
                <span>
                  CONSERVATIVE BASELINE
                </span>
                <h2>
                  Evidence-based score band
                </h2>
              </div>

              <ShieldCheck size={19} />
            </header>

            {!baselineRange ? (
              <div className="prediction-collecting">
                <CircleDashed size={31} />

                <strong>
                  {
                    Math.max(
                      0,
                      evidence.requiredAttempts -
                      evidence.attemptCount,
                    )
                  } more evaluated test
                  {
                    evidence.requiredAttempts -
                    evidence.attemptCount ===
                    1
                      ? ""
                      : "s"
                  }
                </strong>

                <p>
                  AIMERS will not create a score
                  band before the minimum evidence
                  threshold is reached.
                </p>

                <Link to="/mock-tests">
                  Open Mock Tests
                </Link>
              </div>
            ) : (
              <div className="prediction-baseline">
                <div>
                  <span>
                    {baselineRange.lower}%
                  </span>

                  <strong>
                    {baselineRange.centre}%
                  </strong>

                  <span>
                    {baselineRange.upper}%
                  </span>
                </div>

                <div className="prediction-range-track">
                  <i />
                  <b />
                </div>

                <p>
                  Statistical baseline based on
                  recent weighted performance and
                  observed variability. Uncertainty:
                  ±{baselineRange.uncertainty}
                  percentage points.
                </p>
              </div>
            )}
          </article>

          <article className="prediction-panel">
            <header className="prediction-panel-header">
              <div>
                <span>
                  WEAK-TOPIC RISK
                </span>
                <h2>
                  Repeated low-accuracy signals
                </h2>
              </div>

              <Zap size={19} />
            </header>

            {workspace.weakTopics.length ===
            0 ? (
              <div className="prediction-empty compact">
                <CheckCircle2 size={28} />
                <strong>
                  No weak-topic evidence
                </strong>
                <p>
                  Add topic-level results when
                  recording tests.
                </p>
              </div>
            ) : (
              <div className="prediction-weak-list">
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
                            topic.averageAccuracy
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
          </article>

          <article className="prediction-panel prediction-integrity">
            <header className="prediction-panel-header">
              <div>
                <span>
                  MODEL INTEGRITY
                </span>
                <h2>
                  What AIMERS is claiming
                </h2>
              </div>

              <ShieldCheck size={19} />
            </header>

            <div>
              <span>
                <CheckCircle2 size={15} />
                Real evaluated test history
              </span>

              <span>
                <CheckCircle2 size={15} />
                Subject and topic evidence
              </span>

              <span>
                <CheckCircle2 size={15} />
                Transparent uncertainty
              </span>

              <span className="blocked">
                <AlertTriangle size={15} />
                No exam-rank forecast
              </span>

              <span className="blocked">
                <AlertTriangle size={15} />
                No trained ML model yet
              </span>
            </div>

            <p>
              {workspace.integrity.statement}
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
