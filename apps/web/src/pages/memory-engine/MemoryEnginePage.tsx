import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  Layers3,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getMemoryEngineWorkspace,
} from "./memory-engine.service";

import type {
  MemoryEngineWorkspace,
  MemoryRiskBand,
  MemoryTopicPriority,
} from "./memory-engine.types";

import "./memory-engine.css";

function messageFrom(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "The Memory Engine request failed.";
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "No review scheduled";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Schedule unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatShortDate(
  value: string,
): string {
  const date =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    },
  ).format(date);
}

function riskClass(
  band: MemoryRiskBand,
): string {
  return band
    .toLowerCase()
    .replaceAll(
      "_",
      "-",
    );
}

function scoreText(
  value: number | null,
): string {
  return value === null
    ? "—"
    : `${value}%`;
}

function actionPath(
  priority:
    MemoryTopicPriority,
): string {
  if (
    priority.evidence
      .flashcards.dueNow >
    0
  ) {
    return "/flashcards";
  }

  if (
    priority.evidence
      .questionBank
      .accuracyPercent !==
      null &&
    priority.evidence
      .questionBank
      .accuracyPercent <
      60
  ) {
    return "/question-bank";
  }

  if (
    priority.evidence
      .mockTests
      .weakSignals >
    0
  ) {
    return "/mock-tests";
  }

  return "/subjects";
}

function PriorityCard({
  priority,
}: {
  priority:
    MemoryTopicPriority;
}) {
  const path =
    actionPath(priority);

  return (
    <article className="me-priority-card">
      <header>
        <div>
          <span>
            {
              priority
                .topic
                .subjectName
            }
          </span>

          <h3>
            {
              priority
                .topic.name
            }
          </h3>

          <p>
            {
              priority
                .topic
                .chapterName
            }
          </p>
        </div>

        <b
          className={`me-risk-badge ${riskClass(
            priority.riskBand,
          )}`}
        >
          {priority.riskBand}
        </b>
      </header>

      <div className="me-priority-score">
        <div>
          <span>
            Risk
          </span>

          <strong>
            {
              priority
                .riskScore
            }
            %
          </strong>
        </div>

        <div>
          <span>
            Retention
          </span>

          <strong>
            {scoreText(
              priority
                .retentionScore,
            )}
          </strong>
        </div>

        <div>
          <span>
            Due
          </span>

          <strong>
            {
              priority
                .evidence
                .flashcards
                .dueNow
            }
          </strong>
        </div>
      </div>

      <div className="me-risk-track">
        <span
          style={{
            width:
              `${priority.riskScore}%`,
          }}
        />
      </div>

      <ul>
        {priority.reasons
          .slice(
            0,
            2,
          )
          .map(
            (
              reason,
            ) => (
              <li
                key={
                  reason
                }
              >
                {reason}
              </li>
            ),
          )}
      </ul>

      <footer>
        <div>
          <span>
            Recommended
          </span>

          <strong>
            {
              priority
                .action
            }
          </strong>
        </div>

        <Link to={path}>
          Open
          <ArrowRight
            size={15}
          />
        </Link>
      </footer>
    </article>
  );
}

