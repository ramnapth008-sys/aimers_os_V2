import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  AppWindow,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  ExternalLink,
  FileClock,
  Globe2,
  Laptop,
  Link2,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getConnectorSetupWorkspace,
  retryConnectorSetup,
  startConnectorSetup,
} from "./integration-setup.service";

import type {
  ConnectorSetupItem,
  ConnectorSetupWorkspace,
} from "./integration-setup.types";

import "./integration-setup.css";

const STATE_LABELS:
  Record<
    ConnectorSetupItem["setupState"],
    string
  > = {
    CONNECTED:
      "Connected",
    PAUSED:
      "Paused",
    AUTHORIZATION_REQUIRED:
      "Ready to authorize",
    AWAITING_EXTERNAL_APPROVAL:
      "Awaiting external approval",
    AUTHORIZATION_FAILED:
      "Authorization failed",
    INTEGRATION_UNAVAILABLE:
      "Integration unavailable",
    REVOKED:
      "Revoked",
  };

function sourceIcon(
  item:
    ConnectorSetupItem,
): ReactNode {
  switch (item.type) {
    case "BROWSER_EXTENSION":
      return <Globe2 size={22} />;

    case "YOUTUBE":
      return <AppWindow size={22} />;

    case "LEARNING_PLATFORM":
      return <Globe2 size={22} />;

    case "MANUAL_IMPORT":
      return <FileClock size={22} />;

    case "ANDROID_USAGE_ACCESS":
    case "APPLE_DEVICE_ACTIVITY":
      return <Smartphone size={22} />;

    case "DESKTOP_AGENT":
      return <Laptop size={22} />;

    case "AIMERS_LECTURE_PLAYER":
      return <AppWindow size={22} />;

    default:
      return <Link2 size={22} />;
  }
}

