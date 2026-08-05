import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  ExternalLink,
  FileText,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import {
  acceptPrivacyAgreement,
  getPrivacyAgreement,
} from "./privacy-agreement.service";

import type {
  PrivacyAgreementWorkspace,
} from "./privacy-agreement.types";

import "./privacy-agreement.css";

function browserDeviceId():
  string {
  const key =
    "aimers-browser-device-id";

  try {
    const existing =
      window
        .localStorage
        .getItem(
          key,
        );

    if (existing) {
      return existing;
    }

    const created =
      `web-${crypto.randomUUID()}`;

    window
      .localStorage
      .setItem(
        key,
        created,
      );

    return created;
  } catch {
    return `web-${crypto.randomUUID()}`;
  }
}

export function PrivacyAgreementGate() {
  const {
    apiFetch,
    logout,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] =
    useState<
      PrivacyAgreementWorkspace |
      null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    accepting,
    setAccepting,
  ] =
    useState(
      false,
    );

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(
      false,
    );

  const [
    policyOpen,
    setPolicyOpen,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  const load =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        setError("");

        try {
          setWorkspace(
            await getPrivacyAgreement(
              apiFetch,
            ),
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load the privacy agreement.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [apiFetch],
    );

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAccept() {
    if (!workspace) {
      return;
    }

    setAccepting(
      true,
    );

    setError("");

    try {
      const result =
        await acceptPrivacyAgreement(
          apiFetch,
          {
            policyVersion:
              workspace
                .policy
                .version,

            externalDeviceId:
              browserDeviceId(),

            deviceName:
              "This browser",

            platform:
              "WEB",

            appVersion:
              "AIMERS Web 2.0",

            osVersion:
              navigator
                .userAgent
                .slice(
                  0,
                  120,
                ),
          },
        );

      setWorkspace(
        result.workspace,
      );

      window.dispatchEvent(
        new CustomEvent(
          "aimers:intelligence-settings-updated",
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to activate AIMERS data features.",
      );
    } finally {
      setAccepting(
        false,
      );
    }
  }

  async function handleDecline() {
    setLoggingOut(
      true,
    );

    try {
      await logout();
    } finally {
      window.location
        .assign(
          "http://localhost:5174/login",
        );
    }
  }

  if (loading) {
    return (
      <div className="privacy-agreement-overlay">
        <section className="privacy-agreement-card state">
          <LoaderCircle
            className="privacy-agreement-spin"
            size={30}
          />

          <h1>
            Preparing your privacy agreement
          </h1>

          <p>
            Reading the current policy version…
          </p>
        </section>
      </div>
    );
  }

  if (
    error &&
    !workspace
  ) {
    return (
      <div className="privacy-agreement-overlay">
        <section className="privacy-agreement-card state error">
          <AlertTriangle size={30} />

          <h1>
            Privacy agreement unavailable
          </h1>

          <p>{error}</p>

          <div className="privacy-agreement-actions">
            <button
              className="primary"
              type="button"
              onClick={() => {
                void load();
              }}
            >
              Try again
            </button>

            <button
              className="decline"
              disabled={loggingOut}
              type="button"
              onClick={() => {
                void handleDecline();
              }}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (
    workspace
      ?.accepted
  ) {
    return <Outlet />;
  }

  if (!workspace) {
    return null;
  }

  const blockedForMinor =
    workspace
      .eligibility
      .guardianFlowRequired;

  return (
    <div className="privacy-agreement-overlay">
      <section className="privacy-agreement-card">
        <div className="privacy-agreement-mark">
          <ShieldCheck size={29} />
        </div>

        <span className="privacy-agreement-eyebrow">
          PRIVACY & DATA USE
        </span>

        <h1>
          Review before continuing
        </h1>

        <p className="privacy-agreement-summary">
          {workspace.policy.summary}
        </p>

        <button
          className="privacy-policy-link"
          type="button"
          onClick={() => {
            setPolicyOpen(true);
          }}
        >
          <FileText size={16} />
          Read Privacy Policy
          <ExternalLink size={14} />
        </button>

        {blockedForMinor ? (
          <div className="privacy-agreement-warning">
            <LockKeyhole size={18} />

            <div>
              <strong>
                Guardian flow required
              </strong>

              <p>
                This account cannot use the standard
                all-function agreement. A dedicated
                guardian and minor-safety flow is
                required.
              </p>
            </div>
          </div>
        ) : (
          <div className="privacy-agreement-activation">
            <Check size={15} />

            <span>
              Agreement activates all disclosed
              AIMERS-native features immediately.
              External sources continue through their
              required authorization prompts.
            </span>
          </div>
        )}

        {error && (
          <div
            className="privacy-agreement-inline-error"
            role="alert"
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="privacy-agreement-actions">
          {!blockedForMinor && (
            <button
              className="primary"
              disabled={
                accepting ||
                loggingOut
              }
              type="button"
              onClick={() => {
                void handleAccept();
              }}
            >
              {accepting ? (
                <LoaderCircle
                  className="privacy-agreement-spin"
                  size={17}
                />
              ) : (
                <Check size={17} />
              )}

              I Agree and Continue
              <ArrowRight size={16} />
            </button>
          )}

          <button
            className="decline"
            disabled={
              accepting ||
              loggingOut
            }
            type="button"
            onClick={() => {
              void handleDecline();
            }}
          >
            {loggingOut ? (
              <LoaderCircle
                className="privacy-agreement-spin"
                size={16}
              />
            ) : (
              <LogOut size={16} />
            )}

            I Do Not Agree — Log Out
          </button>
        </div>

        <small className="privacy-agreement-version">
          Policy version {workspace.policy.version}
        </small>
      </section>

      {policyOpen && (
        <div
          className="privacy-policy-backdrop"
          role="presentation"
        >
          <article
            aria-label="AIMERS Privacy Policy"
            aria-modal="true"
            className="privacy-policy-modal"
            role="dialog"
          >
            <header>
              <div>
                <span>
                  <ShieldCheck size={16} />
                  CURRENT POLICY
                </span>

                <h2>
                  {workspace.policy.title}
                </h2>

                <p>
                  Version{" "}
                  {workspace.policy.version}
                </p>
              </div>

              <button
                aria-label="Close privacy policy"
                type="button"
                onClick={() => {
                  setPolicyOpen(false);
                }}
              >
                <X size={19} />
              </button>
            </header>

            <div className="privacy-policy-content">
              <p className="privacy-policy-lead">
                {workspace.policy.summary}
              </p>

              {workspace
                .policy
                .sections
                .map(
                  (
                    section,
                  ) => (
                    <section
                      key={section.title}
                    >
                      <h3>
                        {section.title}
                      </h3>

                      {section
                        .paragraphs
                        .map(
                          (
                            paragraph,
                          ) => (
                            <p key={paragraph}>
                              {paragraph}
                            </p>
                          ),
                        )}

                      <ul>
                        {section
                          .bullets
                          .map(
                            (
                              bullet,
                            ) => (
                              <li key={bullet}>
                                <Check size={14} />
                                <span>
                                  {bullet}
                                </span>
                              </li>
                            ),
                          )}
                      </ul>
                    </section>
                  ),
                )}
            </div>

            <footer>
              <button
                type="button"
                onClick={() => {
                  setPolicyOpen(false);
                }}
              >
                Close policy
              </button>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
