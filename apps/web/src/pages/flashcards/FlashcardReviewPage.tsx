import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Gauge,
  Keyboard,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Trophy,
  X,
  Zap,
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
  completeFlashcardReviewSession,
  getFlashcardReviewSession,
  reviewFlashcard,
} from "./flashcards.service";

import type {
  FlashcardReviewRating,
  FlashcardReviewSession,
} from "./flashcards.types";

import "./flashcards.css";

function messageFrom(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "The review request failed.";
}

function durationLabel(
  seconds: number,
): string {
  if (seconds < 60) {
    return `${Math.max(0, seconds)} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

const ratings:
  Array<{
    value: FlashcardReviewRating;
    label: string;
    time: string;
    key: string;
    note: string;
  }> = [
    {
      value: "AGAIN",
      label: "Again",
      time: "10 min",
      key: "1",
      note: "Forgot it",
    },
    {
      value: "HARD",
      label: "Hard",
      time: "1 day+",
      key: "2",
      note: "Serious effort",
    },
    {
      value: "GOOD",
      label: "Good",
      time: "Adaptive",
      key: "3",
      note: "Normal recall",
    },
    {
      value: "EASY",
      label: "Easy",
      time: "7 days+",
      key: "4",
      note: "Instant recall",
    },
  ];

export function FlashcardReviewPage() {
  const {
    apiFetch,
  } = useAuth();

  const {
    sessionId = "",
  } = useParams<{
    sessionId: string;
  }>();

  const navigate = useNavigate();

  const [
    session,
    setSession,
  ] = useState<FlashcardReviewSession | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    flipped,
    setFlipped,
  ] = useState(false);

  const [
    pendingRating,
    setPendingRating,
  ] = useState<FlashcardReviewRating | null>(
    null,
  );

  const [
    finishing,
    setFinishing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const cardStartedAt = useRef(Date.now());

  const loadSession = useCallback(
    async () => {
      if (!sessionId) {
        setError("Review session ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result =
          await getFlashcardReviewSession(
            apiFetch,
            sessionId,
          );

        setSession(result);
        setFlipped(result.status === "COMPLETED");
        cardStartedAt.current = Date.now();
      } catch (requestError) {
        setError(messageFrom(requestError));
      } finally {
        setLoading(false);
      }
    },
    [apiFetch, sessionId],
  );

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const activeItem = useMemo(() => {
    if (!session || session.items.length === 0) {
      return null;
    }

    const index = Math.min(
      Math.max(0, session.currentIndex),
      session.items.length - 1,
    );

    return session.items[index];
  }, [session]);

  const submitRating = useCallback(
    async (
      rating: FlashcardReviewRating,
    ) => {
      if (
        !session ||
        !activeItem ||
        pendingRating ||
        session.status !== "ACTIVE"
      ) {
        return;
      }

      setPendingRating(rating);
      setError("");

      try {
        const responseSeconds = Math.max(
          0,
          Math.round(
            (Date.now() -
              cardStartedAt.current) /
              1000,
          ),
        );

        const result = await reviewFlashcard(
          apiFetch,
          session.id,
          activeItem.id,
          {
            rating,
            responseSeconds,
          },
        );

        setSession(result);
        setFlipped(result.status === "COMPLETED");
        cardStartedAt.current = Date.now();
      } catch (requestError) {
        setError(messageFrom(requestError));
      } finally {
        setPendingRating(null);
      }
    },
    [
      activeItem,
      apiFetch,
      pendingRating,
      session,
    ],
  );

  const finishNow = useCallback(
    async () => {
      if (!session || finishing) {
        return;
      }

      setFinishing(true);
      setError("");

      try {
        const started =
          new Date(session.startedAt).getTime();

        const durationSeconds = Math.max(
          0,
          Math.round(
            (Date.now() - started) / 1000,
          ),
        );

        setSession(
          await completeFlashcardReviewSession(
            apiFetch,
            session.id,
            durationSeconds,
          ),
        );

        setFlipped(true);
      } catch (requestError) {
        setError(messageFrom(requestError));
      } finally {
        setFinishing(false);
      }
    },
    [apiFetch, finishing, session],
  );

  useEffect(() => {
    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (
        event.code === "Space" &&
        session?.status === "ACTIVE"
      ) {
        event.preventDefault();
        setFlipped((value) => !value);
        return;
      }

      if (!flipped) {
        return;
      }

      const map:
        Record<string, FlashcardReviewRating> = {
          "1": "AGAIN",
          "2": "HARD",
          "3": "GOOD",
          "4": "EASY",
        };

      const rating = map[event.key];

      if (rating) {
        void submitRating(rating);
      }
    };

    window.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [
    flipped,
    session?.status,
    submitRating,
  ]);

  useEffect(() => {
    if (session?.status === "ACTIVE") {
      setFlipped(false);
    }
  }, [
    session?.currentIndex,
    session?.status,
  ]);

  if (loading) {
    return (
      <div className="flashcard-review-page fc-state-page">
        <section className="fc-state">
          <LoaderCircle
            className="fc-spin"
            size={34}
          />
          <h1>Opening review session</h1>
          <p>
            Restoring the persistent queue…
          </p>
        </section>
      </div>
    );
  }

  if (!session || !activeItem) {
    return (
      <div className="flashcard-review-page fc-state-page">
        <section className="fc-state error">
          <AlertTriangle size={34} />
          <h1>Review unavailable</h1>
          <p>
            {error ||
              "The session could not be loaded."}
          </p>
          <div className="fc-state-buttons">
            <button
              type="button"
              onClick={() => void loadSession()}
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <button
              type="button"
              onClick={() =>
                navigate("/flashcards")
              }
            >
              <ArrowLeft size={16} />
              Flashcards
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (session.status === "COMPLETED") {
    const strong =
      session.goodCount + session.easyCount;

    const percent =
      session.reviewedCards === 0
        ? 0
        : Math.round(
            (strong /
              session.reviewedCards) *
              100,
          );

    return (
      <div className="flashcard-review-page">
        <main className="fc-complete">
          <span className="fc-complete-icon">
            <Trophy size={36} />
          </span>
          <small>REVIEW COMPLETE</small>
          <h1>Memory evidence recorded</h1>
          <p>
            Every rating updated the schedule,
            interval, learning state and next
            review time.
          </p>

          <section>
            <div>
              <strong>
                {session.reviewedCards}
              </strong>
              <span>Reviewed</span>
            </div>
            <div>
              <strong>{percent}%</strong>
              <span>Strong recall</span>
            </div>
            <div>
              <strong>{session.againCount}</strong>
              <span>Relearning</span>
            </div>
            <div>
              <strong>
                {durationLabel(
                  session.durationSeconds,
                )}
              </strong>
              <span>Duration</span>
            </div>
          </section>

          <div className="fc-complete-ratings">
            <b>Again {session.againCount}</b>
            <b>Hard {session.hardCount}</b>
            <b>Good {session.goodCount}</b>
            <b>Easy {session.easyCount}</b>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/flashcards")
            }
          >
            <Check size={17} />
            Return to Flashcards
          </button>
        </main>
      </div>
    );
  }

  const progress =
    session.totalCards === 0
      ? 0
      : Math.round(
          (session.reviewedCards /
            session.totalCards) *
            100,
        );

  const schedule =
    activeItem.flashcard.schedule;

  return (
    <div className="flashcard-review-page">
      <header className="fc-review-top">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/flashcards")
            }
          >
            <ArrowLeft size={17} />
            Exit and resume later
          </button>

          <span>
            <Sparkles size={14} />
            {session.deck?.name ??
              "Mixed due cards"}
          </span>
        </div>

        <aside>
          <b>
            {session.reviewedCards + 1}/
            {session.totalCards}
          </b>
          <button
            type="button"
            disabled={finishing}
            onClick={() => void finishNow()}
          >
            {finishing ? (
              <LoaderCircle
                className="fc-spin"
                size={15}
              />
            ) : (
              <X size={15} />
            )}
            Finish now
          </button>
        </aside>
      </header>

      <div className="fc-progress">
        <span
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {error && (
        <div className="fc-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <main className="fc-review-grid">
        <aside className="fc-review-side">
          <section className="fc-panel">
            <header>
              <Gauge size={18} />
              <div>
                <span>SESSION</span>
                <h2>Progress</h2>
              </div>
            </header>

            <div className="fc-ring">
              <strong>{progress}%</strong>
              <span>
                {session.remainingCards} left
              </span>
            </div>

            <dl>
              <div>
                <dt>Again</dt>
                <dd>{session.againCount}</dd>
              </div>
              <div>
                <dt>Hard</dt>
                <dd>{session.hardCount}</dd>
              </div>
              <div>
                <dt>Good</dt>
                <dd>{session.goodCount}</dd>
              </div>
              <div>
                <dt>Easy</dt>
                <dd>{session.easyCount}</dd>
              </div>
            </dl>
          </section>

          <section className="fc-panel fc-shortcuts">
            <header>
              <Keyboard size={18} />
              <div>
                <span>SHORTCUTS</span>
                <h2>Keyboard</h2>
              </div>
            </header>
            <p><kbd>Space</kbd> Flip card</p>
            <p><kbd>1–4</kbd> Rate recall</p>
          </section>
        </aside>

        <section className="fc-panel fc-stage">
          <header>
            <div>
              <small>
                {activeItem.flashcard.subject.name}
              </small>
              <strong>
                {activeItem.flashcard.topic?.name ??
                  activeItem.flashcard.chapter
                    ?.name ??
                  "Core concept"}
              </strong>
            </div>

            <b>
              <BrainCircuit size={16} />
              {schedule?.state ?? "NEW"}
            </b>
          </header>

          <button
            type="button"
            className={
              flipped
                ? "fc-card flipped"
                : "fc-card"
            }
            onClick={() =>
              setFlipped((value) => !value)
            }
          >
            <small>
              {flipped ? "ANSWER" : "QUESTION"}
            </small>

            <div>
              {flipped ? (
                <>
                  <CheckCircle2 size={29} />
                  <p>
                    {activeItem.flashcard.back}
                  </p>
                </>
              ) : (
                <>
                  <Zap size={29} />
                  <h1>
                    {activeItem.flashcard.front}
                  </h1>
                  {activeItem.flashcard.hint && (
                    <aside>
                      <b>Hint</b>
                      <span>
                        {activeItem.flashcard.hint}
                      </span>
                    </aside>
                  )}
                </>
              )}
            </div>

            <footer>
              <Eye size={16} />
              {flipped
                ? "Tap to see the question"
                : "Think first, then reveal"}
            </footer>
          </button>

          {!flipped ? (
            <button
              type="button"
              className="fc-reveal"
              onClick={() => setFlipped(true)}
            >
              <Eye size={17} />
              Reveal answer
              <kbd>Space</kbd>
            </button>
          ) : (
            <section className="fc-rate">
              <header>
                <div>
                  <span>RATE YOUR RECALL</span>
                  <h2>
                    How well did you remember?
                  </h2>
                </div>
                <Clock3 size={20} />
              </header>

              <div>
                {ratings.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={item.value.toLowerCase()}
                    disabled={pendingRating !== null}
                    onClick={() =>
                      void submitRating(item.value)
                    }
                  >
                    <span>{item.label}</span>
                    <strong>{item.time}</strong>
                    <p>{item.note}</p>
                    <kbd>{item.key}</kbd>
                    {pendingRating === item.value && (
                      <LoaderCircle
                        className="fc-spin"
                        size={16}
                      />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}
