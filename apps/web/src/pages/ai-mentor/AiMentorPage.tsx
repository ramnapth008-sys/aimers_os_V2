import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Gauge,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  generateMentorBrief,
  getAiMentorWorkspace,
  respondToMentorCheckIn,
  sendMentorMessage,
} from "./ai-mentor.service";

import type {
  AiMentorWorkspace,
} from "./ai-mentor.types";

import "./ai-mentor.css";

// AIMERS_AI_MENTOR_CONFIDENCE_SCALE_FIX_V1
function confidencePercent(
  value:
    number,
) {
  return Math.round(
    Math.max(
      0,
      Math.min(
        1,
        value,
      ),
    ) *
      100,
  );
}

function scoreLabel(
  value:
    number | null |
    undefined,
) {
  return value ===
    null ||
    value ===
      undefined
    ? "—"
    : Math.round(
        value,
      ).toString();
}

export function AiMentorPage() {
  const {
    apiFetch,
  } = useAuth();

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

  const [
    workspace,
    setWorkspace,
  ] = useState<
    AiMentorWorkspace |
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
    sending,
    setSending,
  ] = useState(
    false,
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(
    false,
  );

  const [
    checkInBusy,
    setCheckInBusy,
  ] = useState(
    false,
  );

  const [
    input,
    setInput,
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

  const messagesEnd =
    useRef<HTMLDivElement>(
      null,
    );

  const load =
    useCallback(
      async (
        quiet =
          false,
      ) => {
        if (!quiet) {
          setLoading(
            true,
          );
        }

        setError("");

        try {
          setWorkspace(
            await getAiMentorWorkspace(
              apiFetch,
              timezone,
            ),
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load AI Mentor.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        apiFetch,
        timezone,
      ],
    );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    messagesEnd
      .current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });
  }, [
    workspace
      ?.messages
      .length,
  ]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !workspace ||
      !input.trim() ||
      sending
    ) {
      return;
    }

    const content =
      input.trim();

    setInput("");
    setSending(
      true,
    );
    setError("");
    setNotice("");

    try {
      const response =
        await sendMentorMessage(
          apiFetch,
          workspace
            .conversation
            .id,
          content,
        );

      setWorkspace(
        (
          current,
        ) =>
          current
            ? {
                ...current,
                messages: [
                  ...current
                    .messages,
                  response
                    .userMessage,
                  response
                    .assistantMessage,
                ],
              }
            : current,
      );
    } catch (caught) {
      setInput(
        content,
      );
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to send the mentor message.",
      );
    } finally {
      setSending(
        false,
      );
    }
  }

  async function refreshBrief() {
    setRefreshing(
      true,
    );
    setError("");
    setNotice("");

    try {
      const response =
        await generateMentorBrief(
          apiFetch,
          timezone,
        );

      setWorkspace(
        (
          current,
        ) =>
          current
            ? {
                ...current,
                brief:
                  response
                    .brief,
              }
            : current,
      );

      setNotice(
        "Today’s mentor briefing was regenerated from the latest planner and behavior evidence.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to regenerate the mentor briefing.",
      );
    } finally {
      setRefreshing(
        false,
      );
    }
  }

  async function answerCheckIn(
    option:
      string,
  ) {
    if (
      !workspace ||
      checkInBusy
    ) {
      return;
    }

    setCheckInBusy(
      true,
    );
    setError("");

    try {
      await respondToMentorCheckIn(
        apiFetch,
        workspace
          .checkIn
          .id,
        {
          answer:
            option,
          selectedOption:
            option,
        },
      );

      setNotice(
        "Your answer was saved. AIMERS will use it to separate difficulty, fatigue, interest, stress and interruption instead of guessing.",
      );

      await load(
        true,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save the mentor check-in.",
      );
    } finally {
      setCheckInBusy(
        false,
      );
    }
  }

  if (loading) {
    return (
      <div className="mentor-page mentor-state-page">
        <LoaderCircle
          className="mentor-spin"
          size={34}
        />

        <h1>
          Building today’s mentor context
        </h1>

        <p>
          Reading planner priorities, structured
          behavior evidence and active guidance…
        </p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mentor-page mentor-state-page">
        <AlertTriangle size={34} />

        <h1>
          AI Mentor is unavailable
        </h1>

        <p>
          {error ||
            "No mentor workspace was returned."}
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
      </div>
    );
  }

  const scores =
    workspace
      .context
      .behavior
      .latestScores;

  const signal =
    workspace
      .context
      .behavior
      .signals[0];

  return (
    <div className="mentor-page">
      <header className="mentor-hero">
        <div>
          <span className="mentor-eyebrow">
            <BrainCircuit size={16} />
            PROACTIVE DAILY MENTOR
          </span>

          <h1>
            Your friend, teacher and
            <strong>
              {" "}next-action guide.
            </strong>
          </h1>

          <p>
            AIMERS combines your planner, structured
            learning evidence, Behavior AI signals and
            voluntary check-ins. It never claims to read
            your mind or make a diagnosis.
          </p>
        </div>

        <section className="mentor-provider-card">
          <Sparkles size={24} />

          <small>
            MENTOR ENGINE
          </small>

          <strong>
            {workspace
              .provider
              .live
              ? "Live AI"
              : "Evidence rules"}
          </strong>

          <p>
            {workspace
              .provider
              .name}
            {" · "}
            {workspace
              .provider
              .model}
          </p>

          <span>
            <ShieldCheck size={14} />
            Raw URLs excluded
          </span>
        </section>
      </header>

      {error && (
        <div className="mentor-message error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {notice && (
        <div className="mentor-message success">
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      <section className="mentor-metrics">
        <article>
          <Gauge size={19} />
          <div>
            <small>
              FOCUS SCORE
            </small>
            <strong>
              {scoreLabel(
                scores
                  ?.focusScore,
              )}
            </strong>
            <p>
              {scores
                ?.predictionConfidence ??
                "MISSING"}
              {" confidence"}
            </p>
          </div>
        </article>

        <article>
          <Target size={19} />
          <div>
            <small>
              ACTIVE TASKS
            </small>
            <strong>
              {workspace
                .context
                .taskSummary
                .active}
            </strong>
            <p>
              {workspace
                .context
                .taskSummary
                .overdue}
              {" overdue"}
            </p>
          </div>
        </article>

        <article>
          <BrainCircuit size={19} />
          <div>
            <small>
              BEHAVIOR SIGNALS
            </small>
            <strong>
              {workspace
                .context
                .behavior
                .signals
                .length}
            </strong>
            <p>
              evidence-linked
            </p>
          </div>
        </article>

        <article>
          <MessageCircle size={19} />
          <div>
            <small>
              OPEN GUIDANCE
            </small>
            <strong>
              {workspace
                .context
                .guidance
                .length}
            </strong>
            <p>
              mentor actions
            </p>
          </div>
        </article>
      </section>

      <section className="mentor-layout">
        <div className="mentor-main-column">
          <article className="mentor-brief">
            <header>
              <div>
                <small>
                  TODAY’S BRIEFING
                </small>

                <h2>
                  {workspace
                    .brief
                    .headline}
                </h2>
              </div>

              <button
                disabled={
                  refreshing
                }
                type="button"
                onClick={() => {
                  void refreshBrief();
                }}
              >
                <RefreshCw
                  className={
                    refreshing
                      ? "mentor-spin"
                      : ""
                  }
                  size={15}
                />
                {refreshing
                  ? "Refreshing…"
                  : "Refresh brief"}
              </button>
            </header>

            <p>
              {workspace
                .brief
                .summary}
            </p>

            <div className="mentor-action-list">
              {workspace
                .brief
                .nextActions
                .map(
                  (
                    action,
                  ) => (
                    <section
                      key={
                        action
                          .title
                      }
                    >
                      <Clock3 size={17} />

                      <div>
                        <strong>
                          {
                            action
                              .title
                          }
                        </strong>

                        <small>
                          {
                            action
                              .durationMinutes
                          }
                          {" min · "}
                          {
                            action
                              .reason
                          }
                        </small>
                      </div>
                    </section>
                  ),
                )}
            </div>
          </article>

          <article className="mentor-chat">
            <header>
              <div>
                <small>
                  DAILY CONVERSATION
                </small>

                <h2>
                  {workspace
                    .conversation
                    .title}
                </h2>
              </div>

              <span>
                {workspace
                  .messages
                  .length}
                {" messages"}
              </span>
            </header>

            <div className="mentor-chat-messages">
              {workspace
                .messages
                .length ===
                0 && (
                <section className="mentor-chat-empty">
                  <BrainCircuit size={28} />

                  <strong>
                    Tell me what is happening today.
                  </strong>

                  <p>
                    Ask what to study next, explain why you
                    are avoiding a topic, or request a
                    realistic recovery plan.
                  </p>
                </section>
              )}

              {workspace
                .messages
                .map(
                  (
                    message,
                  ) => (
                    <article
                      className={
                        message
                          .role ===
                        "USER"
                          ? "user"
                          : "assistant"
                      }
                      key={
                        message
                          .id
                      }
                    >
                      <small>
                        {message
                          .role ===
                        "USER"
                          ? "YOU"
                          : "AIMERS MENTOR"}
                      </small>

                      <p>
                        {
                          message
                            .content
                        }
                      </p>
                    </article>
                  ),
                )}

              <div
                ref={
                  messagesEnd
                }
              />
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <textarea
                value={
                  input
                }
                placeholder="Tell AIMERS what you are struggling with, or ask what to do next…"
                onChange={(
                  event,
                ) =>
                  setInput(
                    event
                      .target
                      .value,
                  )
                }
              />

              <button
                disabled={
                  sending ||
                  !input.trim()
                }
                type="submit"
              >
                {sending
                  ? (
                    <LoaderCircle
                      className="mentor-spin"
                      size={17}
                    />
                  )
                  : <Send size={17} />}
                Send
              </button>
            </form>
          </article>
        </div>

        <aside className="mentor-side-column">
          <article className="mentor-check-in">
            <header>
              <small>
                MINDSET CHECK-IN
              </small>

              <h2>
                Confirm the cause, don’t let AIMERS guess.
              </h2>
            </header>

            <p>
              {workspace
                .checkIn
                .question}
            </p>

            {workspace
              .checkIn
              .status ===
              "OPEN" &&
              workspace
                .checkIn
                .options
                ?.map(
                  (
                    option,
                  ) => (
                    <button
                      disabled={
                        checkInBusy
                      }
                      key={
                        option
                      }
                      type="button"
                      onClick={() => {
                        void answerCheckIn(
                          option,
                        );
                      }}
                    >
                      {option}
                    </button>
                  ),
                )}

            {workspace
              .checkIn
              .status !==
              "OPEN" && (
              <div className="mentor-check-in-complete">
                <CheckCircle2 size={16} />
                Check-in answered
              </div>
            )}
          </article>

          <article className="mentor-evidence">
            <header>
              <small>
                CURRENT EVIDENCE
              </small>

              <h2>
                What AIMERS can support
              </h2>
            </header>

            {signal
              ? (
                <section>
                  <strong>
                    {
                      signal
                        .title
                    }
                  </strong>

                  <p>
                    {
                      signal
                        .description
                    }
                  </p>

                  <span>
                    {confidencePercent(
                      signal
                        .confidenceScore,
                    )}
                    % confidence ·{" "}
                    {
                      signal
                        .dataConfidence
                    }
                  </span>
                </section>
              )
              : (
                <p>
                  No active Behavior AI signal has enough
                  evidence right now.
                </p>
              )}

            <div>
              <ShieldCheck size={15} />

              <p>
                Raw activity, full URLs and private
                external chats are not sent into the
                mentor context.
              </p>
            </div>
          </article>

          <article className="mentor-boundary">
            <AlertTriangle size={18} />

            <div>
              <strong>
                Push notifications are not active yet.
              </strong>

              <p>
                This foundation provides persistent
                in-app mentoring. Service worker, Web Push,
                scheduling and logged-out delivery are the
                next milestone.
              </p>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