export function MemoryEnginePage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] =
    useState<MemoryEngineWorkspace | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

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
          setWorkspace(
            await getMemoryEngineWorkspace(
              apiFetch,
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
          setLoading(false);
          setRefreshing(false);
        }
      },
      [apiFetch],
    );

  useEffect(
    () => {
      void loadWorkspace();
    },
    [loadWorkspace],
  );

  const topPriorities =
    useMemo(
      () =>
        workspace
          ?.priorities
          .filter(
            (item) =>
              item.hasEvidence,
          )
          .slice(
            0,
            6,
          ) ??
        [],
      [workspace],
    );

  const maxTrendReviews =
    useMemo(
      () =>
        Math.max(
          1,
          ...(
            workspace
              ?.retentionTrend
              .map(
                (item) =>
                  item.reviews,
              ) ??
            [1]
          ),
        ),
      [workspace],
    );

  if (loading) {
    return (
      <div className="memory-engine-page me-state-page">
        <section className="me-state-card">
          <LoaderCircle
            className="me-spin"
            size={36}
          />

          <h1>
            Building retention
            intelligence
          </h1>

          <p>
            Combining mastery,
            Question Bank, mock-test
            and Flashcards evidence…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="memory-engine-page me-state-page">
        <section className="me-state-card error">
          <AlertTriangle
            size={36}
          />

          <h1>
            Memory Engine unavailable
          </h1>

          <p>
            {error ||
              "The retention workspace could not be loaded."}
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

  const {
    summary,
    reviewLoad,
  } = workspace;

  return (
    <div className="memory-engine-page">
      <header className="me-hero">
        <section className="me-hero-copy">
          <span className="me-eyebrow">
            <Sparkles
              size={14}
            />
            RETENTION INTELLIGENCE
          </span>

          <h1>
            See what your brain is
            <strong>
              {" "}about to forget.
            </strong>
          </h1>

          <p>
            AIMERS combines topic
            mastery, practice
            accuracy, mock-test
            weakness and spaced-
            repetition behaviour
            into one memory-risk
            model.
          </p>

          <div className="me-hero-actions">
            <Link
              className="primary"
              to="/flashcards"
            >
              <Zap size={17} />
              Review due cards

              <span>
                {
                  summary
                    .dueNow
                }
              </span>
            </Link>

            <Link
              to="/question-bank"
            >
              <Target
                size={17}
              />
              Target weak topics
            </Link>

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
                    ? "me-spin"
                    : ""
                }
                size={17}
              />
              Refresh
            </button>
          </div>
        </section>

        <aside className="me-score-card">
          <div className="me-score-orbit">
            <BrainCircuit
              size={40}
            />
          </div>

          <span>
            MEMORY SCORE
          </span>

          <strong>
            {
              summary
                .memoryScore
            }
            %
          </strong>

          <b>
            {
              summary
                .retentionBand
            }
          </b>

          <p>
            Based on{" "}
            {
              summary
                .assessedTopics
            }
            {" "}assessed topic
            {summary
              .assessedTopics ===
            1
              ? ""
              : "s"}
          </p>

          <footer>
            <CalendarClock
              size={15}
            />

            <span>
              Next evidence:
              {" "}
              {formatDateTime(
                summary
                  .nextDueAt,
              )}
            </span>
          </footer>
        </aside>
      </header>

      {error && (
        <div className="me-inline-error">
          <AlertTriangle
            size={16}
          />
          {error}
        </div>
      )}

      <section className="me-metrics">
        <article>
          <Brain
            size={19}
          />

          <span>
            Assessed topics
          </span>

          <strong>
            {
              summary
                .assessedTopics
            }
            /
            {
              summary
                .totalTopics
            }
          </strong>

          <p>
            Topics with meaningful
            evidence
          </p>
        </article>

        <article>
          <ShieldAlert
            size={19}
          />

          <span>
            High-risk topics
          </span>

          <strong>
            {
              summary
                .criticalTopics +
              summary
                .highRiskTopics
            }
          </strong>

          <p>
            Critical and high
            retention risk
          </p>
        </article>

        <article>
          <BookOpenCheck
            size={19}
          />

          <span>
            Due now
          </span>

          <strong>
            {
              summary
                .dueNow
            }
          </strong>

          <p>
            Flashcards requiring
            immediate review
          </p>
        </article>

        <article>
          <TrendingUp
            size={19}
          />

          <span>
            Strong recall
          </span>

          <strong>
            {
              summary
                .strongRecallPercent
            }
            %
          </strong>

          <p>
            GOOD and EASY ratings
            across reviews
          </p>
        </article>
      </section>

      <main className="me-main-grid">
        <section className="me-panel me-priorities">
          <header className="me-section-head">
            <div>
              <span>
                PRIORITY QUEUE
              </span>

              <h2>
                Topics needing
                attention
              </h2>

              <p>
                Ranked using
                retention,
                due-load, lapses
                and weak-test
                signals.
              </p>
            </div>

            <b>
              <Flame
                size={15}
              />
              {
                topPriorities
                  .length
              }
              {" "}surfaced
            </b>
          </header>

          {topPriorities.length ===
          0 ? (
            <div className="me-empty">
              <CheckCircle2
                size={26}
              />

              <strong>
                No evidence-backed
                risk yet
              </strong>

              <p>
                Complete practice,
                mock tests and
                reviews to build
                retention signals.
              </p>
            </div>
          ) : (
            <div className="me-priority-grid">
              {topPriorities.map(
                (
                  priority,
                ) => (
                  <PriorityCard
                    key={
                      priority
                        .topic.id
                    }
                    priority={
                      priority
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>

        <aside className="me-side-column">
          <section className="me-panel me-load-card">
            <header>
              <div>
                <span>
                  REVIEW LOAD
                </span>

                <h2>
                  Upcoming queue
                </h2>
              </div>

              <Clock3
                size={22}
              />
            </header>

            <div className="me-load-ring">
              <strong>
                {
                  reviewLoad
                    .overdueOrDueNow
                }
              </strong>

              <span>
                due now
              </span>
            </div>

            <dl>
              <div>
                <dt>
                  Next 24h
                </dt>

                <dd>
                  {
                    reviewLoad
                      .dueNext24Hours
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Next 7d
                </dt>

                <dd>
                  {
                    reviewLoad
                      .dueNext7Days
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Later
                </dt>

                <dd>
                  {
                    reviewLoad
                      .dueLater
                  }
                </dd>
              </div>
            </dl>
          </section>

          <section className="me-panel me-evidence-card">
            <header>
              <div>
                <span>
                  EVIDENCE MIX
                </span>

                <h2>
                  Current accuracy
                </h2>
              </div>

              <Gauge
                size={22}
              />
            </header>

            <div className="me-evidence-list">
              <div>
                <header>
                  <span>
                    Question Bank
                  </span>

                  <strong>
                    {scoreText(
                      summary
                        .questionBankAccuracyPercent,
                    )}
                  </strong>
                </header>

                <div>
                  <span
                    style={{
                      width:
                        `${
                          summary
                            .questionBankAccuracyPercent ??
                          0
                        }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <header>
                  <span>
                    Mock tests
                  </span>

                  <strong>
                    {scoreText(
                      summary
                        .mockTestAccuracyPercent,
                    )}
                  </strong>
                </header>

                <div>
                  <span
                    style={{
                      width:
                        `${
                          summary
                            .mockTestAccuracyPercent ??
                          0
                        }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <header>
                  <span>
                    Flashcard recall
                  </span>

                  <strong>
                    {
                      summary
                        .strongRecallPercent
                    }
                    %
                  </strong>
                </header>

                <div>
                  <span
                    style={{
                      width:
                        `${summary.strongRecallPercent}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </aside>
      </main>

      <section className="me-panel me-subjects">
        <header className="me-section-head">
          <div>
            <span>
              SUBJECT RETENTION
            </span>

            <h2>
              Memory profile by
              subject
            </h2>
          </div>

          <Layers3
            size={22}
          />
        </header>

        <div className="me-subject-grid">
          {workspace.subjects.map(
            (
              subject,
            ) => (
              <article
                key={
                  subject
                    .subject.id
                }
              >
                <header>
                  <div>
                    <span>
                      {
                        subject
                          .subject.code
                      }
                    </span>

                    <h3>
                      {
                        subject
                          .subject.name
                      }
                    </h3>
                  </div>

                  <strong>
                    {scoreText(
                      subject
                        .retentionScore,
                    )}
                  </strong>
                </header>

                <div className="me-subject-track">
                  <span
                    style={{
                      width:
                        `${
                          subject
                            .retentionScore ??
                          0
                        }%`,
                    }}
                  />
                </div>

                <dl>
                  <div>
                    <dt>
                      Topics
                    </dt>

                    <dd>
                      {
                        subject
                          .assessedTopicCount
                      }
                      /
                      {
                        subject
                          .topicCount
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Risk
                    </dt>

                    <dd>
                      {
                        subject
                          .criticalOrHighRiskTopics
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Due
                    </dt>

                    <dd>
                      {
                        subject
                          .dueCards
                      }
                    </dd>
                  </div>
                </dl>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="me-panel me-trend">
        <header className="me-section-head">
          <div>
            <span>
              RETENTION TREND
            </span>

            <h2>
              Last 14 days
            </h2>

            <p>
              Review volume and
              strong-recall ratio.
            </p>
          </div>

          <BarChart3
            size={22}
          />
        </header>

        <div className="me-trend-chart">
          {workspace
            .retentionTrend.map(
              (
                point,
              ) => {
                const height =
                  Math.max(
                    3,
                    Math.round(
                      (
                        point
                          .reviews /
                        maxTrendReviews
                      ) *
                        100,
                    ),
                  );

                return (
                  <div
                    key={
                      point.date
                    }
                  >
                    <div className="me-trend-bar">
                      <span
                        title={`${point.reviews} reviews`}
                        style={{
                          height:
                            `${height}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {
                        point
                          .strongRecallPercent ??
                        "—"
                      }
                      {point
                        .strongRecallPercent ===
                      null
                        ? ""
                        : "%"}
                    </strong>

                    <small>
                      {formatShortDate(
                        point.date,
                      )}
                    </small>
                  </div>
                );
              },
            )}
        </div>
      </section>
    </div>
  );
}
