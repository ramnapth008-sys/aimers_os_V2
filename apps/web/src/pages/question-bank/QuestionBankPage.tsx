import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Filter,
  Gauge,
  Layers3,
  Library,
  ListChecks,
  LoaderCircle,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  answerPracticeItem,
  bookmarkQuestion,
  completePracticeSession,
  createPracticeSession,
  getPracticeSession,
  getQuestionBankWorkspace,
  listQuestionBankQuestions,
  removeQuestionBookmark,
} from "./question-bank.service";

import type {
  QuestionBankQuestion,
  QuestionBankWorkspace,
  QuestionFilters,
  QuestionPracticeItem,
  QuestionPracticeSession,
  QuestionPracticeSessionSummary,
} from "./question-bank.types";

import "./question-bank.css";

const emptyFilters: QuestionFilters = {
  subjectId: "",
  chapterId: "",
  topicId: "",
  difficulty: "",
  search: "",
  bookmarkedOnly: false,
};

function formatDuration(
  seconds: number,
): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return remainder
    ? `${minutes}m ${remainder}s`
    : `${minutes}m`;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "In progress";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function errorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

function Panel({
  eyebrow,
  title,
  action,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`qb-panel ${className}`}>
      <header className="qb-panel-header">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>

        {action}
      </header>

      {children}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="qb-metric">
      <span>{icon}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="qb-empty">
      {icon}
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function QuestionCard({
  question,
  selected,
  onSelect,
  onBookmark,
}: {
  question: QuestionBankQuestion;
  selected: boolean;
  onSelect: () => void;
  onBookmark: () => void;
}) {
  return (
    <article
      className={`qb-question-card${selected ? " selected" : ""}`}
    >
      <button
        type="button"
        className="qb-question-open"
        onClick={onSelect}
      >
        <header>
          <span>{question.subject.name}</span>

          <small
            className={question.difficulty.toLowerCase()}
          >
            {question.difficulty}
          </small>
        </header>

        <p>{question.stem}</p>

        <footer>
          <span>
            {question.topic?.name ??
              question.chapter?.name ??
              "General"}
          </span>

          <strong>
            +{question.marks}/−{question.negativeMarks}
          </strong>
        </footer>
      </button>

      <button
        type="button"
        className={`qb-bookmark${question.bookmarked ? " active" : ""}`}
        aria-label={
          question.bookmarked
            ? "Remove bookmark"
            : "Bookmark question"
        }
        onClick={onBookmark}
      >
        <Bookmark
          size={16}
          fill={
            question.bookmarked
              ? "currentColor"
              : "none"
          }
        />
      </button>
    </article>
  );
}

function QuestionPreview({
  question,
  onBookmark,
  onPractice,
}: {
  question: QuestionBankQuestion | null;
  onBookmark: () => void;
  onPractice: () => void;
}) {
  if (!question) {
    return (
      <EmptyState
        icon={<BookOpen size={32} />}
        title="Select a question"
        detail="Open a catalogue item to inspect its options, syllabus mapping and source."
      />
    );
  }

  return (
    <div className="qb-preview">
      <header>
        <div>
          <span>{question.subject.name}</span>
          <strong>{question.code}</strong>
        </div>

        <button
          type="button"
          className={question.bookmarked ? "active" : ""}
          onClick={onBookmark}
        >
          <Bookmark
            size={16}
            fill={
              question.bookmarked
                ? "currentColor"
                : "none"
            }
          />

          {question.bookmarked
            ? "Bookmarked"
            : "Bookmark"}
        </button>
      </header>

      <div className="qb-preview-tags">
        <span
          className={question.difficulty.toLowerCase()}
        >
          {question.difficulty}
        </span>

        <span>
          {question.type.replaceAll("_", " ")}
        </span>

        <span>{question.estimatedSeconds}s</span>
      </div>

      <h3>{question.stem}</h3>

      <div className="qb-preview-options">
        {question.options.map(
          (option) => (
            <div key={option.id}>
              <b>{option.label}</b>
              <span>{option.text}</span>
            </div>
          ),
        )}
      </div>

      <dl>
        <div>
          <dt>Chapter</dt>
          <dd>
            {question.chapter?.name ?? "Not mapped"}
          </dd>
        </div>

        <div>
          <dt>Topic</dt>
          <dd>
            {question.topic?.name ?? "Not mapped"}
          </dd>
        </div>

        <div>
          <dt>Source</dt>
          <dd>
            {question.sourceName ?? question.sourceType}
          </dd>
        </div>
      </dl>

      <div className="qb-preview-note">
        Correct answers and explanations stay
        protected until evaluation inside a
        practice session.
      </div>

      <button
        type="button"
        className="qb-primary-button"
        onClick={onPractice}
      >
        <Play size={16} />
        Practice with current filters
      </button>
    </div>
  );
}

function SessionRow({
  session,
  onOpen,
}: {
  session: QuestionPracticeSessionSummary;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="qb-session-row"
      onClick={onOpen}
    >
      <span className={session.status.toLowerCase()}>
        {session.status === "COMPLETED" ? (
          <CheckCircle2 size={17} />
        ) : (
          <Clock3 size={17} />
        )}
      </span>

      <div>
        <strong>{session.name}</strong>

        <small>
          {session.answeredQuestions}/{session.totalQuestions} answered ·{" "}
          {session.accuracyPercent}% accuracy
        </small>
      </div>

      <time>
        {formatDate(
          session.completedAt ?? session.startedAt,
        )}
      </time>

      <ChevronRight size={15} />
    </button>
  );
}

function PracticeWorkspace({
  session,
  activeIndex,
  pendingOptionId,
  answering,
  completing,
  onSelectOption,
  onSubmitAnswer,
  onMove,
  onComplete,
  onExit,
}: {
  session: QuestionPracticeSession;
  activeIndex: number;
  pendingOptionId: string;
  answering: boolean;
  completing: boolean;
  onSelectOption: (optionId: string) => void;
  onSubmitAnswer: () => void;
  onMove: (index: number) => void;
  onComplete: () => void;
  onExit: () => void;
}) {
  const item = session.items[activeIndex];

  if (!item) {
    return null;
  }

  const answered =
    item.status === "CORRECT" ||
    item.status === "INCORRECT";

  const completed = session.status === "COMPLETED";
  const revealed = answered || completed;

  return (
    <div className="qb-practice-shell">
      <header className="qb-practice-topbar">
        <button
          type="button"
          onClick={onExit}
        >
          <ArrowLeft size={16} />
          Question Bank
        </button>

        <div>
          <span>{session.name}</span>
          <strong>
            {session.answeredQuestions}/{session.totalQuestions}
          </strong>
        </div>

        <button
          type="button"
          disabled={completing || completed}
          onClick={onComplete}
        >
          {completing ? (
            <LoaderCircle
              className="qb-spin"
              size={15}
            />
          ) : (
            <CheckCircle2 size={15} />
          )}

          {completed ? "Completed" : "Finish"}
        </button>
      </header>

      <div className="qb-practice-progress">
        <i
          style={{
            width: `${
              session.totalQuestions === 0
                ? 0
                : (
                    session.answeredQuestions /
                    session.totalQuestions
                  ) *
                  100
            }%`,
          }}
        />
      </div>

      <main className="qb-practice-layout">
        <aside className="qb-practice-map">
          <span>QUESTION MAP</span>

          <div>
            {session.items.map(
              (current, index) => (
                <button
                  type="button"
                  key={current.id}
                  className={`${current.status.toLowerCase()}${index === activeIndex ? " active" : ""}`}
                  onClick={() => onMove(index)}
                >
                  {index + 1}
                </button>
              ),
            )}
          </div>

          <dl>
            <div>
              <dt>
                <CheckCircle2 size={13} />
                Correct
              </dt>
              <dd>{session.correctAnswers}</dd>
            </div>

            <div>
              <dt>
                <XCircle size={13} />
                Incorrect
              </dt>
              <dd>{session.incorrectAnswers}</dd>
            </div>

            <div>
              <dt>
                <Circle size={13} />
                Remaining
              </dt>
              <dd>
                {Math.max(
                  0,
                  session.totalQuestions -
                    session.answeredQuestions,
                )}
              </dd>
            </div>
          </dl>
        </aside>

        <section className="qb-practice-question">
          <header>
            <div>
              <span>QUESTION {activeIndex + 1}</span>

              <small>
                {item.question.subject.name} ·{" "}
                {item.question.topic?.name ??
                  item.question.chapter?.name ??
                  "General"}
              </small>
            </div>

            <div>
              <span>+{item.question.marks}</span>
              <span>−{item.question.negativeMarks}</span>
            </div>
          </header>

          <h1>{item.question.stem}</h1>

          <div className="qb-answer-options">
            {item.question.options.map(
              (option) => {
                const selected =
                  (
                    revealed
                      ? item.selectedOptionId
                      : pendingOptionId
                  ) === option.id;

                const correct =
                  revealed &&
                  item.question.correctOptionId ===
                    option.id;

                const incorrect =
                  revealed &&
                  selected &&
                  !correct;

                return (
                  <button
                    type="button"
                    key={option.id}
                    disabled={revealed}
                    className={`${selected ? "selected" : ""} ${correct ? "correct" : ""} ${incorrect ? "incorrect" : ""}`}
                    onClick={() =>
                      onSelectOption(option.id)
                    }
                  >
                    <b>{option.label}</b>
                    <span>{option.text}</span>

                    {correct && (
                      <CheckCircle2 size={18} />
                    )}

                    {incorrect && (
                      <XCircle size={18} />
                    )}
                  </button>
                );
              },
            )}
          </div>

          {revealed && (
            <section
              className={`qb-explanation ${
                item.isCorrect
                  ? "correct"
                  : item.status === "SKIPPED"
                    ? "skipped"
                    : "incorrect"
              }`}
            >
              <header>
                {item.isCorrect ? (
                  <CheckCircle2 size={20} />
                ) : item.status === "SKIPPED" ? (
                  <Circle size={20} />
                ) : (
                  <XCircle size={20} />
                )}

                <strong>
                  {item.isCorrect
                    ? "Correct answer"
                    : item.status === "SKIPPED"
                      ? "Question skipped"
                      : "Incorrect answer"}
                </strong>

                <span>
                  {item.awardedMarks > 0
                    ? `+${item.awardedMarks}`
                    : item.awardedMarks}
                </span>
              </header>

              <p>
                {item.question.explanation ??
                  "No explanation is available for this question."}
              </p>
            </section>
          )}

          <footer>
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() =>
                onMove(activeIndex - 1)
              }
            >
              <ArrowLeft size={15} />
              Previous
            </button>

            {!revealed ? (
              <button
                type="button"
                className="primary"
                disabled={!pendingOptionId || answering}
                onClick={onSubmitAnswer}
              >
                {answering ? (
                  <LoaderCircle
                    className="qb-spin"
                    size={15}
                  />
                ) : (
                  <Target size={15} />
                )}
                Check Answer
              </button>
            ) : activeIndex < session.items.length - 1 ? (
              <button
                type="button"
                className="primary"
                onClick={() =>
                  onMove(activeIndex + 1)
                }
              >
                Next Question
                <ArrowRight size={15} />
              </button>
            ) : !completed ? (
              <button
                type="button"
                className="primary"
                disabled={completing}
                onClick={onComplete}
              >
                <Trophy size={15} />
                Finish Practice
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={onExit}
              >
                Back to Question Bank
                <ArrowRight size={15} />
              </button>
            )}
          </footer>
        </section>

        <aside className="qb-practice-info">
          <span>SESSION STATUS</span>

          <div className="qb-score-orb">
            <strong>{session.score}</strong>
            <small>score</small>
          </div>

          <dl>
            <div>
              <dt>Accuracy</dt>
              <dd>{session.accuracyPercent}%</dd>
            </div>

            <div>
              <dt>Difficulty</dt>
              <dd>{item.question.difficulty}</dd>
            </div>

            <div>
              <dt>Expected time</dt>
              <dd>
                {formatDuration(
                  item.question.estimatedSeconds,
                )}
              </dd>
            </div>
          </dl>

          <p>
            Answers are evaluated by the API.
            The browser never receives the
            correct option before evaluation.
          </p>
        </aside>
      </main>
    </div>
  );
}

