import {
  useAuth,
} from "@aimers/auth";

import {
  Activity,
  AlertTriangle,
  AppWindow,
  CheckCircle2,
  Clock3,
  Globe2,
  LoaderCircle,
  Monitor,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
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
  Link,
} from "react-router-dom";

import {
  getDigitalActivityWorkspace,
} from "./digital-activity.service";

import type {
  ActivityEvent,
  DataConfidence,
  DigitalActivityWorkspace,
} from "./digital-activity.types";

import "./digital-activity.css";

function formatDuration(
  seconds: number,
): string {
  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return "0m";
  }

  const rounded =
    Math.round(seconds);

  const hours =
    Math.floor(
      rounded / 3600,
    );

  const minutes =
    Math.floor(
      (
        rounded % 3600
      ) / 60,
    );

  if (hours === 0) {
    return `${Math.max(1, minutes)}m`;
  }

  return minutes > 0
    ? `${hours}h ${minutes}m`
    : `${hours}h`;
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "Not synced yet";
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

function confidenceClass(
  value: DataConfidence,
): string {
  return value.toLowerCase();
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
    <article className="digital-metric">
      <span>{icon}</span>

      <div>
        <small>{metricLabel}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function EventRow({
  event,
}: {
  event: ActivityEvent;
}) {
  const source =
    event.appName ??
    event.domain ??
    label(event.source);

  const title =
    event.pageTitle ??
    label(event.type);

  return (
    <article className="digital-event-row">
      <span
        className={`digital-event-icon ${event.category.toLowerCase()}`}
      >
        {event.source === "LECTURE"
          ? <Video size={16} />
          : event.source === "WEBSITE" ||
              event.source === "BROWSER"
            ? <Globe2 size={16} />
            : <AppWindow size={16} />}
      </span>

      <div className="digital-event-copy">
        <div>
          <strong>{title}</strong>

          <span>
            {source}
            {" · "}
            {label(event.category)}
          </span>
        </div>

        <p>
          {formatDateTime(event.startedAt)}
          {" · "}
          {formatDuration(
            event.durationSeconds ??
            0,
          )}
        </p>
      </div>

      <span
        className={`digital-confidence ${confidenceClass(event.confidence)}`}
      >
        {label(event.confidence)}
      </span>
    </article>
  );
}

export function DigitalActivityPage() {
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
  ] = useState<DigitalActivityWorkspace | null>(
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
            await getDigitalActivityWorkspace(
              apiFetch,
              days,
            ),
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load Digital Activity.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        apiFetch,
        days,
      ],
    );

  useEffect(() => {
    void load();
  }, [load]);

  const categoryDistribution =
    useMemo(
      () => {
        const events =
          workspace
            ?.overview
            .recentEvents ??
          [];

        const counts =
          new Map<
            string,
            number
          >();

        for (
          const event
          of events
        ) {
          counts.set(
            event.category,
            (
              counts.get(
                event.category,
              ) ??
              0
            ) +
            1,
          );
        }

        const maximum =
          Math.max(
            1,
            ...counts.values(),
          );

        return [
          ...counts.entries(),
        ]
          .map(
            (
              [
                category,
                count,
              ],
            ) => ({
              category,
              count,
              width:
                (
                  count /
                  maximum
                ) *
                100,
            }),
          )
          .sort(
            (
              left,
              right,
            ) =>
              right.count -
              left.count,
          )
          .slice(
            0,
            6,
          );
      },
      [workspace],
    );

  if (loading) {
    return (
      <div className="digital-page digital-state-page">
        <section className="digital-state">
          <LoaderCircle
            className="digital-spin"
            size={32}
          />

          <h1>
            Connecting activity intelligence
          </h1>

          <p>
            Reading consent status, devices,
            connectors, lectures and recent events…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="digital-page digital-state-page">
        <section className="digital-state error">
          <AlertTriangle size={32} />

          <h1>
            Digital Activity unavailable
          </h1>

          <p>
            {error ||
              "No Digital Activity data was returned."}
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
    overview,
    intelligence,
  } = workspace;

  const activity =
    intelligence
      .intelligence
      .activity;

  const monitoringActive =
    overview.monitoring.enabled &&
    !overview.monitoring.pausedAt;

  const focusScore =
    intelligence
      .intelligence
      .latestSnapshot
      ?.focusScore;

  return (
    <div className="digital-page">
      <header className="digital-hero">
        <div className="digital-hero-copy">
          <span className="digital-eyebrow">
            <Radio size={14} />
            CONSENT-BASED MONITORING
          </span>

          <h1>
            See your digital day.
            <strong>
              {" "}Keep control of it.
            </strong>
          </h1>

          <p>
            AIMERS combines permitted device,
            browser, app and lecture signals into
            one transparent activity view. Measured
            data is kept separate from estimates.
          </p>

          <div className="digital-hero-actions">
            <div className="digital-period-control">
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
              className="digital-refresh-button"
              disabled={refreshing}
              type="button"
              onClick={() => {
                void load(true);
              }}
            >
              <RefreshCw
                className={
                  refreshing
                    ? "digital-spin"
                    : ""
                }
                size={15}
              />
              Refresh
            </button>
          </div>
        </div>

        <section
          className={`digital-monitor-card ${
            monitoringActive
              ? "active"
              : "paused"
          }`}
        >
          <span>
            {monitoringActive
              ? <CheckCircle2 size={22} />
              : <AlertTriangle size={22} />}
          </span>

          <small>
            MONITORING STATUS
          </small>

          <strong>
            {monitoringActive
              ? "Active"
              : intelligence.privacy.paused
                ? "Paused"
                : "Disabled"}
          </strong>

          <p>
            {overview.monitoring.activeDevices}
            {" of "}
            {overview.monitoring.connectedDevices}
            {" devices active"}
          </p>

          <div>
            <i />
            {overview.monitoring.background
              ? "Background collection permitted"
              : "Background collection off"}
          </div>
        </section>
      </header>

      {error && (
        <div className="digital-inline-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="digital-metrics">
        <Metric
          icon={<Clock3 size={19} />}
          label="MONITORED TIME"
          value={formatDuration(
            activity.monitoredSeconds,
          )}
          detail={`${activity.averageCoveragePercent.toFixed(1)}% average coverage`}
        />

        <Metric
          icon={<Zap size={19} />}
          label="FOCUSED STUDY"
          value={formatDuration(
            activity.focusedStudySeconds,
          )}
          detail={
            focusScore === null ||
            focusScore === undefined
              ? "Focus score collecting"
              : `${Math.round(focusScore)} focus score`
          }
        />

        <Metric
          icon={<Video size={19} />}
          label="LECTURE TIME"
          value={formatDuration(
            activity.lectureSeconds,
          )}
          detail={`${intelligence.intelligence.incompleteLectureCount} incomplete lectures`}
        />

        <Metric
          icon={<Activity size={19} />}
          label="DISTRACTION"
          value={formatDuration(
            activity.distractionSeconds,
          )}
          detail={`${activity.contextSwitches} context switches`}
        />
      </section>

      <section className="digital-main-grid">
        <article className="digital-panel digital-activity-panel">
          <header className="digital-panel-header">
            <div>
              <small>
                ACTIVITY MIX
              </small>
              <h2>
                Recent signal distribution
              </h2>
            </div>

            <span>
              {overview.eventCount}
              {" events"}
            </span>
          </header>

          {categoryDistribution.length === 0
            ? (
              <div className="digital-empty">
                <Activity size={23} />
                <strong>
                  No recent activity signals
                </strong>
                <p>
                  Permitted collectors will appear
                  here after they begin sending data.
                </p>
              </div>
            )
            : (
              <div className="digital-category-list">
                {categoryDistribution.map(
                  (item) => (
                    <div
                      className="digital-category"
                      key={item.category}
                    >
                      <div>
                        <span>
                          {label(
                            item.category,
                          )}
                        </span>

                        <strong>
                          {item.count}
                        </strong>
                      </div>

                      <div>
                        <i
                          style={{
                            width:
                              `${item.width}%`,
                          }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

          <footer className="digital-data-note">
            <ShieldCheck size={16} />

            <p>
              Confidence:{" "}
              <strong>
                {label(
                  activity.confidence,
                )}
              </strong>
              . Exact lecture completion is shown
              only when the source can verify it.
            </p>
          </footer>
        </article>

        <article className="digital-panel digital-privacy-panel">
          <header className="digital-panel-header">
            <div>
              <small>
                PRIVACY CONTROLS
              </small>
              <h2>
                Your permissions
              </h2>
            </div>

            <ShieldCheck size={20} />
          </header>

          <div className="digital-permission-list">
            {[
              {
                label:
                  "Digital monitoring",
                enabled:
                  intelligence
                    .privacy
                    .monitoringEnabled,
              },
              {
                label:
                  "Behavior analysis",
                enabled:
                  intelligence
                    .privacy
                    .behaviorAnalysisEnabled,
              },
              {
                label:
                  "AI context sharing",
                enabled:
                  intelligence
                    .privacy
                    .aiContextEnabled,
              },
              {
                label:
                  "Notifications",
                enabled:
                  intelligence
                    .privacy
                    .notificationEnabled,
              },
              {
                label:
                  "Focus controls",
                enabled:
                  intelligence
                    .privacy
                    .focusControlsEnabled,
              },
            ].map(
              (permission) => (
                <div
                  key={
                    permission.label
                  }
                >
                  <span>
                    {permission.label}
                  </span>

                  <strong
                    className={
                      permission.enabled
                        ? "enabled"
                        : "disabled"
                    }
                  >
                    {permission.enabled
                      ? "Allowed"
                      : "Off"}
                  </strong>
                </div>
              ),
            )}
          </div>

          <Link to="/settings">
            Review privacy settings
          </Link>
        </article>
      </section>

      <section className="digital-connectivity-grid">
        <article className="digital-panel">
          <header className="digital-panel-header">
            <div>
              <small>
                CONNECTED DEVICES
              </small>
              <h2>
                Device network
              </h2>
            </div>

            <Monitor size={20} />
          </header>

          <div className="digital-device-list">
            {overview.devices.length === 0
              ? (
                <div className="digital-empty compact">
                  <Monitor size={21} />
                  <strong>
                    No devices connected
                  </strong>
                </div>
              )
              : overview.devices.map(
                  (device) => (
                    <div
                      className="digital-device"
                      key={device.id}
                    >
                      <span>
                        <Monitor size={17} />
                      </span>

                      <div>
                        <strong>
                          {device.name}
                        </strong>

                        <small>
                          {label(
                            device.platform,
                          )}
                          {" · "}
                          {formatDateTime(
                            device.lastSyncAt ??
                            device.lastSeenAt,
                          )}
                        </small>
                      </div>

                      <i
                        className={
                          device.status.toLowerCase()
                        }
                      >
                        {label(
                          device.status,
                        )}
                      </i>
                    </div>
                  ),
                )}
          </div>
        </article>

        <article className="digital-panel">
          <header className="digital-panel-header">
            <div>
              <small>
                DATA CONNECTORS
              </small>
              <h2>
                Source integrations
              </h2>
            </div>

            <Globe2 size={20} />
          </header>

          <div className="digital-device-list">
            {overview.connectors.length === 0
              ? (
                <div className="digital-empty compact">
                  <Globe2 size={21} />
                  <strong>
                    No connectors added
                  </strong>
                </div>
              )
              : overview.connectors.map(
                  (connector) => (
                    <div
                      className="digital-device"
                      key={connector.id}
                    >
                      <span>
                        <Globe2 size={17} />
                      </span>

                      <div>
                        <strong>
                          {connector.displayName}
                        </strong>

                        <small>
                          {label(
                            connector.type,
                          )}
                          {" · "}
                          {formatDateTime(
                            connector.lastSuccessfulSyncAt ??
                            connector.lastSyncAt,
                          )}
                        </small>
                      </div>

                      <i
                        className={
                          connector.status.toLowerCase()
                        }
                      >
                        {label(
                          connector.status,
                        )}
                      </i>
                    </div>
                  ),
                )}
          </div>
        </article>
      </section>

      <section className="digital-bottom-grid">
        <article className="digital-panel">
          <header className="digital-panel-header">
            <div>
              <small>
                RECENT ACTIVITY
              </small>
              <h2>
                Normalized timeline
              </h2>
            </div>

            <Radio size={20} />
          </header>

          <div className="digital-event-list">
            {overview.recentEvents.length === 0
              ? (
                <div className="digital-empty">
                  <Activity size={23} />
                  <strong>
                    Timeline is empty
                  </strong>
                  <p>
                    Activity appears after a permitted
                    collector sends an event.
                  </p>
                </div>
              )
              : overview.recentEvents
                  .slice(
                    0,
                    12,
                  )
                  .map(
                    (event) => (
                      <EventRow
                        event={event}
                        key={event.id}
                      />
                    ),
                  )}
          </div>
        </article>

        <article className="digital-panel">
          <header className="digital-panel-header">
            <div>
              <small>
                LECTURE PROGRESS
              </small>
              <h2>
                Cross-device continuity
              </h2>
            </div>

            <Video size={20} />
          </header>

          <div className="digital-lecture-list">
            {overview.recentLectures.length === 0
              ? (
                <div className="digital-empty">
                  <Video size={23} />
                  <strong>
                    No lecture sessions
                  </strong>
                  <p>
                    Connected learning platforms and
                    AIMERS lectures will appear here.
                  </p>
                </div>
              )
              : overview.recentLectures
                  .slice(
                    0,
                    8,
                  )
                  .map(
                    (lecture) => (
                      <article
                        className="digital-lecture"
                        key={lecture.id}
                      >
                        <div>
                          <span>
                            {lecture.platformName}
                          </span>

                          <strong>
                            {lecture.lectureTitle}
                          </strong>

                          <small>
                            {formatDuration(
                              lecture.focusedSeconds,
                            )}
                            {" focused · "}
                            {label(
                              lecture.confidence,
                            )}
                          </small>
                        </div>

                        <div className="digital-lecture-progress">
                          <span>
                            {Math.round(
                              lecture.completionPercent,
                            )}
                            %
                          </span>

                          <div>
                            <i
                              style={{
                                width:
                                  `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      lecture.completionPercent,
                                    ),
                                  )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </article>
                    ),
                  )}
          </div>
        </article>
      </section>
    </div>
  );
}
