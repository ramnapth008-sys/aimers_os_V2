import {
  useAuth,
} from "@aimers/auth";

import {
  Activity,
  AlertTriangle,
  BellRing,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Gauge,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  analyzeBehavior,
  generateInterventions,
  getBehaviorWorkspace,
  respondToIntervention,
} from "./behavior-ai.service";

import type {
  BehaviorSeverity,
  BehaviorSignal,
  BehaviorWorkspace,
  Intervention,
  InterventionResponseType,
} from "./behavior-ai.types";

import "./behavior-ai.css";

function label(
  value: string,
): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function formatDuration(
  seconds: number,
): string {
  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return "0m";
  }

  const hours =
    Math.floor(
      seconds / 3600,
    );

  const minutes =
    Math.floor(
      (
        seconds % 3600
      ) / 60,
    );

  if (hours === 0) {
    return `${Math.max(1, minutes)}m`;
  }

  return minutes > 0
    ? `${hours}h ${minutes}m`
    : `${hours}h`;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "No timestamp";
  }

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
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

function severityClass(
  severity: BehaviorSeverity,
): string {
  return severity.toLowerCase();
}

function scoreText(
  value: number | null,
): string {
  return value === null
    ? "—"
    : `${Math.round(value)}`;
}

function Metric({
  icon,
  label: metricLabel,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="behavior-metric">
      <span>{icon}</span>

      <div>
        <small>{metricLabel}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function SignalCard({
  signal,
}: {
  signal: BehaviorSignal;
}) {
  return (
    <article
      className={`behavior-signal ${severityClass(signal.severity)}`}
    >
      <header>
        <span>
          <Activity size={16} />
        </span>

        <div>
          <small>
            {label(signal.type)}
          </small>
          <h3>{signal.title}</h3>
        </div>

        <strong>
          {signal.severity}
        </strong>
      </header>

      <p>
        {signal.description}
      </p>

      {signal.recommendedAction && (
        <div className="behavior-recommendation">
          <Lightbulb size={15} />
          <span>
            {signal.recommendedAction}
          </span>
        </div>
      )}

      <footer>
        <span>
          Confidence{" "}
          {Math.round(
            signal.confidenceScore *
            100,
          )}
          %
        </span>

        <span>
          {label(
            signal.dataConfidence,
          )}
          {" data"}
        </span>
      </footer>
    </article>
  );
}

function InterventionCard({
  intervention,
  busy,
  onRespond,
}: {
  intervention: Intervention;
  busy: boolean;
  onRespond(
    interventionId: string,
    responseType:
      InterventionResponseType,
  ): void;
}) {
  return (
    <article className="behavior-intervention">
      <header>
        <span>
          <BellRing size={17} />
        </span>

        <div>
          <small>
            {label(
              intervention.type,
            )}
          </small>
          <h3>
            {intervention.title}
          </h3>
        </div>

        <strong
          className={
            intervention
              .status
              .toLowerCase()
          }
        >
          {label(
            intervention.status,
          )}
        </strong>
      </header>

      <p>
        {intervention.message}
      </p>

      <div className="behavior-intervention-actions">
        {intervention.status ===
          "SUGGESTED" && (
          <button
            disabled={busy}
            type="button"
            onClick={() => {
              onRespond(
                intervention.id,
                "ACCEPTED",
              );
            }}
          >
            <CheckCircle2 size={14} />
            Accept
          </button>
        )}

        {(intervention.status ===
          "ACCEPTED" ||
          intervention.status ===
            "ACTIVE") && (
          <button
            disabled={busy}
            type="button"
            onClick={() => {
              onRespond(
                intervention.id,
                "COMPLETED",
              );
            }}
          >
            <Target size={14} />
            Complete
          </button>
        )}

        <button
          className="secondary"
          disabled={busy}
          type="button"
          onClick={() => {
            onRespond(
              intervention.id,
              "DISMISSED",
            );
          }}
        >
          Dismiss
        </button>
      </div>

      <footer>
        <span>
          Created{" "}
          {formatDate(
            intervention.createdAt,
          )}
        </span>

        <span>
          No automatic blocking
        </span>
      </footer>
    </article>
  );
}

export function BehaviorAIPage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    days,
    setDays,
  ] = useState(7);

  const [
    workspace,
    setWorkspace,
  ] = useState<BehaviorWorkspace | null>(
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
    generating,
    setGenerating,
  ] = useState(false);

  const [
    busyIntervention,
    setBusyIntervention,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const timezone =
    useMemo(
      () =>
        Intl
          .DateTimeFormat()
          .resolvedOptions()
          .timeZone ||
        "Asia/Kolkata",
      [],
    );

  // AIMERS_BEHAVIOR_INTELLIGENCE_ACTIVATION_V1
  const load =
    useCallback(
      async (
        refresh = false,
        runAnalysis = false,
        silent = false,
      ) => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        if (!silent) {
          setNotice("");
        }

        try {
          if (runAnalysis) {
            const analysis =
              await analyzeBehavior(
                apiFetch,
                days,
                timezone,
              );

            const interventions =
              await generateInterventions(
                apiFetch,
              );

            if (!silent) {
              const signalText =
                `${analysis.processed.behaviorSignals} signal${
                  analysis.processed.behaviorSignals === 1
                    ? ""
                    : "s"
                }`;

              const actionText =
                interventions.created > 0
                  ? ` ${interventions.created} new guidance action${
                      interventions.created === 1
                        ? ""
                        : "s"
                    } created.`
                  : interventions.alreadyOpen > 0
                    ? " Existing guidance remains open."
                    : " No new intervention was required.";

              setNotice(
                `Analyzed ${analysis.processed.rawEvents} raw events into ${analysis.processed.normalizedSessions} normalized sessions and ${signalText}.${actionText}`,
              );
            }
          }

          setWorkspace(
            await getBehaviorWorkspace(
              apiFetch,
              days,
            ),
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to process Behavior AI.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        apiFetch,
        days,
        timezone,
      ],
    );

  useEffect(() => {
    void load(
      false,
      true,
      false,
    );
  }, [load]);

  useEffect(() => {
    let timer:
      number |
      undefined;

    const handleActivityIngested =
      () => {
        window.clearTimeout(
          timer,
        );

        timer =
          window.setTimeout(
            () => {
              void load(
                true,
                true,
                true,
              );
            },
            5000,
          );
      };

    window.addEventListener(
      "aimers:activity-ingested",
      handleActivityIngested,
    );

    return () => {
      window.clearTimeout(
        timer,
      );

      window.removeEventListener(
        "aimers:activity-ingested",
        handleActivityIngested,
      );
    };
  }, [load]);

  const aggregate =
    useMemo(
      () => {
        const summaries =
          workspace
            ?.overview
            .summaries ??
          [];

        return summaries.reduce(
          (
            total,
            summary,
          ) => ({
            studySeconds:
              total.studySeconds +
              summary.studySeconds,

            focusedStudySeconds:
              total.focusedStudySeconds +
              summary.focusedStudySeconds,

            distractionSeconds:
              total.distractionSeconds +
              summary.distractionSeconds,

            contextSwitches:
              total.contextSwitches +
              summary.contextSwitches,

            longestFocusSeconds:
              Math.max(
                total.longestFocusSeconds,
                summary.longestFocusSeconds,
              ),

            monitoredSeconds:
              total.monitoredSeconds +
              summary.monitoredSeconds,
          }),
          {
            studySeconds: 0,
            focusedStudySeconds: 0,
            distractionSeconds: 0,
            contextSwitches: 0,
            longestFocusSeconds: 0,
            monitoredSeconds: 0,
          },
        );
      },
      [workspace],
    );

  const generate =
    async () => {
      setGenerating(true);
      setError("");
      setNotice("");

      try {
        const result =
          await generateInterventions(
            apiFetch,
          );

        setNotice(
          result.created > 0
            ? `${result.created} new intervention${result.created === 1 ? "" : "s"} created.`
            : result.alreadyOpen > 0
              ? "The relevant interventions are already open."
              : "No unresolved signal currently needs a new intervention.",
        );

        await load(
          true,
          false,
          true,
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to generate interventions.",
        );
      } finally {
        setGenerating(false);
      }
    };

  const respond =
    async (
      interventionId: string,
      responseType:
        InterventionResponseType,
    ) => {
      setBusyIntervention(
        interventionId,
      );
      setError("");
      setNotice("");

      try {
        await respondToIntervention(
          apiFetch,
          interventionId,
          responseType,
        );

        setNotice(
          responseType ===
            "COMPLETED"
            ? "Intervention completed and its linked signal was resolved."
            : `Intervention ${responseType.toLowerCase()}.`,
        );

        await load(
          true,
          false,
          true,
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to update the intervention.",
        );
      } finally {
        setBusyIntervention("");
      }
    };

  if (loading) {
    return (
      <div className="behavior-page behavior-state-page">
        <section className="behavior-state">
          <LoaderCircle
            className="behavior-spin"
            size={32}
          />

          <h1>
            Reading behavior intelligence
          </h1>

          <p>
            Processing permitted activity into
            normalized sessions, signals, scores and
            guidance...
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="behavior-page behavior-state-page">
        <section className="behavior-state error">
          <AlertTriangle size={32} />

          <h1>
            Behavior AI unavailable
          </h1>

          <p>
            {error ||
              "No behavior workspace was returned."}
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

  const snapshot =
    workspace
      .overview
      .latestSnapshot;

  const activeSignals =
    workspace
      .overview
      .activeSignals;

  return (
    <div className="behavior-page">
      <header className="behavior-hero">
        <div className="behavior-hero-copy">
          <span className="behavior-eyebrow">
            <Sparkles size={14} />
            BEHAVIOUR INTELLIGENCE
          </span>

          <h1>
            Understand the pattern.
            <strong>
              {" "}Choose the next action.
            </strong>
          </h1>

          <p>
            Behavior AI turns permitted activity
            evidence into explainable signals. It
            reports confidence, avoids diagnosis and
            never activates focus controls without
            your confirmation.
          </p>

          <div className="behavior-hero-actions">
            <div className="behavior-period-control">
              {[7, 14, 30].map(
                (option) => (
                  <button
                    className={
                      option === days
                        ? "active"
                        : ""
                    }
                    key={option}
                    type="button"
                    onClick={() => {
                      setDays(option);
                    }}
                  >
                    {option}D
                  </button>
                ),
              )}
            </div>

            <button
              className="behavior-action-button"
              disabled={
                generating ||
                refreshing
              }
              type="button"
              onClick={() => {
                void generate();
              }}
            >
              <BrainCircuit size={15} />
              {generating
                ? "Generating…"
                : "Generate actions"}
            </button>

            <button
              className="behavior-action-button secondary"
              disabled={
                refreshing ||
                generating
              }
              type="button"
              onClick={() => {
                void load(
                  true,
                  true,
                  false,
                );
              }}
            >
              <RefreshCw
                className={
                  refreshing
                    ? "behavior-spin"
                    : ""
                }
                size={15}
              />
              {refreshing
                ? "Analyzing..."
                : "Analyze now"}
            </button>
          </div>
        </div>

        <section className="behavior-score-card">
          <div>
            <Gauge size={23} />
          </div>

          <small>
            CURRENT FOCUS SCORE
          </small>

          <strong>
            {scoreText(
              snapshot
                ?.focusScore ??
              null,
            )}
          </strong>

          <p>
            {snapshot
              ? `${label(snapshot.predictionConfidence)} confidence`
              : "Run behavior analysis to create a snapshot"}
          </p>

          <span>
            <ShieldCheck size={13} />
            Evidence, not diagnosis
          </span>
        </section>
      </header>

      {error && (
        <div className="behavior-inline-message error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="behavior-inline-message success">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      <section className="behavior-metrics">
        <Metric
          icon={<Zap size={19} />}
          label="FOCUSED STUDY"
          value={formatDuration(
            aggregate.focusedStudySeconds,
          )}
          detail={`${formatDuration(aggregate.studySeconds)} total study`}
        />

        <Metric
          icon={<Activity size={19} />}
          label="DISTRACTION RISK"
          value={scoreText(
            snapshot
              ?.distractionRiskScore ??
            null,
          )}
          detail={`${formatDuration(aggregate.distractionSeconds)} observed`}
        />

        <Metric
          icon={<TrendingUp size={19} />}
          label="LONGEST FOCUS"
          value={formatDuration(
            aggregate.longestFocusSeconds,
          )}
          detail={`${aggregate.contextSwitches} context switches`}
        />

        <Metric
          icon={<Gauge size={19} />}
          label="OVERLOAD RISK"
          value={scoreText(
            snapshot
              ?.overloadRiskScore ??
            null,
          )}
          detail={`${formatDuration(aggregate.monitoredSeconds)} monitored`}
        />
      </section>

      <section className="behavior-main-grid">
        <article className="behavior-panel">
          <header className="behavior-panel-header">
            <div>
              <small>
                ACTIVE SIGNALS
              </small>
              <h2>
                What the evidence shows
              </h2>
            </div>

            <span>
              {activeSignals.length}
              {" active"}
            </span>
          </header>

          <div className="behavior-signal-list">
            {activeSignals.length === 0
              ? (
                <div className="behavior-empty">
                  <Activity size={24} />
                  <strong>
                    No active behavior signals
                  </strong>
                  <p>
                    Run behavior analysis after
                    activity data has been collected.
                  </p>
                </div>
              )
              : activeSignals.map(
                  (signal) => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                    />
                  ),
                )}
          </div>
        </article>

        <article className="behavior-panel">
          <header className="behavior-panel-header">
            <div>
              <small>
                DAILY PATTERN
              </small>
              <h2>
                Focus versus distraction
              </h2>
            </div>

            <Clock3 size={20} />
          </header>

          <div className="behavior-day-list">
            {workspace
              .overview
              .summaries
              .length === 0
              ? (
                <div className="behavior-empty">
                  <Clock3 size={24} />
                  <strong>
                    No processed days yet
                  </strong>
                  <p>
                    Daily summaries appear after
                    Behavior AI analysis runs.
                  </p>
                </div>
              )
              : workspace
                  .overview
                  .summaries
                  .map(
                    (summary) => {
                      const maximum =
                        Math.max(
                          1,
                          summary.studySeconds,
                          summary.distractionSeconds,
                        );

                      return (
                        <div
                          className="behavior-day"
                          key={summary.id}
                        >
                          <header>
                            <span>
                              {new Intl.DateTimeFormat(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  timeZone: "UTC",
                                },
                              ).format(
                                new Date(
                                  summary.summaryDate,
                                ),
                              )}
                            </span>

                            <strong>
                              {label(
                                summary.confidence,
                              )}
                            </strong>
                          </header>

                          <div>
                            <span>
                              Study
                            </span>

                            <i>
                              <b
                                style={{
                                  width:
                                    `${(
                                      summary.studySeconds /
                                      maximum
                                    ) * 100}%`,
                                }}
                              />
                            </i>

                            <strong>
                              {formatDuration(
                                summary.studySeconds,
                              )}
                            </strong>
                          </div>

                          <div className="distraction">
                            <span>
                              Distraction
                            </span>

                            <i>
                              <b
                                style={{
                                  width:
                                    `${(
                                      summary.distractionSeconds /
                                      maximum
                                    ) * 100}%`,
                                }}
                              />
                            </i>

                            <strong>
                              {formatDuration(
                                summary.distractionSeconds,
                              )}
                            </strong>
                          </div>
                        </div>
                      );
                    },
                  )}
          </div>
        </article>
      </section>

      <section className="behavior-panel">
        <header className="behavior-panel-header">
          <div>
            <small>
              INTERVENTION ENGINE
            </small>
            <h2>
              Suggested next actions
            </h2>
          </div>

          <span>
            {workspace
              .interventions
              .length}
            {" open"}
          </span>
        </header>

        <div className="behavior-intervention-grid">
          {workspace
            .interventions
            .length === 0
            ? (
              <div className="behavior-empty wide">
                <BellRing size={24} />
                <strong>
                  No open interventions
                </strong>
                <p>
                  Generate actions from unresolved
                  behavior signals. Suggestions remain
                  under your control.
                </p>
              </div>
            )
            : workspace
                .interventions
                .map(
                  (intervention) => (
                    <InterventionCard
                      busy={
                        busyIntervention ===
                        intervention.id
                      }
                      intervention={
                        intervention
                      }
                      key={
                        intervention.id
                      }
                      onRespond={
                        (
                          interventionId,
                          responseType,
                        ) => {
                          void respond(
                            interventionId,
                            responseType,
                          );
                        }
                      }
                    />
                  ),
                )}
        </div>
      </section>

      <section className="behavior-bottom-grid">
        <article className="behavior-panel">
          <header className="behavior-panel-header">
            <div>
              <small>
                RECENT SESSIONS
              </small>
              <h2>
                Normalized behavior timeline
              </h2>
            </div>

            <Target size={20} />
          </header>

          <div className="behavior-session-list">
            {workspace
              .overview
              .recentSessions
              .length === 0
              ? (
                <div className="behavior-empty">
                  <Target size={24} />
                  <strong>
                    No normalized sessions
                  </strong>
                </div>
              )
              : workspace
                  .overview
                  .recentSessions
                  .slice(
                    0,
                    10,
                  )
                  .map(
                    (session) => (
                      <div
                        className="behavior-session"
                        key={session.id}
                      >
                        <span>
                          <Target size={15} />
                        </span>

                        <div>
                          <strong>
                            {session.appName ??
                              session.domain ??
                              label(
                                session.source,
                              )}
                          </strong>

                          <small>
                            {label(
                              session.category,
                            )}
                            {" · "}
                            {formatDate(
                              session.startedAt,
                            )}
                          </small>
                        </div>

                        <div>
                          <strong>
                            {formatDuration(
                              session.durationSeconds ??
                              0,
                            )}
                          </strong>

                          <small>
                            {session.interruptionCount}
                            {" interruptions"}
                          </small>
                        </div>
                      </div>
                    ),
                  )}
          </div>
        </article>

        <article className="behavior-panel behavior-integrity">
          <header className="behavior-panel-header">
            <div>
              <small>
                MODEL INTEGRITY
              </small>
              <h2>
                How to read this page
              </h2>
            </div>

            <ShieldCheck size={20} />
          </header>

          <div className="behavior-integrity-list">
            <div>
              <CheckCircle2 size={16} />
              <p>
                Signals include measured confidence
                and source confidence.
              </p>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <p>
                Behavior patterns are not medical or
                psychological diagnoses.
              </p>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <p>
                Focus controls require separate
                consent and explicit confirmation.
              </p>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <p>
                Completing an intervention can resolve
                its linked behavior signal.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
