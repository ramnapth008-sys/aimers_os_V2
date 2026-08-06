import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  BellRing,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  Globe2,
  HardDrive,
  History,
  Laptop,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MonitorCog,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Trash2,
  UserCheck,
  Wifi,
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
  grantConsent,
  getSettingsWorkspace,
  registerConnector,
  registerDevice,
  revokeConsent,
  updateConnectorStatus,
  updateDeviceStatus,
  updateMonitoringState,
  updatePrivacyPreferences,
} from "./settings.service";

import type {
  ConsentScope,
  DataConnectorStatus,
  DataConnectorType,
  DevicePlatform,
  DeviceStatus,
  SettingsWorkspace,
  UpdatePrivacyInput,
} from "./settings.types";

import "./settings.css";

interface PermissionDefinition {
  scope: ConsentScope;
  title: string;
  description: string;
  detail: string;
  icon: ReactNode;
  sensitivity:
    | "CORE"
    | "OPTIONAL"
    | "SENSITIVE";
}

interface PreferenceDefinition {
  field:
    keyof UpdatePrivacyInput;
  title: string;
  description: string;
  scope?: ConsentScope;
  sensitive?: boolean;
}

const PERMISSIONS:
  PermissionDefinition[] = [
    {
      scope:
        "DIGITAL_ACTIVITY_MONITORING",
      title:
        "Digital activity monitoring",
      description:
        "Allow AIMERS to receive permitted activity events from registered collectors.",
      detail:
        "Required before any device can be registered.",
      icon:
        <MonitorCog size={18} />,
      sensitivity:
        "CORE",
    },
    {
      scope:
        "APP_USAGE",
      title:
        "App usage",
      description:
        "Allow permitted app names, foreground duration and category signals.",
      detail:
        "Does not provide message content or keystrokes.",
      icon:
        <Smartphone size={18} />,
      sensitivity:
        "SENSITIVE",
    },
    {
      scope:
        "BROWSER_ACTIVITY",
      title:
        "Browser activity",
      description:
        "Allow browser-domain and page-title activity from an approved extension.",
      detail:
        "Full URL storage remains a separate privacy preference.",
      icon:
        <Globe2 size={18} />,
      sensitivity:
        "SENSITIVE",
    },
    {
      scope:
        "BROWSER_HISTORY_IMPORT",
      title:
        "Past browser-history import",
      description:
        "Allow a deliberate one-time or manual import of earlier browser history.",
      detail:
        "Never runs silently.",
      icon:
        <History size={18} />,
      sensitivity:
        "SENSITIVE",
    },
    {
      scope:
        "LECTURE_PROGRESS",
      title:
        "Lecture progress",
      description:
        "Allow lecture watch-time and completion evidence from approved learning sources.",
      detail:
        "Observed app-open time is not treated as exact completion.",
      icon:
        <Play size={18} />,
      sensitivity:
        "CORE",
    },
    {
      scope:
        "CROSS_DEVICE_SYNC",
      title:
        "Cross-device sync",
      description:
        "Combine permitted study signals across registered devices.",
      detail:
        "Uses the shared Student Intelligence Profile.",
      icon:
        <Wifi size={18} />,
      sensitivity:
        "OPTIONAL",
    },
    {
      scope:
        "BEHAVIOR_ANALYSIS",
      title:
        "Behavior analysis",
      description:
        "Generate explainable focus, distraction, revision and overload signals.",
      detail:
        "These signals are not medical diagnoses.",
      icon:
        <BrainCircuit size={18} />,
      sensitivity:
        "SENSITIVE",
    },
    {
      scope:
        "AI_CONTEXT_SHARING",
      title:
        "AI Mentor context",
      description:
        "Share structured academic and behavior summaries with AIMERS AI Mentor.",
      detail:
        "Privacy Policy V3 permits AI Mentor to use event-level activity evidence and sanitized full URLs when Raw Activity, Full URL Storage, and AI Context are enabled. Passwords, tokens, payment details, typed form content, and private external chats remain excluded.",
      icon:
        <UserCheck size={18} />,
      sensitivity:
        "SENSITIVE",
    },
    {
      scope:
        "NOTIFICATIONS",
      title:
        "Notifications",
      description:
        "Allow AIMERS to deliver intervention and study reminders.",
      detail:
        "Delivery remains separate from behavior-analysis permission.",
      icon:
        <BellRing size={18} />,
      sensitivity:
        "OPTIONAL",
    },
    {
      scope:
        "FOCUS_CONTROLS",
      title:
        "Focus controls",
      description:
        "Allow AIMERS to propose supported focus-control actions.",
      detail:
        "No app or website is blocked automatically.",
      icon:
        <LockKeyhole size={18} />,
      sensitivity:
        "SENSITIVE",
    },
  ];