export function QuestionBankPage() {
  const {
    apiFetch,
  } = useAuth();

  const [
    workspace,
    setWorkspace,
  ] = useState<QuestionBankWorkspace | null>(null);

  const [
    questions,
    setQuestions,
  ] = useState<QuestionBankQuestion[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<QuestionFilters>(emptyFilters);

  const [
    selectedQuestionId,
    setSelectedQuestionId,
  ] = useState("");

  const [
    practiceCount,
    setPracticeCount,
  ] = useState(10);

  const [
    practiceName,
    setPracticeName,
  ] = useState("");

  const [
    session,
    setSession,
  ] = useState<QuestionPracticeSession | null>(null);

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    pendingOptionId,
    setPendingOptionId,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    questionsLoading,
    setQuestionsLoading,
  ] = useState(false);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    answering,
    setAnswering,
  ] = useState(false);

  const [
    completing,
    setCompleting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const sessionStartedAt = useRef(0);
  const questionStartedAt = useRef(0);

  const selectedQuestion =
    useMemo(
      () =>
        questions.find(
          (question) =>
            question.id === selectedQuestionId,
        ) ??
        questions[0] ??
        null,
      [
        questions,
        selectedQuestionId,
      ],
    );

  const syllabusSubjects =
    workspace?.syllabusVersion.subjects ?? [];

  const selectedSyllabusSubject =
    syllabusSubjects.find(
      (item) =>
        item.subjectId === filters.subjectId,
    );

  const availableChapters =
    useMemo(
      () =>
        selectedSyllabusSubject?.units.flatMap(
          (unit) =>
            unit.chapters,
        ) ?? [],
      [selectedSyllabusSubject],
    );

  const selectedChapter =
    availableChapters.find(
      (chapter) =>
        chapter.id === filters.chapterId,
    );

  const availableTopics =
    selectedChapter?.topics ?? [];

  const loadWorkspace =
    useCallback(
      async () => {
        setError("");

        try {
          setWorkspace(
            await getQuestionBankWorkspace(apiFetch),
          );
        } catch (caught) {
          setError(errorMessage(caught));
        }
      },
      [apiFetch],
    );

  const loadQuestions =
    useCallback(
      async (
        nextFilters: QuestionFilters,
      ) => {
        setQuestionsLoading(true);
        setError("");

        try {
          const response =
            await listQuestionBankQuestions(
              apiFetch,
              nextFilters,
            );

          setQuestions(response.items);

          setSelectedQuestionId(
            (current) =>
              response.items.some(
                (item) =>
                  item.id === current,
              )
                ? current
                : response.items[0]?.id ?? "",
          );
        } catch (caught) {
          setError(errorMessage(caught));
        } finally {
          setQuestionsLoading(false);
        }
      },
      [apiFetch],
    );

  useEffect(() => {
    let active = true;

    const start = async () => {
      setLoading(true);

      await Promise.all([
        loadWorkspace(),
        loadQuestions(emptyFilters),
      ]);

      if (active) {
        setLoading(false);
      }
    };

    void start();

    return () => {
      active = false;
    };
  }, [
    loadQuestions,
    loadWorkspace,
  ]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void loadQuestions(filters);
        },
        220,
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    filters,
    loadQuestions,
    loading,
  ]);

  const updateFilter = <
    Key extends keyof QuestionFilters,
  >(
    key: Key,
    value: QuestionFilters[Key],
  ) => {
    setFilters(
      (current) => {
        if (key === "subjectId") {
          return {
            ...current,
            subjectId: value as string,
            chapterId: "",
            topicId: "",
          };
        }

        if (key === "chapterId") {
          return {
            ...current,
            chapterId: value as string,
            topicId: "",
          };
        }

        return {
          ...current,
          [key]: value,
        };
      },
    );
  };

  const replaceQuestion =
    (
      questionId: string,
      bookmarked: boolean,
    ) => {
      setQuestions(
        (current) =>
          current.map(
            (question) =>
              question.id === questionId
                ? {
                    ...question,
                    bookmarked,
                  }
                : question,
          ),
      );
    };

  const toggleBookmark =
    async (
      question: QuestionBankQuestion,
    ) => {
      try {
        if (question.bookmarked) {
          await removeQuestionBookmark(
            apiFetch,
            question.id,
          );
        } else {
          await bookmarkQuestion(
            apiFetch,
            question.id,
          );
        }

        replaceQuestion(
          question.id,
          !question.bookmarked,
        );

        await loadWorkspace();

        if (
          filters.bookmarkedOnly &&
          question.bookmarked
        ) {
          await loadQuestions(filters);
        }
      } catch (caught) {
        setError(errorMessage(caught));
      }
    };

  const startPractice =
    async (
      event?: FormEvent,
    ) => {
      event?.preventDefault();

      setCreating(true);
      setError("");

      try {
        const created =
          await createPracticeSession(
            apiFetch,
            {
              name:
                practiceName.trim() ||
                undefined,

              subjectId:
                filters.subjectId ||
                undefined,

              chapterId:
                filters.chapterId ||
                undefined,

              topicId:
                filters.topicId ||
                undefined,

              difficulty:
                filters.difficulty ||
                undefined,

              bookmarkedOnly:
                filters.bookmarkedOnly,

              questionCount:
                practiceCount,
            },
          );

        setSession(created);
        setActiveIndex(0);
        setPendingOptionId("");

        sessionStartedAt.current = Date.now();
        questionStartedAt.current = Date.now();
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setCreating(false);
      }
    };

  const openSession =
    async (
      summary: QuestionPracticeSessionSummary,
    ) => {
      setError("");

      try {
        const opened =
          await getPracticeSession(
            apiFetch,
            summary.id,
          );

        setSession(opened);

        const firstUnanswered =
          opened.items.findIndex(
            (item) =>
              item.status === "UNANSWERED",
          );

        setActiveIndex(
          firstUnanswered >= 0
            ? firstUnanswered
            : 0,
        );

        setPendingOptionId("");
        sessionStartedAt.current = Date.now();
        questionStartedAt.current = Date.now();
      } catch (caught) {
        setError(errorMessage(caught));
      }
    };

  const currentItem:
    QuestionPracticeItem | undefined =
    session?.items[activeIndex];

  const submitAnswer =
    async () => {
      if (
        !session ||
        !currentItem ||
        !pendingOptionId
      ) {
        return;
      }

      setAnswering(true);
      setError("");

      try {
        const elapsed =
          Math.max(
            0,
            Math.round(
              (
                Date.now() -
                questionStartedAt.current
              ) /
                1000,
            ),
          );

        const updated =
          await answerPracticeItem(
            apiFetch,
            session.id,
            currentItem.id,
            pendingOptionId,
            elapsed,
          );

        setSession(updated);
        setPendingOptionId("");
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setAnswering(false);
      }
    };

  const moveTo =
    (
      index: number,
    ) => {
      if (!session) {
        return;
      }

      const bounded =
        Math.max(
          0,
          Math.min(
            session.items.length - 1,
            index,
          ),
        );

      setActiveIndex(bounded);
      setPendingOptionId("");
      questionStartedAt.current = Date.now();
    };

  const finishPractice =
    async () => {
      if (!session) {
        return;
      }

      setCompleting(true);
      setError("");

      try {
        const elapsed =
          Math.max(
            0,
            Math.round(
              (
                Date.now() -
                sessionStartedAt.current
              ) /
                1000,
            ),
          );

        const completed =
          await completePracticeSession(
            apiFetch,
            session.id,
            elapsed,
          );

        setSession(completed);
        await loadWorkspace();
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setCompleting(false);
      }
    };

  const exitPractice =
    () => {
      setSession(null);
      setActiveIndex(0);
      setPendingOptionId("");
      void loadWorkspace();
      void loadQuestions(filters);
    };

  if (loading) {
    return (
      <div className="question-bank-page qb-state-page">
        <section className="qb-state">
          <LoaderCircle
            className="qb-spin"
            size={32}
          />

          <h1>Preparing Question Bank</h1>

          <p>
            Loading syllabus filters,
            published questions and
            practice history…
          </p>
        </section>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="question-bank-page qb-state-page">
        <section className="qb-state error">
          <AlertTriangle size={32} />

          <h1>Question Bank unavailable</h1>

          <p>
            {error ||
              "The Question Bank workspace could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      </div>
    );
  }

  if (session) {
    return (
      <div className="question-bank-page">
        {error && (
          <div className="qb-inline-error">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <PracticeWorkspace
          session={session}
          activeIndex={activeIndex}
          pendingOptionId={pendingOptionId}
          answering={answering}
          completing={completing}
          onSelectOption={setPendingOptionId}
          onSubmitAnswer={submitAnswer}
          onMove={moveTo}
          onComplete={finishPractice}
          onExit={exitPractice}
        />
      </div>
    );
  }

  const correctRate =
    workspace.summary.attemptedQuestions === 0
      ? 0
      : Math.round(
          (
            workspace.summary.correctAnswers /
            workspace.summary.attemptedQuestions
          ) *
            100,
        );

  return (
    <div className="question-bank-page">
      <header className="qb-hero">
        <div>
          <span className="qb-eyebrow">
            <Sparkles size={14} />
            PRACTICE SYSTEM
          </span>

          <h1>
            Train concepts.
            <strong>
              {" "}Verify every answer.
            </strong>
          </h1>

          <p>
            Filter the active syllabus,
            bookmark important questions and
            run evaluated MCQ practice with
            protected answers, explanations
            and real performance history.
          </p>
        </div>

        <section className="qb-hero-card">
          <span>
            <Library size={27} />
          </span>

          <small>PUBLISHED QUESTIONS</small>

          <strong>
            {workspace.summary.totalQuestions}
          </strong>

          <p>
            {workspace.syllabusVersion.programme.name}
          </p>
        </section>
      </header>

      {error && (
        <div className="qb-inline-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <section className="qb-metrics">
        <Metric
          icon={<Library size={19} />}
          label="QUESTION BANK"
          value={`${workspace.summary.totalQuestions}`}
          detail="Published for active syllabus"
        />

        <Metric
          icon={<Bookmark size={19} />}
          label="BOOKMARKED"
          value={`${workspace.summary.bookmarkedQuestions}`}
          detail="Saved for focused practice"
        />

        <Metric
          icon={<ListChecks size={19} />}
          label="PRACTICE SESSIONS"
          value={`${workspace.summary.completedSessionCount}`}
          detail="Completed sessions"
        />

        <Metric
          icon={<Target size={19} />}
          label="ATTEMPTED"
          value={`${workspace.summary.attemptedQuestions}`}
          detail={`${workspace.summary.correctAnswers} correct answers`}
        />

        <Metric
          icon={<Gauge size={19} />}
          label="AVERAGE ACCURACY"
          value={`${workspace.summary.averageAccuracy}%`}
          detail={`${correctRate}% overall correct rate`}
        />

        <Metric
          icon={<Trophy size={19} />}
          label="TOTAL SCORE"
          value={`${workspace.summary.totalScore}`}
          detail={formatDuration(
            workspace.summary.totalDurationSeconds,
          )}
        />
      </section>

      <section className="qb-main-layout">
        <aside className="qb-sidebar">
          <Panel
            eyebrow="FILTERS"
            title="Build your set"
            action={<Filter size={18} />}
          >
            <div className="qb-filters">
              <label>
                <span>Search</span>

                <div>
                  <Search size={15} />

                  <input
                    value={filters.search}
                    placeholder="Question or code"
                    onChange={(event) =>
                      updateFilter(
                        "search",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </label>

              <label>
                <span>Subject</span>

                <select
                  value={filters.subjectId}
                  onChange={(event) =>
                    updateFilter(
                      "subjectId",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    All subjects
                  </option>

                  {syllabusSubjects.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.subjectId}
                      >
                        {item.subject.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>Chapter</span>

                <select
                  value={filters.chapterId}
                  disabled={!filters.subjectId}
                  onChange={(event) =>
                    updateFilter(
                      "chapterId",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    All chapters
                  </option>

                  {availableChapters.map(
                    (chapter) => (
                      <option
                        key={chapter.id}
                        value={chapter.id}
                      >
                        {chapter.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>Topic</span>

                <select
                  value={filters.topicId}
                  disabled={!filters.chapterId}
                  onChange={(event) =>
                    updateFilter(
                      "topicId",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    All topics
                  </option>

                  {availableTopics.map(
                    (topic) => (
                      <option
                        key={topic.id}
                        value={topic.id}
                      >
                        {topic.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>Difficulty</span>

                <select
                  value={filters.difficulty}
                  onChange={(event) =>
                    updateFilter(
                      "difficulty",
                      event.target.value as
                        QuestionFilters["difficulty"],
                    )
                  }
                >
                  <option value="">
                    All difficulties
                  </option>
                  <option value="EASY">
                    Easy
                  </option>
                  <option value="MEDIUM">
                    Medium
                  </option>
                  <option value="HARD">
                    Hard
                  </option>
                </select>
              </label>

              <label className="qb-checkbox">
                <input
                  type="checkbox"
                  checked={filters.bookmarkedOnly}
                  onChange={(event) =>
                    updateFilter(
                      "bookmarkedOnly",
                      event.target.checked,
                    )
                  }
                />

                <span>
                  Bookmarked questions only
                </span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setFilters(emptyFilters)
                }
              >
                <RefreshCw size={14} />
                Reset filters
              </button>
            </div>
          </Panel>

          <Panel
            eyebrow="NEW PRACTICE"
            title="Start a session"
            action={<Play size={18} />}
          >
            <form
              className="qb-practice-form"
              onSubmit={startPractice}
            >
              <label>
                <span>Session name</span>

                <input
                  value={practiceName}
                  placeholder="Focused practice"
                  maxLength={200}
                  onChange={(event) =>
                    setPracticeName(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Number of questions
                </span>

                <select
                  value={practiceCount}
                  onChange={(event) =>
                    setPracticeCount(
                      Number(event.target.value),
                    )
                  }
                >
                  {[5, 10, 12, 20].map(
                    (count) => (
                      <option
                        key={count}
                        value={count}
                      >
                        {count}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <p>
                The session uses the
                filters selected above.
                When fewer questions match,
                every eligible question is used.
              </p>

              <button
                type="submit"
                className="qb-primary-button"
                disabled={creating}
              >
                {creating ? (
                  <LoaderCircle
                    className="qb-spin"
                    size={16}
                  />
                ) : (
                  <Play size={16} />
                )}
                Start Practice
              </button>
            </form>
          </Panel>
        </aside>

        <div className="qb-catalogue">
          <Panel
            eyebrow="CATALOGUE"
            title="Published questions"
            action={
              <span className="qb-count-tag">
                {questionsLoading
                  ? "Loading"
                  : `${questions.length} shown`}
              </span>
            }
          >
            {questionsLoading ? (
              <div className="qb-list-loading">
                <LoaderCircle
                  className="qb-spin"
                  size={25}
                />
              </div>
            ) : questions.length === 0 ? (
              <EmptyState
                icon={<Search size={31} />}
                title="No matching questions"
                detail="Change the subject, chapter, topic, difficulty or bookmark filters."
              />
            ) : (
              <div className="qb-question-list">
                {questions.map(
                  (question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      selected={
                        selectedQuestion?.id ===
                        question.id
                      }
                      onSelect={() =>
                        setSelectedQuestionId(
                          question.id,
                        )
                      }
                      onBookmark={() => {
                        void toggleBookmark(
                          question,
                        );
                      }}
                    />
                  ),
                )}
              </div>
            )}
          </Panel>
        </div>

        <aside className="qb-preview-column">
          <Panel
            eyebrow="QUESTION PREVIEW"
            title="Protected answer view"
            action={<Layers3 size={18} />}
          >
            <QuestionPreview
              question={selectedQuestion}
              onBookmark={() => {
                if (selectedQuestion) {
                  void toggleBookmark(
                    selectedQuestion,
                  );
                }
              }}
              onPractice={() => {
                void startPractice();
              }}
            />
          </Panel>

          <Panel
            eyebrow="RECENT ACTIVITY"
            title="Practice history"
            action={<Clock3 size={18} />}
          >
            {workspace.recentSessions.length === 0 ? (
              <EmptyState
                icon={<ListChecks size={29} />}
                title="No practice history"
                detail="Completed and active sessions will appear here."
              />
            ) : (
              <div className="qb-session-list">
                {workspace.recentSessions.map(
                  (recent) => (
                    <SessionRow
                      key={recent.id}
                      session={recent}
                      onOpen={() => {
                        void openSession(recent);
                      }}
                    />
                  ),
                )}
              </div>
            )}
          </Panel>
        </aside>
      </section>
    </div>
  );
}
