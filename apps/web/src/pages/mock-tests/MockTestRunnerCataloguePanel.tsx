import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getMockTestRunnerCatalogue,
  startOrResumeMockTestRunnerAttempt,
} from "./mock-test-runner.service";

import type {
  MockTestRunnerCatalogue,
  RunnerCatalogueTest,
} from "./mock-test-runner.types";

import "./mock-test-runner.css";

function errorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "Unable to load the timed-test runner.";
}

function statusLabel(
  test: RunnerCatalogueTest,
): string {
  if (
    test.runnerStatus ===
    "RESUMABLE"
  ) {
    return "Resume attempt";
  }

  if (
    test.runnerStatus ===
    "READY"
  ) {
    return "Start timed test";
  }

  return "Runner unavailable";
}

export function MockTestRunnerCataloguePanel() {
  const {
    apiFetch,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    catalogue,
    setCatalogue,
  ] = useState<MockTestRunnerCatalogue | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    startingId,
    setStartingId,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const loadCatalogue =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          setCatalogue(
            await getMockTestRunnerCatalogue(
              apiFetch,
            ),
          );
        } catch (caught) {
          setError(
            errorMessage(caught),
          );
        } finally {
          setLoading(false);
        }
      },
      [apiFetch],
    );

  useEffect(() => {
    void loadCatalogue();
  }, [loadCatalogue]);

  async function startTest(
    test:
      RunnerCatalogueTest,
  ) {
    if (!test.runnable) {
      return;
    }

    setStartingId(test.id);
    setError("");

    try {
      const attempt =
        await startOrResumeMockTestRunnerAttempt(
          apiFetch,
          test.id,
        );

      navigate(
        `/mock-tests/runner/${attempt.id}`,
      );
    } catch (caught) {
      setError(
        errorMessage(caught),
      );
    } finally {
      setStartingId("");
    }
  }

  return (
    <article className="mock-panel runner-catalogue-panel">
      <header className="mock-panel-header">
        <div>
          <span>
            LIVE TEST RUNNER
          </span>

          <h2>
            Timed evaluated assessments
          </h2>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => {
            void loadCatalogue();
          }}
        >
          <RefreshCw
            className={
              loading
                ? "mock-spin"
                : ""
            }
            size={15}
          />
          Refresh
        </button>
      </header>

      <div className="runner-trust-strip">
        <span>
          <ShieldCheck size={15} />
          Answers stay protected
        </span>

        <span>
          <Clock3 size={15} />
          Server-enforced timer
        </span>

        <span>
          <FileCheck2 size={15} />
          Automatic evaluation
        </span>
      </div>

      {error && (
        <div className="runner-panel-error">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="runner-catalogue-loading">
          <LoaderCircle
            className="mock-spin"
            size={27}
          />

          <span>
            Checking runner readiness…
          </span>
        </div>
      ) : !catalogue ||
        catalogue.tests.length ===
          0 ? (
        <div className="runner-catalogue-empty">
          <Target size={29} />
          <strong>
            No runner tests available
          </strong>
          <p>
            Publish a test and assign every
            question before starting a timed
            attempt.
          </p>
        </div>
      ) : (
        <div className="runner-catalogue-list">
          {catalogue.tests.map(
            (test) => (
              <section
                key={test.id}
                className={
                  `runner-catalogue-card ${test.runnerStatus.toLowerCase()}`
                }
              >
                <span className="runner-catalogue-icon">
                  {test.runnable ? (
                    <Play size={21} />
                  ) : (
                    <LockKeyhole
                      size={21}
                    />
                  )}
                </span>

                <div className="runner-catalogue-copy">
                  <div>
                    <small>
                      {test.code ??
                        "MOCK TEST"}
                    </small>

                    <span
                      className={
                        test.runnerStatus
                          .toLowerCase()
                      }
                    >
                      {test.runnerStatus}
                    </span>
                  </div>

                  <h3>{test.title}</h3>

                  <p>
                    {test.description ??
                      "No description available."}
                  </p>

                  <div className="runner-catalogue-meta">
                    <span>
                      <Target size={13} />
                      {
                        test.assignedQuestionCount
                      }
                      /
                      {
                        test.totalQuestions
                      } assigned
                    </span>

                    <span>
                      <Trophy size={13} />
                      {test.totalMarks} marks
                    </span>

                    <span>
                      <Clock3 size={13} />
                      {
                        test.durationMinutes
                      } min
                    </span>
                  </div>

                  <div className="runner-section-pills">
                    {test.sections.map(
                      (section) => (
                        <span
                          key={section.id}
                        >
                          {section.name}
                          <b>
                            {
                              section.assignedQuestionCount
                            }
                            /
                            {
                              section.totalQuestions
                            }
                          </b>
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="runner-catalogue-action">
                  {test.activeAttempt && (
                    <p>
                      {
                        test.activeAttempt
                          .answeredQuestions
                      }
                      /
                      {
                        test.totalQuestions
                      } answered
                    </p>
                  )}

                  {!test.activeAttempt &&
                    test
                      .latestEvaluatedAttempt && (
                      <p>
                        Last score{" "}
                        <strong>
                          {
                            test
                              .latestEvaluatedAttempt
                              .rawScore
                          }
                          /
                          {
                            test.totalMarks
                          }
                        </strong>
                      </p>
                    )}

                  <button
                    type="button"
                    disabled={
                      !test.runnable ||
                      startingId ===
                        test.id
                    }
                    onClick={() => {
                      void startTest(
                        test,
                      );
                    }}
                  >
                    {startingId ===
                    test.id ? (
                      <LoaderCircle
                        className="mock-spin"
                        size={15}
                      />
                    ) : test.runnerStatus ===
                      "RESUMABLE" ? (
                      <RotateCcw
                        size={15}
                      />
                    ) : test.runnable ? (
                      <Play size={15} />
                    ) : (
                      <LockKeyhole
                        size={15}
                      />
                    )}

                    {statusLabel(test)}

                    {test.runnable &&
                      startingId !==
                        test.id && (
                        <ArrowRight
                          size={14}
                        />
                      )}
                  </button>

                  {test.runnable && (
                    <span className="runner-ready-note">
                      <CheckCircle2
                        size={13}
                      />
                      Assignment validated
                    </span>
                  )}
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </article>
  );
}