const PREFERENCES:
  PreferenceDefinition[] = [
    {
      field:
        "monitoringEnabled",
      title:
        "Monitoring enabled",
      description:
        "Master switch for Digital Intelligence collection.",
      scope:
        "DIGITAL_ACTIVITY_MONITORING",
    },
    {
      field:
        "backgroundMonitoring",
      title:
        "Background monitoring",
      description:
        "Permit approved collectors to continue while AIMERS is not the active window.",
      scope:
        "DIGITAL_ACTIVITY_MONITORING",
      sensitive:
        true,
    },
    {
      field:
        "crossDeviceSync",
      title:
        "Cross-device intelligence",
      description:
        "Merge permitted signals into one student timeline.",
      scope:
        "CROSS_DEVICE_SYNC",
    },
    {
      field:
        "storeRawActivity",
      title:
        "Store raw activity",
      description:
        "Keep permitted event records for the configured retention period.",
      scope:
        "DIGITAL_ACTIVITY_MONITORING",
      sensitive:
        true,
    },
    {
      field:
        "storeFullUrls",
      title:
        "Store full URLs",
      description:
        "Keep complete permitted webpage URLs instead of domain-only evidence.",
      scope:
        "BROWSER_ACTIVITY",
      sensitive:
        true,
    },
    {
      field:
        "importPastHistory",
      title:
        "Import past history",
      description:
        "Permit a deliberate historical browser-data import.",
      scope:
        "BROWSER_HISTORY_IMPORT",
      sensitive:
        true,
    },
    {
      field:
        "allowBehaviorAnalysis",
      title:
        "Behavior AI",
      description:
        "Create explainable behavior signals from permitted evidence.",
      scope:
        "BEHAVIOR_ANALYSIS",
    },
    {
      field:
        "allowAiContext",
      title:
        "AI Mentor context",
      description:
        "Allow structured summaries to inform AIMERS AI Mentor.",
      scope:
        "AI_CONTEXT_SHARING",
    },
    {
      field:
        "allowNotifications",
      title:
        "Intelligence notifications",
      description:
        "Allow reminders and intervention delivery.",
      scope:
        "NOTIFICATIONS",
    },
    {
      field:
        "allowFocusControls",
      title:
        "Focus-control proposals",
      description:
        "Allow supported controls only after explicit confirmation.",
      scope:
        "FOCUS_CONTROLS",
      sensitive:
        true,
    },
    {
      field:
        "localProcessingPreferred",
      title:
        "Prefer local processing",
      description:
        "Prefer compatible analysis on the registered device when available.",
    },
  ];

const DISABLE_PATCH:
  Partial<
    Record<
      ConsentScope,
      UpdatePrivacyInput
    >
  > = {
    DIGITAL_ACTIVITY_MONITORING: {
      monitoringEnabled:
        false,
      backgroundMonitoring:
        false,
      storeRawActivity:
        false,
    },

    BROWSER_ACTIVITY: {
      storeFullUrls:
        false,
    },

    BROWSER_HISTORY_IMPORT: {
      importPastHistory:
        false,
    },

    CROSS_DEVICE_SYNC: {
      crossDeviceSync:
        false,
    },

    BEHAVIOR_ANALYSIS: {
      allowBehaviorAnalysis:
        false,
    },

    AI_CONTEXT_SHARING: {
      allowAiContext:
        false,
    },

    NOTIFICATIONS: {
      allowNotifications:
        false,
    },

    FOCUS_CONTROLS: {
      allowFocusControls:
        false,
    },
  };

const CONNECTOR_SCOPE:
  Record<
    DataConnectorType,
    ConsentScope
  > = {
    AIMERS_WEB:
      "DIGITAL_ACTIVITY_MONITORING",

    AIMERS_LECTURE_PLAYER:
      "LECTURE_PROGRESS",

    BROWSER_EXTENSION:
      "BROWSER_ACTIVITY",

    ANDROID_USAGE_ACCESS:
      "APP_USAGE",

    APPLE_DEVICE_ACTIVITY:
      "APP_USAGE",

    DESKTOP_AGENT:
      "APP_USAGE",

    YOUTUBE:
      "LECTURE_PROGRESS",

    LEARNING_PLATFORM:
      "LECTURE_PROGRESS",

    MANUAL_IMPORT:
      "BROWSER_HISTORY_IMPORT",
  };

const DEVICE_PLATFORMS:
  DevicePlatform[] = [
    "WEB",
    "CHROME_EXTENSION",
    "EDGE_EXTENSION",
    "ANDROID",
    "IOS",
    "IPADOS",
    "MACOS",
    "WINDOWS",
    "LINUX",
    "OTHER",
  ];

const CONNECTOR_TYPES:
  DataConnectorType[] = [
    "AIMERS_WEB",
    "AIMERS_LECTURE_PLAYER",
    "BROWSER_EXTENSION",
    "ANDROID_USAGE_ACCESS",
    "APPLE_DEVICE_ACTIVITY",
    "DESKTOP_AGENT",
    "YOUTUBE",
    "LEARNING_PLATFORM",
    "MANUAL_IMPORT",
  ];

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

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not yet";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
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
  ).format(date);
}

