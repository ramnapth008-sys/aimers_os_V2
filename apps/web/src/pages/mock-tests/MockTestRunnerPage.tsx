import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  Clock3,
  Eraser,
  Flag,
  Gauge,
  ListChecks,
  LoaderCircle,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Target,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getMockTestRunnerAttempt,
  saveMockTestRunnerResponse,
  submitMockTestRunnerAttempt,
} from "./mock-test-runner.service";

import type {
  MockTestRunnerAttempt,
  RunnerAssignedQuestion,
  RunnerAttemptSection,
  SaveRunnerResponseInput,
} from "./mock-test-runner.types";

import "./mock-test-runner.css";

interface FlatRunnerQuestion
  extends RunnerAssignedQuestion {
  section:
    RunnerAttemptSection;
}

function errorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "The mock-test runner could not complete the request.";
}

function timerLabel(
  seconds: number,
): string {
  const safe =
    Math.max(
      0,
      seconds,
    );

  const hours =
    Math.floor(
      safe / 3600,
    );

  const minutes =
    Math.floor(
      (
        safe % 3600
      ) / 60,
    );

  const remainder =
    safe % 60;

  return [
    hours,
    minutes,
    remainder,
  ]
    .map(
      (value) =>
        String(value).padStart(
          2,
          "0",
        ),
    )
    .join(":");
}

function durationLabel(
  seconds: number,
): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes =
    Math.floor(
      seconds / 60,
    );

  const remainder =
    seconds % 60;

  return remainder
    ? `${minutes}m ${remainder}s`
    : `${minutes}m`;
}

function resultClass(
  question:
    FlatRunnerQuestion,
): string {
  if (
    question.response
      .isCorrect === true
  ) {
    return "correct";
  }

  if (
    question.response
      .isCorrect === false
  ) {
    return "incorrect";
  }

  return "unanswered";
}

function StateCard({
  error,
  onRetry,
}: {
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mock-runner-page runner-state-page">
      <section
        className={
          `runner-state-card${error ? " error" : ""}`
        }
      >
        {error ? (
          <AlertTriangle size={31} />
        ) : (
          <LoaderCircle
            className="mock-spin"
            size={31}
          />
        )}

        <h1>
          {error
            ? "Runner unavailable"
            : "Preparing timed attempt"}
        </h1>

        <p>
          {error ??
            "Loading assigned questions, saved answers and the server timer…"}
        </p>

        {error && onRetry && (
          <button
            type="button"
            onClick={onRetry}
          >
            <RotateCcw size={15} />
            Try again
          </button>
        )}
      </section>
    </div>
  );
}

