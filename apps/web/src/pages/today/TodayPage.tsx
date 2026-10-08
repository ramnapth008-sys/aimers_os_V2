import { useAuth } from "@aimers/auth";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleCheck,
  Clock3,
  Leaf,
  LoaderCircle,
  NotebookPen,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  completeStudySession,
  startStudySession,
} from "../planner/planner.service";
import { buildTodayModel, type TodayWorkspace } from "./today.model";
import { getTodayWorkspace } from "./today.service";
import "./today.css";

function formatMinutes(minutes: number) {
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`
    : `${minutes}m`;
}

export function TodayPage() {
  const { apiFetch, user } = useAuth();
  const [workspace, setWorkspace] = useState<TodayWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => new Date());
  const requestId = useRef(0);
  const load = useCallback(
    async (refresh = false) => {
      const id = ++requestId.current;
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        const next = await getTodayWorkspace(apiFetch);
        if (id === requestId.current) {
          setWorkspace(next);
          setNow(new Date());
        }
      } catch (caught) {
        if (id === requestId.current)
          setError(
            caught instanceof Error
              ? caught.message
              : "Your study plan could not be loaded.",
          );
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [apiFetch],
  );
  useEffect(() => {
    void load();
    const onReturn = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      requestId.current++;
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const model = useMemo(
    () => (workspace ? buildTodayModel(workspace, now) : null),
    [workspace, now],
  );

  async function handleStudy() {
    if (!workspace || !model || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (model.activeSession) {
        const completed = await completeStudySession(
          apiFetch,
          model.activeSession.id,
        );
        setWorkspace((current) =>
          current
            ? {
                ...current,
                planner: {
                  ...current.planner,
                  sessions: current.planner.sessions.map((session) =>
                    session.id === completed.id ? completed : session,
                  ),
                },
              }
            : current,
        );
        setNotice(
          "Session saved. Take a moment to reflect on what you learned.",
        );
      } else if (model.nextTask) {
        const session = await startStudySession(apiFetch, model.nextTask.id);
        setWorkspace((current) =>
          current
            ? {
                ...current,
                planner: {
                  ...current.planner,
                  sessions: [session, ...current.planner.sessions],
                },
              }
            : current,
        );
        setNotice("Your study session has started.");
      }
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The session could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading || !workspace || !model)
    return (
      <section className="today-state">
        {loading ? (
          <LoaderCircle className="today-spin" size={30} />
        ) : (
          <BookOpen size={30} />
        )}
        <p className="today-eyebrow">YOUR NEXT STEP</p>
        <h1>
          {loading
            ? "Getting your day ready."
            : "Let’s reconnect your study plan."}
        </h1>
        <p>
          {loading
            ? "Bringing your plan and learning progress together."
            : error}
        </p>
        {!loading && (
          <button
            className="today-primary"
            type="button"
            onClick={() => void load()}
          >
            <RefreshCw size={16} /> Try again
          </button>
        )}
        {!loading && (
          <Link to="/planner">
            Open your planner <ArrowUpRight size={15} />
          </Link>
        )}
      </section>
    );

  const { planner, academic, privacy } = workspace;
  const name = (
    user?.displayName?.trim() ||
    user?.firstName?.trim() ||
    "Student"
  ).split(/\s+/)[0];
  const activeTask = model.activeSession?.studyTask;
  const title = model.activeSession
    ? activeTask?.title || "Your focused study session"
    : model.nextTask?.title ||
      model.nextChapter?.chapter.name ||
      "Choose a small next step";
  const subject = model.activeSession
    ? activeTask?.subject?.name
    : model.nextTask
      ? model.nextTask.subject?.name
      : model.nextChapter?.subject.subject.name;
  const minutes =
    model.activeSession?.plannedMinutes ||
    model.nextTask?.estimatedMinutes ||
    model.nextChapter?.chapter.estimatedMinutes;
  const elapsed = model.activeSession?.startedAt
    ? Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(model.activeSession.startedAt).getTime()) /
            1000,
        ),
      )
    : 0;
  const timerLabel = `${Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`;
  const programme =
    academic?.syllabusVersion.programme.name || "Your learning journey";
  const trackingLabel = !privacy
    ? "Status unavailable"
    : privacy.pausedAt
      ? "Paused"
      : privacy.monitoringEnabled
        ? "Enabled in settings"
        : "Off";

  return (
    <div className="today-page">
      <header className="today-intro">
        <div>
          <p className="today-eyebrow">
            <span /> SMALL STEPS. LASTING UNDERSTANDING.
          </p>
          <h1>
            A little progress,
            <br />
            <em>every day.</em>
          </h1>
          <p>Welcome back, {name}. Let’s make your next study session count.</p>
        </div>
        <div className="today-date">
          <span>
            {new Intl.DateTimeFormat("en-IN", {
              timeZone: model.timeZone,
              weekday: "long",
            }).format(now)}
          </span>
          <strong>
            {new Intl.DateTimeFormat("en-IN", {
              timeZone: model.timeZone,
              day: "numeric",
              month: "long",
            }).format(now)}
          </strong>
          <span className="today-programme">
            <BookOpen size={13} />
            {programme}
          </span>
        </div>
      </header>
      {error && (
        <div className="today-message error" role="alert">
          {error}
          <button type="button" onClick={() => void load(true)}>
            Retry
          </button>
        </div>
      )}
      {notice && (
        <div className="today-message" role="status">
          {notice}
        </div>
      )}
      {workspace.unavailable.length > 0 && (
        <div className="today-message" role="status">
          Your plan is available. We couldn’t load{" "}
          {workspace.unavailable.join(", ")}.
          <button type="button" onClick={() => void load(true)}>
            Retry
          </button>
        </div>
      )}

      <div className="today-main-grid">
        <div className="today-main-stack">
          <section
            className="today-next-card"
            aria-labelledby="today-next-title"
          >
            <div className="today-card-top">
              <p className="today-eyebrow">
                <Sparkles size={15} />
                {model.activeSession
                  ? "YOU’RE IN A STUDY SESSION"
                  : "YOUR NEXT STEP"}
              </p>
              <span className="today-step-tag">
                {model.activeSession ? "In progress" : "One thing at a time"}
              </span>
            </div>
            <div className="today-next-body">
              <span className="today-subject-icon">
                <BookOpen size={27} strokeWidth={1.5} />
              </span>
              <div>
                {subject && <p className="today-subject-name">{subject}</p>}
                <h2 id="today-next-title">{title}</h2>
              </div>
            </div>
            <p className="today-next-description">
              {model.activeSession
                ? "Keep this page open while you study. Save the session when you’re ready to stop."
                : model.nextTask?.description ||
                  (model.nextChapter
                    ? "Continue with your syllabus, then check your understanding with a few questions."
                    : "Add a task to your plan or explore your subjects to get started.")}
            </p>
            <div className="today-next-meta">
              <span>
                <Clock3 size={15} />
                {minutes
                  ? `${minutes} min ${model.activeSession || model.nextTask ? "planned" : "estimated"}`
                  : "At your own pace"}
              </span>
              <span>
                <CircleCheck size={15} />
                {model.activeSession || model.nextTask
                  ? "From your study plan"
                  : model.nextChapter
                    ? "From your syllabus"
                    : "You choose the direction"}
              </span>
            </div>
            <div className="today-next-actions">
              {model.activeSession || model.nextTask ? (
                <button
                  className="today-primary"
                  type="button"
                  disabled={busy || refreshing}
                  onClick={() => void handleStudy()}
                >
                  {busy ? (
                    <LoaderCircle className="today-spin" size={17} />
                  ) : model.activeSession ? (
                    <Check size={17} />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                  {busy
                    ? "Saving…"
                    : model.activeSession
                      ? "Finish & save session"
                      : "Start studying"}
                  <ArrowRight size={17} />
                </button>
              ) : (
                <Link
                  className="today-primary"
                  to={model.nextChapter ? "/subjects" : "/planner"}
                >
                  {model.nextChapter ? "Explore subjects" : "Make a study plan"}
                  <ArrowRight size={17} />
                </Link>
              )}
              {model.activeSession ? (
                <strong
                  className="today-session-clock"
                  aria-label={`Session elapsed ${timerLabel}`}
                >
                  {timerLabel}
                  <small>elapsed</small>
                </strong>
              ) : (
                <Link className="today-text-link" to="/planner">
                  Adjust my plan <ArrowUpRight size={15} />
                </Link>
              )}
            </div>
            <div className="today-card-note">
              <Leaf size={14} />
              {model.activeSession
                ? "Time records your session. Practice checks your understanding."
                : "A manageable step is a good place to start."}
            </div>
          </section>

          <section
            className="today-plan-card"
            aria-labelledby="today-plan-title"
          >
            <header className="today-section-heading">
              <div>
                <p className="today-eyebrow">A PLAN THAT FITS YOUR DAY</p>
                <h2 id="today-plan-title">Today, at a glance</h2>
              </div>
              <Link to="/planner">
                Full plan <ArrowUpRight size={14} />
              </Link>
            </header>
            {model.queue.length === 0 ? (
              <div className="today-empty">
                <CircleCheck size={24} />
                <div>
                  <strong>A little room to plan.</strong>
                  <p>
                    No scheduled tasks for today. Choose what you want to work
                    on.
                  </p>
                </div>
                <Link to="/planner">
                  Add a task <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <ol className="today-task-list">
                {model.queue.slice(0, 3).map((task, index) => (
                  <li
                    key={task.id}
                    className={task.status === "COMPLETED" ? "completed" : ""}
                  >
                    <span className="today-task-number">
                      {task.status === "COMPLETED" ? (
                        <Check size={15} />
                      ) : (
                        (index + 1).toString().padStart(2, "0")
                      )}
                    </span>
                    <div>
                      <Link to="/planner">{task.title}</Link>
                      <small>
                        {task.type.toLowerCase().replaceAll("_", " ")}
                        {task.subject ? ` · ${task.subject.name}` : ""}
                      </small>
                    </div>
                    <span className="today-task-duration">
                      {task.status === "COMPLETED"
                        ? "Done"
                        : `${task.estimatedMinutes} min`}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <footer>
              <span>
                {model.completedToday.length} task
                {model.completedToday.length === 1 ? "" : "s"} completed today
              </span>
              <Link to="/planner">
                {model.queue.length > 3
                  ? `${model.queue.length - 3} more in your plan`
                  : "Make space for a break"}
                <ArrowRight size={13} />
              </Link>
            </footer>
          </section>

          <section className="today-tool-row" aria-label="Quick study tools">
            <Link to="/notes">
              <NotebookPen size={19} />
              <div>
                <strong>Capture a thought</strong>
                <span>Keep your notes together</span>
              </div>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/question-bank">
              <CircleCheck size={19} />
              <div>
                <strong>Check understanding</strong>
                <span>Try a few practice questions</span>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          </section>
        </div>

        <aside className="today-side-stack">
          <section
            className="today-progress-card"
            aria-labelledby="today-progress-title"
          >
            <p className="today-eyebrow">WHAT WE KNOW</p>
            <h2 id="today-progress-title">
              Your progress,
              <br />
              with perspective.
            </h2>
            <dl>
              <div>
                <dt>Study time today</dt>
                <dd>{formatMinutes(planner.activity.todayMinutes)}</dd>
                <small>From saved study sessions</small>
              </div>
              <div>
                <dt>Syllabus covered</dt>
                <dd>
                  {model.progress === null
                    ? "Unavailable"
                    : `${model.progress}%`}
                </dd>
                <small>
                  {academic
                    ? `${academic.summary.completedChapters} of ${academic.summary.chapterCount} chapters completed`
                    : "Reconnect subjects to see progress"}
                </small>
                {model.progress !== null && (
                  <div
                    className="today-progress-track"
                    role="progressbar"
                    aria-label="Recorded syllabus coverage"
                    aria-valuenow={model.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${model.progress}%` }} />
                  </div>
                )}
              </div>
              <div>
                <dt>Practice accuracy</dt>
                <dd>
                  {!workspace.mockTests
                    ? "Unavailable"
                    : model.accuracy === null
                      ? "Not checked yet"
                      : `${model.accuracy}%`}
                </dd>
                <small>
                  {model.attempted
                    ? `Across ${model.attempted} attempted mock-test questions`
                    : "A practice test gives us a starting point"}
                </small>
              </div>
            </dl>
            {model.reviewName && (
              <Link className="today-review-link" to="/memory-engine">
                <RefreshCw size={15} />
                <span>
                  Ready to revisit: <strong>{model.reviewName}</strong>
                </span>
                <ArrowUpRight size={14} />
              </Link>
            )}
            <Link className="today-text-link" to="/analytics">
              Explore my progress <ArrowRight size={15} />
            </Link>
          </section>
          <section className="today-companion-card">
            <div className="today-companion-symbol">
              <Sparkles size={23} strokeWidth={1.4} />
            </div>
            <p className="today-eyebrow">YOUR AI COMPANION</p>
            <h2>
              You don’t have to
              <br />
              figure it out alone.
            </h2>
            <p>
              Bring a doubt, a difficult day, or a question about what comes
              next.
            </p>
            <Link to="/ai-mentor">
              Let’s talk <ArrowUpRight size={16} />
            </Link>
          </section>
          <Link className="today-privacy-link" to="/settings">
            <ShieldCheck size={16} />
            <div>
              <strong>Activity tracking: {trackingLabel}</strong>
              <span>Review what Aimers can access</span>
            </div>
            <ArrowUpRight size={14} />
          </Link>
        </aside>
      </div>
      <footer className="today-page-footer">
        <span>
          <Leaf size={14} /> Your pace. Your path.
        </span>
        <button
          type="button"
          disabled={refreshing || busy}
          onClick={() => void load(true)}
        >
          <RefreshCw className={refreshing ? "today-spin" : ""} size={14} />
          {refreshing ? "Refreshing…" : "Refresh progress"}
        </button>
      </footer>
    </div>
  );
}