function browserDeviceId(): string {
  const key =
    "aimers-browser-device-id";

  try {
    const existing =
      window.localStorage
        .getItem(key);

    if (existing) {
      return existing;
    }

    const created =
      `web-${crypto.randomUUID()}`;

    window.localStorage
      .setItem(
        key,
        created,
      );

    return created;
  } catch {
    return `web-${crypto.randomUUID()}`;
  }
}

function activeGrant(
  workspace:
    SettingsWorkspace,
  scope:
    ConsentScope,
) {
  const now =
    Date.now();

  return workspace
    .consent
    .grants
    .find(
      (grant) =>
        grant.scope ===
          scope &&
        grant.status ===
          "ACTIVE" &&
        !grant.revokedAt &&
        (
          !grant.expiresAt ||
          new Date(
            grant.expiresAt,
          ).getTime() >
            now
        ),
    );
}

function SetupMetric({
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
    <article className="settings-metric">
      <span>{icon}</span>

      <div>
        <small>{metricLabel}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function Toggle({
  checked,
  disabled,
  label: toggleLabel,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange(): void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={toggleLabel}
      className={
        checked
          ? "settings-toggle active"
          : "settings-toggle"
      }
      disabled={disabled}
      role="switch"
      type="button"
      onClick={onChange}
    >
      <span />
    </button>
  );
}

export function SettingsPage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] = useState<SettingsWorkspace | null>(
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
    busyKey,
    setBusyKey,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    rawRetentionDays,
    setRawRetentionDays,
  ] = useState(30);

  const [
    summaryRetentionDays,
    setSummaryRetentionDays,
  ] = useState(365);

  const [
    deviceName,
    setDeviceName,
  ] = useState(
    "This browser",
  );

  const [
    devicePlatform,
    setDevicePlatform,
  ] = useState<DevicePlatform>(
    "WEB",
  );

  const [
    connectorType,
    setConnectorType,
  ] = useState<DataConnectorType>(
    "AIMERS_WEB",
  );

  const [
    connectorName,
    setConnectorName,
  ] = useState(
    "AIMERS Web",
  );

  const [
    connectorAccount,
    setConnectorAccount,
  ] = useState("");

  const [
    connectorDeviceId,
    setConnectorDeviceId,
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
          const next =
            await getSettingsWorkspace(
              apiFetch,
            );

          setWorkspace(next);

          window.dispatchEvent(
            new CustomEvent(
              "aimers:intelligence-settings-updated",
            ),
          );

          setRawRetentionDays(
            next
              .privacy
              .rawRetentionDays,
          );

          setSummaryRetentionDays(
            next
              .privacy
              .summaryRetentionDays,
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load Settings.",
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

  const activeScopes =
    useMemo(
      () => {
        const scopes =
          new Set<ConsentScope>();

        if (!workspace) {
          return scopes;
        }

        for (
          const permission
          of PERMISSIONS
        ) {
          if (
            activeGrant(
              workspace,
              permission.scope,
            )
          ) {
            scopes.add(
              permission.scope,
            );
          }
        }

        return scopes;
      },
      [workspace],
    );

  const run =
    async (
      key: string,
      action:
        () => Promise<void>,
    ) => {
      setBusyKey(key);
      setError("");
      setNotice("");

      try {
        await action();
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "The requested settings change failed.",
        );
      } finally {
        setBusyKey("");
      }
    };

  const handleGrant =
    (
      permission:
        PermissionDefinition,
    ) => {
      const confirmed =
        window.confirm(
          `${permission.title}\n\n${permission.description}\n\n${permission.detail}\n\nGrant this permission?`,
        );

      if (!confirmed) {
        return;
      }

      void run(
        `grant-${permission.scope}`,
        async () => {
          await grantConsent(
            apiFetch,
            permission.scope,
          );

          setNotice(
            `${permission.title} permission granted.`,
          );

          await load(true);
        },
      );
    };

  const handleRevoke =
    (
      permission:
        PermissionDefinition,
    ) => {
      const confirmed =
        window.confirm(
          `Revoke ${permission.title}?\n\nDependent features will be disabled. Existing retained records are not automatically deleted by this action.`,
        );

      if (!confirmed) {
        return;
      }

      void run(
        `revoke-${permission.scope}`,
        async () => {
          const patch =
            DISABLE_PATCH[
              permission.scope
            ];

          if (patch) {
            await updatePrivacyPreferences(
              apiFetch,
              patch,
            );
          }

          await revokeConsent(
            apiFetch,
            permission.scope,
          );

          setNotice(
            `${permission.title} permission revoked.`,
          );

          await load(true);
        },
      );
    };

  const handlePreference =
    (
      preference:
        PreferenceDefinition,
    ) => {
      if (!workspace) {
        return;
      }

      const current =
        Boolean(
          workspace
            .privacy[
              preference.field
            ],
        );

      const next =
        !current;

      if (
        next &&
        preference.scope &&
        !activeScopes.has(
          preference.scope,
        )
      ) {
        setError(
          `Grant ${label(preference.scope)} permission before enabling ${preference.title}.`,
        );

        return;
      }

      if (
        next &&
        preference.sensitive &&
        !window.confirm(
          `${preference.title}\n\n${preference.description}\n\nEnable this privacy preference?`,
        )
      ) {
        return;
      }

      void run(
        `preference-${String(
          preference.field,
        )}`,
        async () => {
          await updatePrivacyPreferences(
            apiFetch,
            {
              [preference.field]:
                next,
            },
          );

          setNotice(
            `${preference.title} ${next ? "enabled" : "disabled"}.`,
          );

          await load(true);
        },
      );
    };

  const handleMonitoringState =
    () => {
      if (!workspace) {
        return;
      }

      if (
        !workspace
          .privacy
          .monitoringEnabled
      ) {
        const preference =
          PREFERENCES[0];

        if (preference) {
          handlePreference(
            preference,
          );
        }

        return;
      }

      const pause =
        !Boolean(
          workspace
            .privacy
            .pausedAt,
        );

      void run(
        "monitoring-state",
        async () => {
          await updateMonitoringState(
            apiFetch,
            pause,
          );

          setNotice(
            pause
              ? "Monitoring paused. Permissions and privacy choices were preserved."
              : "Monitoring resumed with your saved privacy choices.",
          );

          await load(true);
        },
      );
    };

  const saveRetention =
    () => {
      void run(
        "retention",
        async () => {
          await updatePrivacyPreferences(
            apiFetch,
            {
              rawRetentionDays,
              summaryRetentionDays,
            },
          );

          setNotice(
            "Retention preferences saved.",
          );

          await load(true);
        },
      );
    };

  const submitDevice =
    (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        !activeScopes.has(
          "DIGITAL_ACTIVITY_MONITORING",
        )
      ) {
        setError(
          "Grant Digital Activity Monitoring permission before registering a device.",
        );

        return;
      }

      void run(
        "register-device",
        async () => {
          await registerDevice(
            apiFetch,
            {
              externalDeviceId:
                browserDeviceId(),

              name:
                deviceName.trim(),

              platform:
                devicePlatform,

              appVersion:
                "AIMERS Web 2.0",

              osVersion:
                navigator.userAgent
                  .slice(
                    0,
                    120,
                  ),
            },
          );

          setNotice(
            "Device identity registered. A compatible collector is still required to send activity events.",
          );

          await load(true);
        },
      );
    };

  const changeDeviceStatus =
    (
      deviceId: string,
      status:
        DeviceStatus,
    ) => {
      if (
        status ===
          "REVOKED" &&
        !window.confirm(
          "Revoke this device permanently?\n\nIts attached connectors will also be revoked. It must be registered again before it can become active.",
        )
      ) {
        return;
      }

      void run(
        `device-${deviceId}`,
        async () => {
          await updateDeviceStatus(
            apiFetch,
            deviceId,
            status,
          );

          setNotice(
            `Device ${status.toLowerCase()}.`,
          );

          await load(true);
        },
      );
    };

  const submitConnector =
    (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      const requiredScope =
        CONNECTOR_SCOPE[
          connectorType
        ];

      if (
        !activeScopes.has(
          requiredScope,
        )
      ) {
        setError(
          `Grant ${label(requiredScope)} permission before registering this connector.`,
        );

        return;
      }

      void run(
        "register-connector",
        async () => {
          await registerConnector(
            apiFetch,
            {
              type:
                connectorType,

              displayName:
                connectorName.trim(),

              ...(connectorAccount.trim()
                ? {
                    externalAccountId:
                      connectorAccount.trim(),
                  }
                : {}),

              ...(connectorDeviceId
                ? {
                    connectedDeviceId:
                      connectorDeviceId,
                  }
                : {}),
            },
          );

          setNotice(
            "Connector record registered. External authorization, extension installation, agent installation, or platform integration may still be required.",
          );

          await load(true);
        },
      );
    };

  const changeConnectorStatus =
    (
      connectorId: string,
      status:
        DataConnectorStatus,
    ) => {
      if (
        status ===
          "REVOKED" &&
        !window.confirm(
          "Revoke this connector permanently?\n\nIt must be registered again before it can become active.",
        )
      ) {
        return;
      }

      void run(
        `connector-${connectorId}`,
        async () => {
          await updateConnectorStatus(
            apiFetch,
            connectorId,
            status,
          );

          setNotice(
            `Connector ${status.toLowerCase()}.`,
          );

          await load(true);
        },
      );
    };

  if (loading) {
    return (
      <div className="settings-page settings-state-page">
        <section className="settings-state">
          <LoaderCircle
            className="settings-spin"
            size={32}
          />

          <h1>
            Loading privacy controls
          </h1>

          <p>
            Reading consent grants, preferences,
            devices and data connectors…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="settings-page settings-state-page">
        <section className="settings-state error">
          <AlertTriangle size={32} />

          <h1>
            Settings unavailable
          </h1>

          <p>
            {error ||
              "No settings workspace was returned."}
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

  const activeDeviceCount =
    workspace
      .devices
      .devices
      .filter(
        (device) =>
          device.status ===
          "ACTIVE",
      )
      .length;

  const activeConnectorCount =
    workspace
      .connectors
      .connectors
      .filter(
        (connector) =>
          connector.status ===
          "ACTIVE",
      )
      .length;

  const monitoringPaused =
    Boolean(
      workspace
        .privacy
        .pausedAt,
    );

  const monitoringActive =
    workspace
      .privacy
      .monitoringEnabled &&
    activeScopes.has(
      "DIGITAL_ACTIVITY_MONITORING",
    ) &&
    !monitoringPaused;

  const selectedConnectorScope =
    CONNECTOR_SCOPE[
      connectorType
    ];

  return (
    <div className="settings-page">
      <header className="settings-hero">
        <div>
          <span className="settings-eyebrow">
            <ShieldCheck size={14} />
            DIGITAL INTELLIGENCE CONTROL CENTER
          </span>

          <h1>
            Your data.
            <strong>
              {" "}Your permission.
            </strong>
          </h1>

          <p>
            Configure what AIMERS may collect,
            analyse, retain and share across its own
            features. Subscription access never
            replaces consent.
          </p>

          <div className="settings-hero-actions">
            <button
              className="settings-primary-button"
              disabled={
                busyKey ===
                  "monitoring-state" ||
                busyKey ===
                  "preference-monitoringEnabled" ||
                refreshing
              }
              type="button"
              onClick={
                handleMonitoringState
              }
            >
              {monitoringActive
                ? <Pause size={16} />
                : <Play size={16} />}

              {monitoringActive
                ? "Pause monitoring"
                : monitoringPaused
                  ? "Resume monitoring"
                  : "Enable monitoring"}
            </button>

            <button
              className="settings-secondary-button"
              disabled={refreshing}
              type="button"
              onClick={() => {
                void load(true);
              }}
            >
              <RefreshCw
                className={
                  refreshing
                    ? "settings-spin"
                    : ""
                }
                size={16}
              />
              Refresh
            </button>
          </div>
        </div>

        <section
          className={`settings-status-card ${
            monitoringActive
              ? "active"
              : monitoringPaused
                ? "paused"
                : "disabled"
          }`}
        >
          <span>
            {monitoringActive
              ? <ShieldCheck size={25} />
              : <ShieldOff size={25} />}
          </span>

          <small>
            MONITORING STATUS
          </small>

          <strong>
            {monitoringActive
              ? "Active"
              : monitoringPaused
                ? "Paused"
                : "Disabled"}
          </strong>

          <p>
            {activeScopes.size}
            {" permissions · "}
            {activeDeviceCount}
            {activeDeviceCount === 1
              ? " device · "
              : " devices · "}
            {activeConnectorCount}
            {" active "}
            {activeConnectorCount === 1
              ? "connector"
              : "connectors"}
          </p>

          <i>
            Local processing{" "}
            {workspace
              .privacy
              .localProcessingPreferred
              ? "preferred"
              : "not preferred"}
          </i>
        </section>
      </header>

      {error && (
        <div className="settings-inline-message error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="settings-inline-message success">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {monitoringPaused && (
        <div className="settings-inline-message">
          <Pause size={16} />
          <span>
            Monitoring is temporarily paused. Your
            permissions and privacy choices remain saved.
            Resume monitoring to restart collectors.
          </span>
        </div>
      )}

      <section className="settings-metrics">
        <SetupMetric
          icon={<UserCheck size={19} />}
          label="ACTIVE PERMISSIONS"
          value={`${activeScopes.size}/10`}
          detail="Individually revocable"
        />

        <SetupMetric
          icon={<Laptop size={19} />}
          label="REGISTERED DEVICES"
          value={`${workspace.devices.devices.length}`}
          detail={`${activeDeviceCount} currently active`}
        />

        <SetupMetric
          icon={<Link2 size={19} />}
          label="DATA CONNECTORS"
          value={`${workspace.connectors.connectors.length}`}
          detail={`${activeConnectorCount} currently active`}
        />

        <SetupMetric
          icon={<Clock3 size={19} />}
          label="RAW RETENTION"
          value={`${workspace.privacy.rawRetentionDays}d`}
          detail={`${workspace.privacy.summaryRetentionDays}d summaries`}
        />
      </section>

      <section className="settings-panel">
        <header className="settings-panel-header">
          <div>
            <small>
              CONSENT LEDGER
            </small>

            <h2>
              Permission scopes
            </h2>

            <p>
              Each capability is granted and revoked
              independently.
            </p>
          </div>

          <ShieldCheck size={22} />
        </header>

        <div className="settings-permission-grid">
          {PERMISSIONS.map(
            (permission) => {
              const grant =
                activeGrant(
                  workspace,
                  permission.scope,
                );

              const busy =
                busyKey ===
                  `grant-${permission.scope}` ||
                busyKey ===
                  `revoke-${permission.scope}`;

              return (
                <article
                  className={`settings-permission ${permission.sensitivity.toLowerCase()}`}
                  key={
                    permission.scope
                  }
                >
                  <header>
                    <span>
                      {permission.icon}
                    </span>

                    <div>
                      <small>
                        {permission.sensitivity}
                      </small>

                      <h3>
                        {permission.title}
                      </h3>
                    </div>

                    <strong
                      className={
                        grant
                          ? "active"
                          : "inactive"
                      }
                    >
                      {grant
                        ? "Granted"
                        : "Not granted"}
                    </strong>
                  </header>

                  <p>
                    {permission.description}
                  </p>

                  <div className="settings-permission-detail">
                    <Eye size={14} />
                    <span>
                      {permission.detail}
                    </span>
                  </div>

                  <footer>
                    <span>
                      {grant
                        ? `Granted ${formatDate(grant.grantedAt)}`
                        : "No active grant"}
                    </span>

                    <button
                      className={
                        grant
                          ? "danger"
                          : ""
                      }
                      disabled={busy}
                      type="button"
                      onClick={() => {
                        if (grant) {
                          handleRevoke(
                            permission,
                          );
                        } else {
                          handleGrant(
                            permission,
                          );
                        }
                      }}
                    >
                      {grant
                        ? <Trash2 size={14} />
                        : <Plus size={14} />}

                      {busy
                        ? "Saving…"
                        : grant
                          ? "Revoke"
                          : "Grant"}
                    </button>
                  </footer>
                </article>
              );
            },
          )}
        </div>
      </section>

      <section className="settings-layout">
        <article className="settings-panel">
          <header className="settings-panel-header">
            <div>
              <small>
                PRIVACY PREFERENCES
              </small>

              <h2>
                Collection and analysis
              </h2>

              <p>
                A preference can only be enabled when
                its required consent is active.
              </p>
            </div>

            <LockKeyhole size={22} />
          </header>

          <div className="settings-preference-list">
            {PREFERENCES.map(
              (preference) => {
                const checked =
                  Boolean(
                    workspace
                      .privacy[
                        preference.field
                      ],
                  ) &&
                  (
                    !preference.scope ||
                    activeScopes.has(
                      preference.scope,
                    )
                  );

                const scopeReady =
                  !preference.scope ||
                  activeScopes.has(
                    preference.scope,
                  );

                const busy =
                  busyKey ===
                  `preference-${String(
                    preference.field,
                  )}`;

                return (
                  <div
                    className="settings-preference"
                    key={
                      String(
                        preference.field,
                      )
                    }
                  >
                    <div>
                      <strong>
                        {preference.title}
                      </strong>

                      <p>
                        {preference.description}
                      </p>

                      {preference.scope && (
                        <small>
                          Requires{" "}
                          {label(
                            preference.scope,
                          )}
                        </small>
                      )}
                    </div>

                    <Toggle
                      checked={checked}
                      disabled={
                        busy ||
                        (
                          !checked &&
                          !scopeReady
                        )
                      }
                      label={
                        preference.title
                      }
                      onChange={() => {
                        handlePreference(
                          preference,
                        );
                      }}
                    />
                  </div>
                );
              },
            )}
          </div>
        </article>

        <article className="settings-panel">
          <header className="settings-panel-header">
            <div>
              <small>
                DATA RETENTION
              </small>

              <h2>
                Storage duration
              </h2>

              <p>
                These preferences do not delete
                records immediately.
              </p>
            </div>

            <Database size={22} />
          </header>

          <div className="settings-retention-form">
            <label>
              <span>
                Raw activity retention
              </span>

              <small>
                1–90 days
              </small>

              <input
                max={90}
                min={1}
                type="number"
                value={
                  rawRetentionDays
                }
                onChange={(event) => {
                  setRawRetentionDays(
                    Number.parseInt(
                      event
                        .target
                        .value,
                      10,
                    ) || 1,
                  );
                }}
              />
            </label>

            <label>
              <span>
                Summary retention
              </span>

              <small>
                30–3650 days
              </small>

              <input
                max={3650}
                min={30}
                type="number"
                value={
                  summaryRetentionDays
                }
                onChange={(event) => {
                  setSummaryRetentionDays(
                    Number.parseInt(
                      event
                        .target
                        .value,
                      10,
                    ) || 30,
                  );
                }}
              />
            </label>

            <button
              className="settings-primary-button"
              disabled={
                busyKey ===
                "retention"
              }
              type="button"
              onClick={saveRetention}
            >
              <Save size={15} />
              Save retention
            </button>
          </div>

          <div className="settings-retention-note">
            <HardDrive size={17} />

            <p>
              Revoking a permission stops future
              permitted processing. A separate data
              deletion workflow will be required for
              permanent erasure requests.
            </p>
          </div>
        </article>
      </section>

      <section className="settings-layout">
        <article className="settings-panel">
          <header className="settings-panel-header">
            <div>
              <small>
                DEVICE REGISTRATION
              </small>

              <h2>
                Connect a device identity
              </h2>

              <p>
                Registration does not install a
                collector or grant operating-system
                access.
              </p>
            </div>

            <Laptop size={22} />
          </header>

          <form
            className="settings-form"
            onSubmit={submitDevice}
          >
            <label>
              <span>Device name</span>

              <input
                maxLength={160}
                required
                value={deviceName}
                onChange={(event) => {
                  setDeviceName(
                    event
                      .target
                      .value,
                  );
                }}
              />
            </label>

            <label>
              <span>Platform</span>

              <select
                value={devicePlatform}
                onChange={(event) => {
                  setDevicePlatform(
                    event
                      .target
                      .value as
                      DevicePlatform,
                  );
                }}
              >
                {DEVICE_PLATFORMS.map(
                  (platform) => (
                    <option
                      key={platform}
                      value={platform}
                    >
                      {label(
                        platform,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <button
              className="settings-primary-button"
              disabled={
                busyKey ===
                  "register-device" ||
                !activeScopes.has(
                  "DIGITAL_ACTIVITY_MONITORING",
                )
              }
              type="submit"
            >
              <Plus size={15} />
              Register device
            </button>
          </form>

          <div className="settings-entity-list">
            {workspace
              .devices
              .devices
              .length === 0
              ? (
                <div className="settings-empty">
                  <Laptop size={22} />
                  <strong>
                    No devices registered
                  </strong>
                  <p>
                    Grant monitoring permission before
                    registering a device.
                  </p>
                </div>
              )
              : workspace
                  .devices
                  .devices
                  .map(
                    (device) => (
                      <article
                        className="settings-entity"
                        key={device.id}
                      >
                        <span>
                          {device.platform ===
                            "ANDROID" ||
                          device.platform ===
                            "IOS" ||
                          device.platform ===
                            "IPADOS"
                            ? <Smartphone size={17} />
                            : <Laptop size={17} />}
                        </span>

                        <div>
                          <strong>
                            {device.name}
                          </strong>

                          <small>
                            {label(
                              device.platform,
                            )}
                            {" · Last sync "}
                            {formatDate(
                              device.lastSyncAt ??
                              device.lastSeenAt,
                            )}
                          </small>
                        </div>

                        <i
                          className={
                            device
                              .status
                              .toLowerCase()
                          }
                        >
                          {label(
                            device.status,
                          )}
                        </i>

                        <div className="settings-entity-actions">
                          {device.status ===
                            "ACTIVE" && (
                            <button
                              disabled={
                                busyKey ===
                                `device-${device.id}`
                              }
                              type="button"
                              onClick={() => {
                                changeDeviceStatus(
                                  device.id,
                                  "PAUSED",
                                );
                              }}
                            >
                              <Pause size={13} />
                              Pause
                            </button>
                          )}

                          {device.status ===
                            "PAUSED" && (
                            <button
                              disabled={
                                busyKey ===
                                `device-${device.id}`
                              }
                              type="button"
                              onClick={() => {
                                changeDeviceStatus(
                                  device.id,
                                  "ACTIVE",
                                );
                              }}
                            >
                              <Play size={13} />
                              Resume
                            </button>
                          )}

                          {device.status !==
                            "REVOKED" && (
                            <button
                              className="danger"
                              disabled={
                                busyKey ===
                                `device-${device.id}`
                              }
                              type="button"
                              onClick={() => {
                                changeDeviceStatus(
                                  device.id,
                                  "REVOKED",
                                );
                              }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </article>
                    ),
                  )}
          </div>
        </article>

        <article className="settings-panel">
          <header className="settings-panel-header">
            <div>
              <small>
                DATA CONNECTORS
              </small>

              <h2>
                Register a source
              </h2>

              <p>
                Registration does not complete OAuth,
                extension installation or native-agent
                setup.
              </p>
            </div>

            <Link2 size={22} />
          </header>

          <form
            className="settings-form"
            onSubmit={submitConnector}
          >
            <label>
              <span>Connector type</span>

              <select
                value={connectorType}
                onChange={(event) => {
                  const next =
                    event
                      .target
                      .value as
                      DataConnectorType;

                  setConnectorType(
                    next,
                  );

                  setConnectorName(
                    label(next),
                  );
                }}
              >
                {CONNECTOR_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {label(type)}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>Display name</span>

              <input
                maxLength={160}
                required
                value={connectorName}
                onChange={(event) => {
                  setConnectorName(
                    event
                      .target
                      .value,
                  );
                }}
              />
            </label>

            <label>
              <span>
                External account ID
              </span>

              <input
                maxLength={240}
                placeholder="Optional"
                value={connectorAccount}
                onChange={(event) => {
                  setConnectorAccount(
                    event
                      .target
                      .value,
                  );
                }}
              />
            </label>

            <label>
              <span>
                Attach to device
              </span>

              <select
                value={connectorDeviceId}
                onChange={(event) => {
                  setConnectorDeviceId(
                    event
                      .target
                      .value,
                  );
                }}
              >
                <option value="">
                  No device
                </option>

                {workspace
                  .devices
                  .devices
                  .filter(
                    (device) =>
                      device.status !==
                      "REVOKED",
                  )
                  .map(
                    (device) => (
                      <option
                        key={device.id}
                        value={device.id}
                      >
                        {device.name}
                      </option>
                    ),
                  )}
              </select>
            </label>

            <div className="settings-required-scope">
              <ShieldCheck size={14} />

              <span>
                Requires{" "}
                <strong>
                  {label(
                    selectedConnectorScope,
                  )}
                </strong>
              </span>
            </div>

            <button
              className="settings-primary-button"
              disabled={
                busyKey ===
                  "register-connector" ||
                !activeScopes.has(
                  selectedConnectorScope,
                )
              }
              type="submit"
            >
              <Plus size={15} />
              Register connector
            </button>
          </form>

          <div className="settings-entity-list">
            {workspace
              .connectors
              .connectors
              .length === 0
              ? (
                <div className="settings-empty">
                  <Link2 size={22} />
                  <strong>
                    No connectors registered
                  </strong>
                  <p>
                    Choose a supported source after
                    granting its required permission.
                  </p>
                </div>
              )
              : workspace
                  .connectors
                  .connectors
                  .map(
                    (connector) => (
                      <article
                        className="settings-entity"
                        key={connector.id}
                      >
                        <span>
                          <Link2 size={17} />
                        </span>

                        <div>
                          <strong>
                            {connector.displayName}
                          </strong>

                          <small>
                            {label(
                              connector.type,
                            )}
                            {" · Last sync "}
                            {formatDate(
                              connector.lastSuccessfulSyncAt ??
                              connector.lastSyncAt,
                            )}
                          </small>
                        </div>

                        <i
                          className={
                            connector
                              .status
                              .toLowerCase()
                          }
                        >
                          {label(
                            connector.status,
                          )}
                        </i>

                        <div className="settings-entity-actions">
                          {connector.status ===
                            "ACTIVE" && (
                            <button
                              disabled={
                                busyKey ===
                                `connector-${connector.id}`
                              }
                              type="button"
                              onClick={() => {
                                changeConnectorStatus(
                                  connector.id,
                                  "PAUSED",
                                );
                              }}
                            >
                              <Pause size={13} />
                              Pause
                            </button>
                          )}

                          {connector.status ===
                            "PAUSED" && (
                            <button
                              disabled={
                                busyKey ===
                                `connector-${connector.id}`
                              }
                              type="button"
                              onClick={() => {
                                changeConnectorStatus(
                                  connector.id,
                                  "ACTIVE",
                                );
                              }}
                            >
                              <Play size={13} />
                              Resume
                            </button>
                          )}

                          {connector.status !==
                            "REVOKED" && (
                            <button
                              className="danger"
                              disabled={
                                busyKey ===
                                `connector-${connector.id}`
                              }
                              type="button"
                              onClick={() => {
                                changeConnectorStatus(
                                  connector.id,
                                  "REVOKED",
                                );
                              }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </article>
                    ),
                  )}
          </div>
        </article>
      </section>

      <section className="settings-panel settings-integrity-panel">
        <header className="settings-panel-header">
          <div>
            <small>
              TRANSPARENCY RULES
            </small>

            <h2>
              What this setup does not claim
            </h2>
          </div>

          <ShieldCheck size={22} />
        </header>

        <div className="settings-integrity-grid">
          {[
            "Registering a device does not install monitoring software.",
            "Registering a connector does not authorize an external account by itself.",
            "App-open time is not presented as exact lecture completion.",
            "With Privacy Policy V3 accepted, AI Mentor can use permitted raw activity events and sanitized full URLs. Passwords, authentication tokens, payment details, typed form content, and private external chats remain excluded unless the student explicitly shares or imports them.",
            "Focus controls are never activated automatically.",
            "Revoking consent stops future permitted processing but is separate from permanent deletion.",
          ].map(
            (rule) => (
              <div key={rule}>
                <CheckCircle2 size={16} />
                <p>{rule}</p>
                <ChevronRight size={14} />
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
