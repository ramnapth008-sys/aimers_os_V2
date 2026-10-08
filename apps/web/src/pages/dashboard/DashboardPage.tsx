import { useAuth } from "@aimers/auth";
import { ArrowRight, BookOpen, BrainCircuit, CalendarCheck2, ClipboardCheck, Clock3, Flame, Layers3, LoaderCircle, RefreshCw, Sparkles, Target, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAcademicWorkspace } from "../subjects/subjects.service";
import { getPlannerWorkspace } from "../planner/planner.service";
import { getMockTestWorkspace } from "../mock-tests/mock-tests.service";
import type { AcademicWorkspace } from "../subjects/subjects.types";
import type { PlannerWorkspace, StudyTask } from "../planner/planner.types";
import type { MockTestWorkspace } from "../mock-tests/mock-tests.types";
import "./dashboard-v3.css";

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }
function duration(m: number) { return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}`.trim() : `${m}m`; }

export function DashboardPage() {
  const { apiFetch, user } = useAuth();
  const [academic, setAcademic] = useState<AcademicWorkspace | null>(null);
  const [planner, setPlanner] = useState<PlannerWorkspace | null>(null);
  const [tests, setTests] = useState<MockTestWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    setNotice("");
    try {
      const results = await Promise.allSettled([
        getAcademicWorkspace(apiFetch),
        getPlannerWorkspace(apiFetch),
        getMockTestWorkspace(apiFetch),
      ] as const);
      const [academicResult, plannerResult, testsResult] = results;
      setAcademic(academicResult.status === "fulfilled" ? academicResult.value : null);
      setPlanner(plannerResult.status === "fulfilled" ? plannerResult.value : null);
      setTests(testsResult.status === "fulfilled" ? testsResult.value : null);
      if (results.every((result) => result.status === "rejected")) {
        setError("Learning data is temporarily unavailable. Check your connection and retry.");
      } else if (results.some((result) => result.status === "rejected")) {
        setNotice("Some progress data is unavailable. Your available learning tools still work.");
      }
    } catch {
      setError("Unable to load the dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiFetch]);

  useEffect(() => { void load(); }, [load]);

  const subjects = useMemo(() => {
    if (!academic) return [];
    const byChapter = new Map(academic.chapterProgress.map(p => [p.chapterId, p.completionPercent]));
    return academic.syllabusVersion.subjects.map(s => {
      const chapters = s.units.flatMap(u => u.chapters);
      const percent = chapters.length ? clamp(chapters.reduce((sum, ch) => sum + (byChapter.get(ch.id) ?? 0), 0) / chapters.length) : 0;
      return { id: s.id, name: s.subject.name, percent, chapters };
    });
  }, [academic]);

  const session = planner?.sessions.find(s => s.status === "ACTIVE");
  const openTasks = planner?.tasks.filter(t => t.status === "IN_PROGRESS" || t.status === "TODO") ?? [];
  const sortedTasks = [...openTasks].sort((a, b) => {
    const priority: Record<StudyTask["priority"], number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (a.status === "IN_PROGRESS" ? -1 : 0) - (b.status === "IN_PROGRESS" ? -1 : 0) || priority[a.priority] - priority[b.priority];
  });
  const nextTask = sortedTasks[0] ?? null;
  const chapters = subjects.flatMap(s => s.chapters.map(c => ({ ...c, subject: s.name })));
  const progressMap = new Map(academic?.chapterProgress.map(p => [p.chapterId, p]) ?? []);
  const nextChapter = chapters
    .filter(c => (progressMap.get(c.id)?.completionPercent ?? 0) < 100)
    .sort((a,b) => Number((progressMap.get(b.id)?.completionPercent ?? 0) > 0) - Number((progressMap.get(a.id)?.completionPercent ?? 0) > 0))[0];
  const nextTitle = session?.studyTask?.title ?? nextTask?.title ?? (nextChapter ? `${nextChapter.subject} · ${nextChapter.name}` : "Choose your next chapter");
  const nextDetail = session ? "Your study session is in progress" : nextTask ? `${nextTask.type.replaceAll("_", " ").toLowerCase()} · ${nextTask.estimatedMinutes} min planned` : nextChapter ? `${nextChapter.topics.length} topics · ${clamp(progressMap.get(nextChapter.id)?.completionPercent ?? 0)}% completed` : "Explore subjects to start learning";
  const nextPath = session || nextTask ? "/planner" : "/subjects";
  const totalTasks = planner?.tasks.filter(t => t.status !== "CANCELLED").length ?? 0;
  const completedTasks = planner?.tasks.filter(t => t.status === "COMPLETED").length ?? 0;
  const progress = totalTasks ? clamp(completedTasks / totalTasks * 100) : 0;
  const attempts = tests?.attempts.reduce((n, t) => n + t.attemptedQuestions, 0) ?? 0;
  const correct = tests?.attempts.reduce((n,t) => n + t.correctAnswers, 0) ?? 0;
  const accuracy = attempts ? clamp(correct / attempts * 100) : null;
  const name = user?.firstName?.trim() || user?.displayName?.trim()?.split(/\s+/)[0] || "Student";
  const weak = tests?.weakTopics[0];
  const highlight = weak ? `Try reviewing ${weak.topic} in ${weak.subject}.` : "Ask about a difficult concept or request a study plan.";

  if (loading) return <main className="student-v3-state"><LoaderCircle className="student-v3-spinner" size={30}/><h1>Preparing your learning space</h1><p>Connecting your study plan and academic progress…</p></main>;
  if (error && !academic && !planner && !tests) return <main className="student-v3-state"><Zap size={30}/><h1>Study dashboard unavailable</h1><p>{error}</p><button onClick={() => void load()}><RefreshCw size={17}/> Try again</button></main>;

  return <main className="student-v3" aria-label="Student dashboard">
    <div className="student-v3-heading">
      <div><span className="student-v3-eyebrow">MY LEARNING SPACE</span><h1>Make progress today, {name}.</h1></div>
      <button type="button" aria-label="Refresh dashboard data" disabled={refreshing} onClick={() => void load(true)}><RefreshCw size={17} className={refreshing ? "student-v3-spinner" : ""}/></button>
    </div>
    {notice && <p className="student-v3-notice" role="status">{notice}</p>}
    <div className="student-v3-grid">
      <section className="student-v3-glass student-v3-hero">
        <span className="student-v3-eyebrow"><Sparkles size={14}/> NEXT UP</span>
        <div className="student-v3-hero-copy">
          <span className="student-v3-kicker">{session ? "SESSION IN PROGRESS" : "PICK UP WHERE YOU LEFT OFF"}</span>
          <h2>{nextTitle}</h2><p>{nextDetail}</p>
        </div>
        <div className="student-v3-buttons">
          <Link className="student-v3-primary" to={nextPath}>{session ? "Resume session" : "Continue learning"} <ArrowRight size={17}/></Link>
          <Link className="student-v3-secondary" to="/subjects"><BookOpen size={16}/> Browse subjects</Link>
        </div>
        <span className="student-v3-orb" aria-hidden="true"><BrainCircuit size={90}/></span>
      </section>
      <section className="student-v3-glass student-v3-plan">
        <div className="student-v3-card-heading"><span className="student-v3-icon"><CalendarCheck2 size={18}/></span><div><h2>Study plan</h2><p>Your overall task progress</p></div></div>
        <div className="student-v3-plan-value"><strong>{completedTasks}<small> / {totalTasks}</small></strong><span>{progress}% done</span></div>
        <div className="student-v3-track" role="progressbar" aria-label="Study plan progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{width:`${progress}%`}}/></div>
        <p className="student-v3-plan-extra">{totalTasks ? `${Math.max(0,totalTasks-completedTasks)} tasks remaining` : "No tasks planned yet"}</p>
        <Link className="student-v3-card-link" to="/planner">Open planner <ArrowRight size={15}/></Link>
      </section>
      <section className="student-v3-glass student-v3-subjects">
        <div className="student-v3-card-heading"><span className="student-v3-icon"><Layers3 size={18}/></span><div><h2>Subjects</h2><p>Your syllabus at a glance</p></div><Link className="student-v3-corner-link" to="/subjects" aria-label="Open all subjects"><ArrowRight size={17}/></Link></div>
        {subjects.length ? <div className="student-v3-subject-list">{subjects.slice(0,3).map(s => <div key={s.id} className="student-v3-subject"><div><span>{s.name}</span><strong>{s.percent}%</strong></div><div className="student-v3-track"><span style={{width:`${s.percent}%`}}/></div></div>)}</div> : <p className="student-v3-empty">Subject progress will appear once your syllabus is available.</p>}
      </section>
      <section className="student-v3-glass student-v3-mentor">
        <div className="student-v3-card-heading"><span className="student-v3-icon"><Sparkles size={18}/></span><div><h2>AI Mentor</h2><p>A little help, right when you need it</p></div></div>
        <p className="student-v3-mentor-idea">{highlight}</p>
        <Link to="/ai-mentor" className="student-v3-mentor-action">Ask AIMERS <ArrowRight size={17}/></Link>
      </section>
      <section className="student-v3-glass student-v3-launch">
        <div className="student-v3-card-heading"><span className="student-v3-icon"><Zap size={18}/></span><div><h2>Quick launch</h2><p>Everything one tap away</p></div></div>
        <div className="student-v3-actions">
          <Link to="/mock-tests"><ClipboardCheck size={18}/>Mock tests</Link>
          <Link to="/question-bank"><Target size={18}/>Questions</Link>
          <Link to="/flashcards"><Layers3 size={18}/>Flashcards</Link>
          <Link to="/notes"><BookOpen size={18}/>Notes</Link>
          <Link to="/research-ai"><BrainCircuit size={18}/>Research</Link>
          <Link to="/planner"><CalendarCheck2 size={18}/>Planner</Link>
        </div>
      </section>
    </div>
    <div className="student-v3-stat-strip" aria-label="Learning summary">
      <span><Flame size={15}/><strong>{planner?.activity.studyStreakDays ?? "—"}</strong> day streak</span>
      <span><Clock3 size={15}/><strong>{planner ? duration(planner.activity.todayMinutes) : "—"}</strong> studied today</span>
      <span><Target size={15}/><strong>{accuracy === null ? "—" : `${accuracy}%`}</strong> test accuracy</span>
      <span><ClipboardCheck size={15}/><strong>{tests ? attempts : "—"}</strong> questions attempted</span>
      <Link to="/analytics">Full progress <ArrowRight size={15}/></Link>
    </div>
  </main>;
}