function categoryLabel(
  category:
    ConnectorSetupItem["category"],
) {
  return category
    .replaceAll(
      "_",
      " ",
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

export function IntegrationSetupPage() {
  const {
    apiFetch,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    workspace,
    setWorkspace,
  ] = useState<
    ConnectorSetupWorkspace |
    null
  >(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(
    false,
  );

  const [
    busyId,
    setBusyId,
  ] = useState(
    "",
  );

  const [
    error,
    setError,
  ] = useState(
    "",
  );

  const [
    notice,
    setNotice,
  ] = useState(
    "",
  );

  const load =
    useCallback(
      async (
        refresh =
          false,
      ) => {
        if (refresh) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        setError("");

        try {
          const next =
            await getConnectorSetupWorkspace(
              apiFetch,
            );

          setWorkspace(
            next,
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load integration setup.",
          );
        } finally {
          setLoading(
            false,
          );
          setRefreshing(
            false,
          );
        }
      },
      [apiFetch],
    );

  useEffect(() => {
    void load();
  }, [load]);

  const groups =
    useMemo(
      () => {
        if (!workspace) {
          return [];
        }

        return [
          {
            title:
              "AIMERS native",
            description:
              "AIMERS-controlled sources that can operate immediately after consent.",
            items:
              workspace.items
                .filter(
                  (item) =>
                    item.category ===
                    "AIMERS_NATIVE",
                ),
          },
          {
            title:
              "External sources",
            description:
              "Sources that require a real extension, operating-system, OAuth, provider or import integration.",
            items:
              workspace.items
                .filter(
                  (item) =>
                    item.category !==
                    "AIMERS_NATIVE",
                ),
          },
        ].filter(
          (group) =>
            group.items
              .length >
            0,
        );
      },
      [workspace],
    );

  const handleAction =
    async (
      item:
        ConnectorSetupItem,
    ) => {
      if (
        item.action.to
      ) {
        navigate(
          item.action.to,
        );

        return;
      }

      if (
        !item.action
          .enabled
      ) {
        return;
      }

      setBusyId(
        item.connectorId,
      );
      setError("");
      setNotice("");

      try {
        const result =
          item.action
            .kind ===
            "RETRY"
            ? await retryConnectorSetup(
                apiFetch,
                item.connectorId,
              )
            : await startConnectorSetup(
                apiFetch,
                item.connectorId,
              );

        if (
          result
            .authorizationUrl
        ) {
          window.location.assign(
            result
              .authorizationUrl,
          );

          return;
        }

        setNotice(
          result.message ??
            "Connector setup status updated.",
        );

        await load(
          true,
        );

        window.dispatchEvent(
          new CustomEvent(
            "aimers:connector-setup-updated",
          ),
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to start connector setup.",
        );
      } finally {
        setBusyId("");
      }
    };

  if (loading) {
    return (
      <div className="integration-page integration-state-page">
        <section className="integration-state">
          <LoaderCircle
            className="integration-spin"
            size={34}
          />

          <h1>
            Reading connection setup
          </h1>

          <p>
            Checking consent, connectors and implementation availability…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="integration-page integration-state-page">
        <section className="integration-state error">
          <AlertTriangle size={34} />

          <h1>
            Integration setup unavailable
          </h1>

          <p>
            {error ||
              "No connector setup workspace was returned."}
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

  return (
    <div className="integration-page">
      <header className="integration-hero">
        <div>
          <span className="integration-eyebrow">
            <ShieldCheck size={15} />
            EXTERNAL AUTHORIZATION CENTER
          </span>

          <h1>
            Connect every permitted
            <strong>
              {" "}learning signal.
            </strong>
          </h1>

          <p>
            Consent has already created the setup queue.
            This page shows what is truly connected,
            what still needs mandatory platform approval,
            and what has not been implemented yet.
          </p>

          <div className="integration-hero-actions">
            <button
              className="integration-primary-button"
              disabled={refreshing}
              type="button"
              onClick={() => {
                void load(
                  true,
                );
              }}
            >
              <RefreshCw
                className={
                  refreshing
                    ? "integration-spin"
                    : ""
                }
                size={16}
              />
              Refresh status
            </button>

            <button
              className="integration-secondary-button"
              type="button"
              onClick={() =>
                navigate(
                  "/settings",
                )
              }
            >
              <Settings size={16} />
              Permission settings
            </button>
          </div>
        </div>

        <section className="integration-progress-card">
          <span>
            <Database size={25} />
          </span>

          <small>
            CONNECTION PROGRESS
          </small>

          <strong>
            {workspace
              .summary
              .connected}
            <i>
              /{workspace
                .summary
                .total}
            </i>
          </strong>

          <p>
            verified active sources
          </p>

          <div>
            <b
              style={{
                width:
                  `${workspace.summary.completionPercentage}%`,
              }}
            />
          </div>

          <em>
            {workspace
              .summary
              .completionPercentage}
            % connected
          </em>
        </section>
      </header>

      {error && (
        <div className="integration-message error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="integration-message success">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      <section className="integration-metrics">
        <article>
          <CheckCircle2 size={19} />
          <div>
            <small>CONNECTED</small>
            <strong>
              {workspace
                .summary
                .connected}
            </strong>
            <p>
              verified and active
            </p>
          </div>
        </article>

        <article>
          <Clock3 size={19} />
          <div>
            <small>AWAITING APPROVAL</small>
            <strong>
              {workspace
                .summary
                .awaitingApproval}
            </strong>
            <p>
              external action required
            </p>
          </div>
        </article>

        <article>
          <AlertTriangle size={19} />
          <div>
            <small>NOT AVAILABLE YET</small>
            <strong>
              {workspace
                .summary
                .unavailable}
            </strong>
            <p>
              integration not implemented
            </p>
          </div>
        </article>

        <article>
          <RotateCcw size={19} />
          <div>
            <small>FAILED</small>
            <strong>
              {workspace
                .summary
                .failed}
            </strong>
            <p>
              retry when supported
            </p>
          </div>
        </article>
      </section>

      {groups.map(
        (group) => (
          <section
            className="integration-group"
            key={group.title}
          >
            <header>
              <div>
                <small>
                  {group.title}
                </small>

                <h2>
                  {group.title ===
                  "AIMERS native"
                    ? "Active AIMERS sources"
                    : "Queued external connections"}
                </h2>

                <p>
                  {group.description}
                </p>
              </div>

              <Link2 size={22} />
            </header>

            <div className="integration-grid">
              {group.items.map(
                (item) => (
                  <article
                    className={`integration-card ${item.setupState.toLowerCase().replaceAll("_", "-")}`}
                    key={item.connectorId}
                  >
                    <header>
                      <span>
                        {sourceIcon(
                          item,
                        )}
                      </span>

                      <div>
                        <small>
                          {categoryLabel(
                            item.category,
                          )}
                        </small>

                        <h3>
                          {item.title}
                        </h3>
                      </div>

                      <strong>
                        {STATE_LABELS[
                          item
                            .setupState
                        ]}
                      </strong>
                    </header>

                    <p>
                      {item.description}
                    </p>

                    <dl>
                      <div>
                        <dt>
                          Required permission
                        </dt>
                        <dd>
                          {item.requiredScope
                            .replaceAll(
                              "_",
                              " ",
                            )
                            .toLowerCase()}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Authorization
                        </dt>
                        <dd>
                          {item.authorizationMode
                            .replaceAll(
                              "_",
                              " ",
                            )
                            .toLowerCase()}
                        </dd>
                      </div>

                      {item.connectedDevice && (
                        <div>
                          <dt>
                            Device
                          </dt>
                          <dd>
                            {item
                              .connectedDevice
                              .name}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {(item.action.reason ||
                      item.errorMessage) && (
                      <div className="integration-reason">
                        <AlertTriangle size={14} />
                        <span>
                          {item.errorMessage ??
                            item.action.reason}
                        </span>
                      </div>
                    )}

                    <footer>
                      <span>
                        {item.consentGranted
                          ? "Consent granted"
                          : "Permission required"}
                      </span>

                      <button
                        disabled={
                          busyId ===
                            item.connectorId ||
                          !item.action
                            .enabled
                        }
                        type="button"
                        onClick={() => {
                          void handleAction(
                            item,
                          );
                        }}
                      >
                        {busyId ===
                        item.connectorId
                          ? (
                            <LoaderCircle
                              className="integration-spin"
                              size={15}
                            />
                          )
                          : item.action.kind ===
                              "MANAGE"
                            ? <Settings size={15} />
                            : item.action.kind ===
                                "AUTHORIZE"
                              ? <ExternalLink size={15} />
                              : item.action.kind ===
                                  "RETRY"
                                ? <RotateCcw size={15} />
                                : <ChevronRight size={15} />}

                        {item.action.label}
                      </button>
                    </footer>
                  </article>
                ),
              )}
            </div>
          </section>
        ),
      )}

      <section className="integration-boundary">
        <ShieldCheck size={23} />

        <div>
          <small>
            TRUST BOUNDARY
          </small>

          <h2>
            Queued does not mean connected.
          </h2>

          <p>
            AIMERS consent grants permission to request and
            process the disclosed data. A connector becomes
            active only after its real implementation exists
            and its mandatory browser, operating-system,
            extension, OAuth, provider or import approval
            succeeds.
          </p>
        </div>
      </section>
    </div>
  );
}
