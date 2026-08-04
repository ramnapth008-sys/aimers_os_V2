import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Layers3,
  LoaderCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createFlashcardReviewSession,
  getFlashcardWorkspace,
} from "./flashcards.service";

import type {
  FlashcardDeck,
  FlashcardLearningState,
  FlashcardWorkspace,
} from "./flashcards.types";

import "./flashcards.css";

function messageFrom(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "The Flashcards request failed.";
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "No review scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

function formatDuration(
  seconds: number,
): string {
  if (seconds < 60) {
    return `${Math.max(0, seconds)} sec`;
  }

  return `${Math.max(
    1,
    Math.round(seconds / 60),
  )} min`;
}

const stateNames:
  Record<FlashcardLearningState, string> = {
    NEW: "New",
    LEARNING: "Learning",
    REVIEW: "Review",
    RELEARNING: "Relearning",
    MASTERED: "Mastered",
  };

function DeckCard({
  deck,
  busy,
  onStart,
}: {
  deck: FlashcardDeck;
  busy: boolean;
  onStart: (deckId: string) => void;
}) {
  return (
    <article className="fc-deck">
      <header>
        <span className="fc-deck-icon">
          <BookOpenCheck size={20} />
        </span>

        <b
          className={
            deck.dueCount > 0
              ? "fc-pill due"
              : "fc-pill clear"
          }
        >
          {deck.dueCount > 0
            ? `${deck.dueCount} due`
            : "Queue clear"}
        </b>
      </header>

      <div className="fc-deck-copy">
        <small>
          {deck.subject?.name ?? "Mixed"}
        </small>

        <h3>{deck.name}</h3>

        <p>
          {deck.description ??
            "Active-recall cards connected to your learning evidence."}
        </p>
      </div>

      <dl>
        <div>
          <dt>Cards</dt>
          <dd>{deck.cardCount}</dd>
        </div>

        <div>
          <dt>Due</dt>
          <dd>{deck.dueCount}</dd>
        </div>

        <div>
          <dt>Type</dt>
          <dd>
            {deck.isDefault ? "AIMERS" : "Custom"}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        disabled={
          busy ||
          deck.dueCount === 0
        }
        onClick={() => onStart(deck.id)}
      >
        {busy ? (
          <LoaderCircle
            className="fc-spin"
            size={16}
          />
        ) : (
          <Play size={16} />
        )}

        {deck.dueCount > 0
          ? "Review deck"
          : "Nothing due"}
      </button>
    </article>
  );
}

export function FlashcardsPage() {
  const {
    apiFetch,
  } = useAuth();

  const navigate = useNavigate();

  const [
    workspace,
    setWorkspace,
  ] = useState<FlashcardWorkspace | null>(
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
    starting,
    setStarting,
  ] = useState<string | null>(null);

  const [
    error,
    setError,
  ] = useState("");

  const loadWorkspace = useCallback(
    async (quiet = false) => {
      quiet
        ? setRefreshing(true)
        : setLoading(true);

      setError("");

      try {
        setWorkspace(
          await getFlashcardWorkspace(apiFetch),
        );
      } catch (requestError) {
        setError(messageFrom(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiFetch],
  );

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const startSession = useCallback(
    async (deckId?: string) => {
      const key = deckId ?? "all";
      setStarting(key);
      setError("");

      try {
        const session =
          await createFlashcardReviewSession(
            apiFetch,
            {
              deckId,
              limit: 20,
            },
          );

        navigate(
          `/flashcards/review/${session.id}`,
        );
      } catch (requestError) {
        setError(messageFrom(requestError));
      } finally {
        setStarting(null);
      }
    },
    [apiFetch, navigate],
  );

  const stateRows = useMemo(
    () =>
      workspace
        ? (
            Object.entries(
              workspace.summary.stateCounts,
            ) as Array<
              [FlashcardLearningState, number]
            >
          )
        : [],
    [workspace],
  );

  if (loading) {
    return (
      <div className="flashcards-page fc-state-page">
        <section className="fc-state">
          <LoaderCircle
            className="fc-spin"
            size={34}
          />
          <h1>Preparing Flashcards</h1>
          <p>
            Loading decks, schedules and review
            evidence…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flashcards-page fc-state-page">
        <section className="fc-state error">
          <AlertTriangle size={34} />
          <h1>Flashcards unavailable</h1>
          <p>
            {error ||
              "The Flashcards workspace could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => void loadWorkspace()}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      </div>
    );
  }

  const {
    summary,
    activeSession,
  } = workspace;

  return (
    <div className="flashcards-page">
      <header className="fc-hero">
        <div className="fc-hero-copy">
          <span className="fc-eyebrow">
            <Sparkles size={14} />
            ACTIVE RECALL
          </span>

          <h1>
            Remember more.
            <strong>
              {" "}Review at the right time.
            </strong>
          </h1>

          <p>
            Persistent decks, adaptive intervals
            and evidence-backed recall tracking
            for your active syllabus.
          </p>

          <div className="fc-actions">
            <button
              type="button"
              className="primary"
              disabled={
                summary.dueNow === 0 ||
                starting === "all"
              }
              onClick={() => void startSession()}
            >
              {starting === "all" ? (
                <LoaderCircle
                  className="fc-spin"
                  size={17}
                />
              ) : (
                <Zap size={17} />
              )}
              Review due cards
              <span>{summary.dueNow}</span>
            </button>

            <button
              type="button"
              disabled={refreshing}
              onClick={() =>
                void loadWorkspace(true)
              }
            >
              <RefreshCw
                className={
                  refreshing ? "fc-spin" : ""
                }
                size={17}
              />
              Refresh
            </button>
          </div>
        </div>

        <aside className="fc-due-card">
          <BrainCircuit size={38} />
          <span>DUE NOW</span>
          <strong>{summary.dueNow}</strong>
          <p>
            {summary.dueNow > 0
              ? "Cards are ready for active recall."
              : "Your immediate queue is clear."}
          </p>
          <footer>
            <CalendarClock size={15} />
            {formatDate(summary.nextDueAt)}
          </footer>
        </aside>
      </header>

      {error && (
        <div className="fc-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {activeSession && (
        <section className="fc-resume">
          <div>
            <span>
              <RotateCcw size={16} />
              ACTIVE SESSION
            </span>
            <strong>
              Continue where you stopped
            </strong>
            <p>
              {activeSession.reviewedCards} of{" "}
              {activeSession.totalCards} reviewed
              {activeSession.deck
                ? ` · ${activeSession.deck.name}`
                : " · Mixed queue"}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/flashcards/review/${activeSession.id}`,
              )
            }
          >
            Resume
            <ArrowRight size={17} />
          </button>
        </section>
      )}

      <section className="fc-metrics">
        <article>
          <Layers3 size={19} />
          <span>Active decks</span>
          <strong>
            {summary.activeDeckCount}
          </strong>
          <p>Subject and concept queues</p>
        </article>

        <article>
          <BookOpenCheck size={19} />
          <span>Active cards</span>
          <strong>
            {summary.activeCardCount}
          </strong>
          <p>Cards in this syllabus</p>
        </article>

        <article>
          <Target size={19} />
          <span>Strong recall</span>
          <strong>
            {summary.strongRecallPercent}%
          </strong>
          <p>GOOD and EASY ratings</p>
        </article>

        <article>
          <Trophy size={19} />
          <span>Total reviews</span>
          <strong>
            {summary.totalReviews}
          </strong>
          <p>Recorded memory evidence</p>
        </article>
      </section>

      <main className="fc-main-grid">
        <section className="fc-panel">
          <header className="fc-section-head">
            <div>
              <span>DECK LIBRARY</span>
              <h2>Subject review queues</h2>
              <p>
                Start a focused deck or review
                every due card together.
              </p>
            </div>
            <b>{summary.dueNow} ready</b>
          </header>

          <div className="fc-deck-grid">
            {workspace.decks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                busy={starting === deck.id}
                onStart={(deckId) =>
                  void startSession(deckId)
                }
              />
            ))}
          </div>
        </section>

        <aside className="fc-side">
          <section className="fc-panel fc-memory">
            <header>
              <div>
                <span>MEMORY STATE</span>
                <h2>Learning distribution</h2>
              </div>
              <BrainCircuit size={22} />
            </header>

            <div className="fc-state-list">
              {stateRows.map(([state, count]) => {
                const percent =
                  summary.activeCardCount === 0
                    ? 0
                    : Math.round(
                        (count /
                          summary.activeCardCount) *
                          100,
                      );

                return (
                  <div key={state}>
                    <header>
                      <span>{stateNames[state]}</span>
                      <strong>{count}</strong>
                    </header>
                    <div>
                      <span
                        style={{
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="fc-panel fc-logic">
            <header>
              <Clock3 size={20} />
              <div>
                <span>REVIEW LOGIC</span>
                <h2>1–3–7–15–30</h2>
              </div>
            </header>

            <div className="fc-rating-preview">
              <b>Again <span>10m</span></b>
              <b>Hard <span>1d+</span></b>
              <b>Good <span>Adaptive</span></b>
              <b>Easy <span>7d+</span></b>
            </div>

            <p>
              GOOD advances the learning steps.
              Later reviews adapt using interval,
              ease factor and lapse history.
            </p>
          </section>
        </aside>
      </main>

      <section className="fc-panel fc-history">
        <header className="fc-section-head">
          <div>
            <span>REVIEW HISTORY</span>
            <h2>Recent sessions</h2>
          </div>
          <CheckCircle2 size={22} />
        </header>

        {workspace.recentSessions.length === 0 ? (
          <div className="fc-empty">
            <Clock3 size={24} />
            <strong>No completed reviews yet</strong>
            <p>
              Complete the first queue to create
              memory evidence.
            </p>
          </div>
        ) : (
          <div className="fc-history-list">
            {workspace.recentSessions.map(
              (session) => (
                <article key={session.id}>
                  <div>
                    <strong>
                      {session.deck?.name ??
                        "Mixed review"}
                    </strong>
                    <span>
                      {formatDate(
                        session.completedAt,
                      )}
                    </span>
                  </div>
                  <b>
                    {session.reviewedCards}/
                    {session.totalCards}
                  </b>
                  <span>
                    Strong{" "}
                    {session.goodCount +
                      session.easyCount}
                  </span>
                  <span>
                    Again {session.againCount}
                  </span>
                  <span>
                    {formatDuration(
                      session.durationSeconds,
                    )}
                  </span>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