export function MockTestRunnerPage() {
  const {
    apiFetch,
  } = useAuth();

  const {
    attemptId,
  } = useParams<{
    attemptId: string;
  }>();

  const navigate =
    useNavigate();

  const [
    attempt,
    setAttempt,
  ] = useState<MockTestRunnerAttempt | null>(
    null,
  );

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const enteredQuestionAt =
    useRef(Date.now());

  const autoSubmitted =
    useRef(false);

  const flatQuestions =
    useMemo<
      FlatRunnerQuestion[]
    >(
      () =>
        attempt?.sections.flatMap(
          (section) =>
            section.questions.map(
              (question) => ({
                ...question,
                section,
              }),
            ),
        ) ?? [],
      [attempt],
    );

  const currentQuestion =
    flatQuestions[
      activeIndex
    ];

  const loadAttempt =
    useCallback(
      async () => {
        if (!attemptId) {
          setError(
            "No runner attempt ID was provided.",
          );
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        try {
          const loaded =
            await getMockTestRunnerAttempt(
              apiFetch,
              attemptId,
            );

          setAttempt(loaded);

          setRemainingSeconds(
            loaded.remainingSeconds,
          );

          const firstPending =
            loaded.sections
              .flatMap(
                (section) =>
                  section.questions,
              )
              .findIndex(
                (question) =>
                  !question.response
                    .selectedOptionId,
              );

          setActiveIndex(
            firstPending >= 0
              ? firstPending
              : 0,
          );

          enteredQuestionAt.current =
            Date.now();

          autoSubmitted.current =
            loaded.status !==
            "IN_PROGRESS";
        } catch (caught) {
          setError(
            errorMessage(caught),
          );
        } finally {
          setLoading(false);
        }
      },
      [
        apiFetch,
        attemptId,
      ],
    );

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  useEffect(() => {
    if (
      !attempt ||
      attempt.status !==
        "IN_PROGRESS" ||
      !attempt.expiresAt
    ) {
      return;
    }

    const expiresAt =
      new Date(
        attempt.expiresAt,
      ).getTime();

    const updateTimer = () => {
      const next =
        Math.max(
          0,
          Math.ceil(
            (
              expiresAt -
              Date.now()
            ) /
              1000,
          ),
        );

      setRemainingSeconds(
        next,
      );

      if (
        next === 0 &&
        !autoSubmitted.current
      ) {
        autoSubmitted.current =
          true;

        setSubmitting(true);

        void submitMockTestRunnerAttempt(
          apiFetch,
          attempt.id,
          {
            durationSeconds:
              attempt.mockTest
                .durationMinutes *
              60,
          },
        )
          .then(
            (evaluated) => {
              setAttempt(
                evaluated,
              );
            },
          )
          .catch(
            (caught: unknown) => {
              setError(
                errorMessage(
                  caught,
                ),
              );

              autoSubmitted.current =
                false;
            },
          )
          .finally(() => {
            setSubmitting(false);
          });
      }
    };

    updateTimer();

    const interval =
      window.setInterval(
        updateTimer,
        1000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    apiFetch,
    attempt,
  ]);

  function elapsedForCurrent(): number {
    if (!currentQuestion) {
      return 0;
    }

    const elapsed =
      Math.max(
        0,
        Math.round(
          (
            Date.now() -
            enteredQuestionAt
              .current
          ) /
            1000,
        ),
      );

    return (
      currentQuestion
        .response
        .timeSpentSeconds +
      elapsed
    );
  }

  async function persistCurrent(
    input:
      SaveRunnerResponseInput,
  ): Promise<MockTestRunnerAttempt | null> {
    if (
      !attempt ||
      !currentQuestion ||
      attempt.status !==
        "IN_PROGRESS"
    ) {
      return attempt;
    }

    const updated =
      await saveMockTestRunnerResponse(
        apiFetch,
        attempt.id,
        currentQuestion
          .mockTestQuestionId,
        {
          ...input,

          timeSpentSeconds:
            elapsedForCurrent(),
        },
      );

    setAttempt(updated);

    setRemainingSeconds(
      updated.remainingSeconds,
    );

    enteredQuestionAt.current =
      Date.now();

    return updated;
  }

  async function updateResponse(
    input:
      SaveRunnerResponseInput,
  ) {
    setSaving(true);
    setError("");

    try {
      await persistCurrent(
        input,
      );
    } catch (caught) {
      setError(
        errorMessage(caught),
      );
    } finally {
      setSaving(false);
    }
  }

  async function moveToQuestion(
    nextIndex: number,
  ) {
    if (
      !attempt ||
      nextIndex === activeIndex
    ) {
      return;
    }

    const bounded =
      Math.max(
        0,
        Math.min(
          flatQuestions.length -
            1,
          nextIndex,
        ),
      );

    setSaving(true);
    setError("");

    try {
      if (
        attempt.status ===
        "IN_PROGRESS"
      ) {
        await persistCurrent({});
      }

      setActiveIndex(bounded);

      enteredQuestionAt.current =
        Date.now();
    } catch (caught) {
      setError(
        errorMessage(caught),
      );
    } finally {
      setSaving(false);
    }
  }

  async function leaveRunner() {
    if (
      attempt?.status ===
      "IN_PROGRESS" &&
      currentQuestion
    ) {
      setSaving(true);

      try {
        await persistCurrent({});
      } catch {
        // Navigation remains available if
        // a final time-only save fails.
      } finally {
        setSaving(false);
      }
    }

    navigate("/mock-tests");
  }

  async function submitAttempt() {
    if (
      !attempt ||
      attempt.status !==
        "IN_PROGRESS"
    ) {
      return;
    }

    const answered =
      flatQuestions.filter(
        (question) =>
          question.response
            .selectedOptionId,
      ).length;

    const unanswered =
      flatQuestions.length -
      answered;

    if (
      !window.confirm(
        `Submit this attempt now?\n\nAnswered: ${answered}\nUnanswered: ${unanswered}\n\nAnswers cannot be changed after submission.`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await persistCurrent({});

      const maxDuration =
        attempt.mockTest
          .durationMinutes *
        60;

      const elapsed =
        attempt.startedAt
          ? Math.max(
              0,
              Math.round(
                (
                  Date.now() -
                  new Date(
                    attempt.startedAt,
                  ).getTime()
                ) /
                  1000,
              ),
            )
          : maxDuration -
            remainingSeconds;

      const evaluated =
        await submitMockTestRunnerAttempt(
          apiFetch,
          attempt.id,
          {
            durationSeconds:
              Math.min(
                maxDuration,
                elapsed,
              ),
          },
        );

      setAttempt(evaluated);
      setRemainingSeconds(0);
      autoSubmitted.current =
        true;
    } catch (caught) {
      setError(
        errorMessage(caught),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <StateCard />;
  }

  if (
    !attempt ||
    !currentQuestion
  ) {
    return (
      <StateCard
        error={
          error ||
          "The runner attempt does not contain any assigned questions."
        }
        onRetry={() => {
          void loadAttempt();
        }}
      />
    );
  }

  const evaluated =
    attempt.status ===
    "EVALUATED";

  const answeredCount =
    flatQuestions.filter(
      (question) =>
        question.response
          .selectedOptionId,
    ).length;

  const reviewCount =
    flatQuestions.filter(
      (question) =>
        question.response
          .isMarkedForReview,
    ).length;

  if (evaluated) {
    return (
      <div className="mock-runner-page">
        <header className="runner-result-hero">
          <button
            type="button"
            onClick={() => {
              navigate(
                "/mock-tests",
              );
            }}
          >
            <ArrowLeft size={16} />
            Mock Tests
          </button>

          <div>
            <span>
              EVALUATED ATTEMPT{" "}
              {attempt.attemptNumber}
            </span>

            <h1>
              {
                attempt.mockTest
                  .title
              }
            </h1>

            <p>
              Automatic scoring is complete.
              Review every response, correct
              option and explanation below.
            </p>
          </div>

          <section>
            <Trophy size={28} />
            <small>FINAL SCORE</small>
            <strong>
              {attempt.rawScore}/
              {
                attempt.mockTest
                  .totalMarks
              }
            </strong>
            <span>
              {attempt.percentage}%
            </span>
          </section>
        </header>

        {error && (
          <div className="runner-inline-error">
            <AlertTriangle
              size={15}
            />
            {error}
          </div>
        )}

        <section className="runner-result-metrics">
          <article>
            <CheckCircle2
              size={19}
            />
            <span>Correct</span>
            <strong>
              {
                attempt.correctAnswers
              }
            </strong>
          </article>

          <article>
            <XCircle size={19} />
            <span>Incorrect</span>
            <strong>
              {
                attempt.incorrectAnswers
              }
            </strong>
          </article>

          <article>
            <Circle size={19} />
            <span>Unanswered</span>
            <strong>
              {
                attempt.unansweredQuestions
              }
            </strong>
          </article>

          <article>
            <Gauge size={19} />
            <span>Accuracy</span>
            <strong>
              {
                attempt.accuracyPercent
              }%
            </strong>
          </article>

          <article>
            <Clock3 size={19} />
            <span>Duration</span>
            <strong>
              {durationLabel(
                attempt.durationSeconds,
              )}
            </strong>
          </article>
        </section>

        <section className="runner-result-layout">
          <aside className="runner-review-sidebar">
            <header>
              <span>
                QUESTION REVIEW
              </span>

              <strong>
                {
                  flatQuestions.length
                }
              </strong>
            </header>

            <div className="runner-review-palette">
              {flatQuestions.map(
                (
                  question,
                  index,
                ) => (
                  <button
                    type="button"
                    key={
                      question
                        .mockTestQuestionId
                    }
                    className={
                      `${resultClass(question)}${index === activeIndex ? " active" : ""}`
                    }
                    onClick={() => {
                      setActiveIndex(
                        index,
                      );

                      enteredQuestionAt.current =
                        Date.now();
                    }}
                  >
                    {index + 1}
                  </button>
                ),
              )}
            </div>

            <div className="runner-result-sections">
              {attempt.sectionResults.map(
                (result) => (
                  <article
                    key={result.id}
                  >
                    <div>
                      <strong>
                        {
                          result
                            .mockTestSection
                            .name
                        }
                      </strong>

                      <span>
                        {
                          result
                            .correctAnswers
                        } correct ·{" "}
                        {
                          result
                            .incorrectAnswers
                        } wrong
                      </span>
                    </div>

                    <b>
                      {result.score}/
                      {result.maxScore}
                    </b>

                    <small>
                      {
                        result
                          .accuracyPercent
                      }%
                    </small>
                  </article>
                ),
              )}
            </div>
          </aside>

          <main className="runner-review-question">
            <header>
              <div>
                <span>
                  QUESTION{" "}
                  {
                    currentQuestion
                      .globalSequenceNumber
                  }
                </span>

                <small>
                  {
                    currentQuestion
                      .section.name
                  } ·{" "}
                  {
                    currentQuestion
                      .question.topic
                      ?.name ??
                    currentQuestion
                      .question.chapter
                      ?.name ??
                    "General"
                  }
                </small>
              </div>

              <div>
                <span>
                  +
                  {
                    currentQuestion
                      .marks
                  }
                </span>

                <span>
                  −
                  {
                    currentQuestion
                      .negativeMarks
                  }
                </span>
              </div>
            </header>

            <h2>
              {
                currentQuestion
                  .question.stem
              }
            </h2>

            <div className="runner-options review">
              {currentQuestion
                .question.options
                .map(
                  (option) => {
                    const selected =
                      currentQuestion
                        .response
                        .selectedOptionId ===
                      option.id;

                    const correct =
                      currentQuestion
                        .question
                        .correctOptionId ===
                      option.id;

                    return (
                      <div
                        key={
                          option.id
                        }
                        className={
                          `${selected ? "selected" : ""} ${correct ? "correct" : ""} ${selected && !correct ? "incorrect" : ""}`
                        }
                      >
                        <b>
                          {
                            option.label
                          }
                        </b>

                        <span>
                          {option.text}
                        </span>

                        {correct && (
                          <CheckCircle2
                            size={18}
                          />
                        )}

                        {selected &&
                          !correct && (
                            <XCircle
                              size={18}
                            />
                          )}
                      </div>
                    );
                  },
                )}
            </div>

            <section
              className={
                `runner-result-explanation ${resultClass(currentQuestion)}`
              }
            >
              <header>
                {currentQuestion
                  .response
                  .isCorrect ? (
                  <CheckCircle2
                    size={19}
                  />
                ) : currentQuestion
                    .response
                    .isCorrect ===
                  false ? (
                  <XCircle
                    size={19}
                  />
                ) : (
                  <Circle
                    size={19}
                  />
                )}

                <strong>
                  {currentQuestion
                    .response
                    .isCorrect
                    ? "Correct response"
                    : currentQuestion
                          .response
                          .isCorrect ===
                        false
                      ? "Incorrect response"
                      : "Not answered"}
                </strong>

                <span>
                  {currentQuestion
                    .response
                    .awardedMarks >
                  0
                    ? `+${currentQuestion.response.awardedMarks}`
                    : currentQuestion
                        .response
                        .awardedMarks}
                </span>
              </header>

              <p>
                {currentQuestion
                  .question
                  .explanation ??
                  "No explanation is available for this question."}
              </p>
            </section>

            <footer>
              <button
                type="button"
                disabled={
                  activeIndex === 0
                }
                onClick={() => {
                  setActiveIndex(
                    Math.max(
                      0,
                      activeIndex -
                        1,
                    ),
                  );
                }}
              >
                <ArrowLeft
                  size={15}
                />
                Previous
              </button>

              <button
                type="button"
                disabled={
                  activeIndex >=
                  flatQuestions.length -
                    1
                }
                onClick={() => {
                  setActiveIndex(
                    Math.min(
                      flatQuestions.length -
                        1,
                      activeIndex +
                        1,
                    ),
                  );
                }}
              >
                Next
                <ArrowRight
                  size={15}
                />
              </button>
            </footer>
          </main>
        </section>
      </div>
    );
  }

  return (
    <div className="mock-runner-page">
      <header className="runner-topbar">
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            void leaveRunner();
          }}
        >
          <ArrowLeft size={16} />
          Exit and resume later
        </button>

        <div>
          <small>
            {
              attempt.mockTest
                .code ??
              "TIMED MOCK TEST"
            }
          </small>

          <strong>
            {
              attempt.mockTest
                .title
            }
          </strong>
        </div>

        <section
          className={
            remainingSeconds <=
            300
              ? "critical"
              : ""
          }
        >
          <Timer size={17} />

          <div>
            <small>
              TIME REMAINING
            </small>

            <strong>
              {timerLabel(
                remainingSeconds,
              )}
            </strong>
          </div>
        </section>

        <button
          type="button"
          className="submit"
          disabled={
            saving ||
            submitting
          }
          onClick={() => {
            void submitAttempt();
          }}
        >
          {submitting ? (
            <LoaderCircle
              className="mock-spin"
              size={15}
            />
          ) : (
            <Send size={15} />
          )}
          Submit Test
        </button>
      </header>

      <div className="runner-progress">
        <i
          style={{
            width:
              `${
                (
                  answeredCount /
                  Math.max(
                    1,
                    flatQuestions.length,
                  )
                ) *
                100
              }%`,
          }}
        />
      </div>

      {error && (
        <div className="runner-inline-error">
          <AlertTriangle
            size={15}
          />
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

      <section className="runner-workspace">
        <aside className="runner-palette">
          <header>
            <span>
              QUESTION PALETTE
            </span>

            <strong>
              {answeredCount}/
              {
                flatQuestions.length
              }
            </strong>
          </header>

          <div className="runner-section-groups">
            {attempt.sections.map(
              (section) => (
                <section
                  key={section.id}
                >
                  <div>
                    <strong>
                      {section.name}
                    </strong>

                    <span>
                      {
                        section.questions.filter(
                          (question) =>
                            question
                              .response
                              .selectedOptionId,
                        ).length
                      }
                      /
                      {
                        section
                          .questions
                          .length
                      }
                    </span>
                  </div>

                  <div>
                    {section.questions.map(
                      (question) => {
                        const index =
                          flatQuestions.findIndex(
                            (item) =>
                              item
                                .mockTestQuestionId ===
                              question
                                .mockTestQuestionId,
                          );

                        const answered =
                          Boolean(
                            question
                              .response
                              .selectedOptionId,
                          );

                        return (
                          <button
                            type="button"
                            key={
                              question
                                .mockTestQuestionId
                            }
                            className={
                              `${answered ? "answered" : ""} ${question.response.isMarkedForReview ? "review" : ""} ${index === activeIndex ? "active" : ""}`
                            }
                            onClick={() => {
                              void moveToQuestion(
                                index,
                              );
                            }}
                          >
                            {question
                              .globalSequenceNumber}
                          </button>
                        );
                      },
                    )}
                  </div>
                </section>
              ),
            )}
          </div>

          <dl>
            <div>
              <dt>
                <CheckCircle2
                  size={13}
                />
                Answered
              </dt>

              <dd>
                {answeredCount}
              </dd>
            </div>

            <div>
              <dt>
                <Flag size={13} />
                Review
              </dt>

              <dd>
                {reviewCount}
              </dd>
            </div>

            <div>
              <dt>
                <Circle size={13} />
                Not answered
              </dt>

              <dd>
                {
                  flatQuestions.length -
                  answeredCount
                }
              </dd>
            </div>
          </dl>
        </aside>

        <main className="runner-question">
          <header>
            <div>
              <span>
                QUESTION{" "}
                {
                  currentQuestion
                    .globalSequenceNumber
                } OF{" "}
                {
                  flatQuestions.length
                }
              </span>

              <small>
                {
                  currentQuestion
                    .section.name
                } ·{" "}
                {
                  currentQuestion
                    .question.topic
                    ?.name ??
                  currentQuestion
                    .question.chapter
                    ?.name ??
                  "General"
                }
              </small>
            </div>

            <div>
              <span>
                +
                {
                  currentQuestion
                    .marks
                }
              </span>

              <span>
                −
                {
                  currentQuestion
                    .negativeMarks
                }
              </span>
            </div>
          </header>

          <h1>
            {
              currentQuestion
                .question.stem
            }
          </h1>

          <div className="runner-options">
            {currentQuestion
              .question.options.map(
                (option) => {
                  const selected =
                    currentQuestion
                      .response
                      .selectedOptionId ===
                    option.id;

                  return (
                    <button
                      type="button"
                      key={option.id}
                      disabled={saving}
                      className={
                        selected
                          ? "selected"
                          : ""
                      }
                      onClick={() => {
                        void updateResponse(
                          {
                            selectedOptionId:
                              option.id,
                          },
                        );
                      }}
                    >
                      <b>
                        {option.label}
                      </b>

                      <span>
                        {option.text}
                      </span>

                      {selected && (
                        <CheckCircle2
                          size={18}
                        />
                      )}
                    </button>
                  );
                },
              )}
          </div>

          <div className="runner-question-actions">
            <button
              type="button"
              disabled={
                saving ||
                !currentQuestion
                  .response
                  .selectedOptionId
              }
              onClick={() => {
                void updateResponse(
                  {
                    selectedOptionId:
                      null,
                  },
                );
              }}
            >
              <Eraser size={15} />
              Clear response
            </button>

            <button
              type="button"
              className={
                currentQuestion
                  .response
                  .isMarkedForReview
                  ? "review-active"
                  : ""
              }
              disabled={saving}
              onClick={() => {
                void updateResponse(
                  {
                    isMarkedForReview:
                      !currentQuestion
                        .response
                        .isMarkedForReview,
                  },
                );
              }}
            >
              <Flag size={15} />
              {currentQuestion
                .response
                .isMarkedForReview
                ? "Remove review mark"
                : "Mark for review"}
            </button>

            <span>
              {saving ? (
                <>
                  <LoaderCircle
                    className="mock-spin"
                    size={14}
                  />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={14} />
                  Responses save to the
                  server
                </>
              )}
            </span>
          </div>

          <footer>
            <button
              type="button"
              disabled={
                saving ||
                activeIndex === 0
              }
              onClick={() => {
                void moveToQuestion(
                  activeIndex - 1,
                );
              }}
            >
              <ArrowLeft
                size={15}
              />
              Previous
            </button>

            <button
              type="button"
              disabled={
                saving ||
                activeIndex >=
                  flatQuestions.length -
                    1
              }
              onClick={() => {
                void moveToQuestion(
                  activeIndex + 1,
                );
              }}
            >
              Save & Next
              <ArrowRight
                size={15}
              />
            </button>
          </footer>
        </main>

        <aside className="runner-session-info">
          <span>
            ATTEMPT STATUS
          </span>

          <div className="runner-status-orb">
            <strong>
              {answeredCount}
            </strong>

            <small>
              of{" "}
              {
                flatQuestions.length
              } answered
            </small>
          </div>

          <dl>
            <div>
              <dt>Current section</dt>
              <dd>
                {
                  currentQuestion
                    .section.name
                }
              </dd>
            </div>

            <div>
              <dt>Difficulty</dt>
              <dd>
                {
                  currentQuestion
                    .question
                    .difficulty
                }
              </dd>
            </div>

            <div>
              <dt>Review marks</dt>
              <dd>
                {reviewCount}
              </dd>
            </div>

            <div>
              <dt>Attempt</dt>
              <dd>
                #
                {
                  attempt
                    .attemptNumber
                }
              </dd>
            </div>
          </dl>

          <section>
            <ShieldCheck
              size={17}
            />

            <p>
              Correct answers and
              explanations are withheld until
              final submission. Evaluation is
              performed by the API.
            </p>
          </section>

          <section>
            <BookmarkCheck
              size={17}
            />

            <p>
              Exit safely at any time. Your
              selected answers, review flags
              and question time are stored for
              resume.
            </p>
          </section>

          <section>
            <ListChecks
              size={17}
            />

            <p>
              Unanswered questions receive
              zero marks. Incorrect answers
              use the assigned negative
              marking.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
