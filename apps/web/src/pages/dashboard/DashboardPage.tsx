import { useAuth } from "@aimers/auth";
import { ArrowRight, BookOpen, CalendarCheck2, CheckCircle2, Clock3, LoaderCircle, Play, RefreshCw, Sparkles, Video, ListTodo, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAcademicWorkspace } from "../subjects/subjects.service";
import { getPlannerWorkspace } from "../planner/planner.service";
import { getDigitalActivityWorkspace } from "../digital-activity/digital-activity.service";
import type { AcademicWorkspace } from "../subjects/subjects.types";
import type { PlannerWorkspace } from "../planner/planner.types";
import type { DigitalActivityWorkspace } from "../digital-activity/digital-activity.types";
import "./dashboard-v5.css";

const percent = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
function duration(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Not tracked";
  const m = Math.round(Math.max(0, value) / 60);
  return m >= 60 ? Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m" : m + "m";
}
export function DashboardPage() {
  const { apiFetch } = useAuth();
  const [academic, setAcademic] = useState<AcademicWorkspace | null>(null);
  const [planner, setPlanner] = useState<PlannerWorkspace | null>(null);
  const [activity, setActivity] = useState<DigitalActivityWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError(""); setNotice("");
    const results = await Promise.allSettled([getAcademicWorkspace(apiFetch), getPlannerWorkspace(apiFetch), getDigitalActivityWorkspace(apiFetch, 7)] as const);
    const [a, p, d] = results;
    setAcademic(a.status === "fulfilled" ? a.value : null);
    setPlanner(p.status === "fulfilled" ? p.value : null);
    setActivity(d.status === "fulfilled" ? d.value : null);
    if (results.every(item => item.status === "rejected")) setError("Learning information could not be loaded. Check your connection.");
    else if (results.some(item => item.status === "rejected")) setNotice("Some information is unavailable. You can still open your learning tools.");
    setLoading(false); setRefreshing(false);
  }, [apiFetch]);
  useEffect(() => { void load(); }, [load]);
  const activeSession = planner?.sessions.find(item => item.status === "ACTIVE");
  const tasks = (planner?.tasks ?? []).filter(item => item.status === "TODO" || item.status === "IN_PROGRESS");
  const priority = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const planned = [...tasks].sort((a,b) => (a.status === "IN_PROGRESS" ? -1 : 0) - (b.status === "IN_PROGRESS" ? -1 : 0) || priority[a.priority] - priority[b.priority]);
  const overdue = planned.filter(task => task.dueAt && new Date(task.dueAt).getTime() < Date.now());
  const nextChapter = academic?.syllabusVersion.subjects.flatMap(s => s.units.flatMap(u => u.chapters.map(ch => ({ chapter: ch, subject: s.subject.name }))))
    .find(item => (academic.chapterProgress.find(p => p.chapterId === item.chapter.id)?.completionPercent ?? 0) < 100);
  const nextTask = planned[0];
  const nextTitle = activeSession?.studyTask?.title || nextTask?.title || nextChapter?.chapter.name || "Choose your first subject";
  const nextContext = activeSession?.chapter?.name || nextTask?.chapter?.name || nextChapter?.subject || "Your learning journey";
  const nextLink = activeSession || nextTask ? "/planner" : "/subjects";
  const lecture = activity?.overview.recentLectures[0];
  const monitoring = Boolean(activity?.overview.monitoring.enabled && !activity.overview.monitoring.pausedAt);
  if (loading) return <main className="v5-state"><LoaderCircle className="v5-spin" size={28}/><h1>Preparing your learning space</h1></main>;
  if (error && !academic && !planner && !activity) return <main className="v5-state"><h1>Dashboard unavailable</h1><p>{error}</p><button onClick={() => void load()}><RefreshCw size={16}/> Try again</button></main>;
  return <main className="v5-home" aria-label="AIMERS student dashboard">
    <header className="v5-heading"><div><span>YOUR LEARNING SPACE</span><h1>One step closer to your goal.</h1><p>Focus on what matters today. Everything else can wait.</p></div><button onClick={() => void load(true)} disabled={refreshing} aria-label="Refresh dashboard"><RefreshCw size={18} className={refreshing ? "v5-spin" : ""}/></button></header>
    {notice && <p className="v5-notice" role="status">{notice}</p>}
    <div className="v5-grid">
      <section className="v5-panel v5-hero"><span className="v5-eyebrow"><span className="v5-dot"/> YOUR NEXT STEP</span><div className="v5-hero-content"><small>{nextContext}</small><h2>{nextTitle}</h2><p>{activeSession ? "You have an active study session. Return when you're ready." : nextTask ? "Your next study task is ready. Just take one step." : "A good place to begin. We'll help you build momentum."}</p></div><div className="v5-hero-actions"><Link to={nextLink} className="v5-primary"><Play size={15} fill="currentColor"/>{activeSession ? "Resume session" : "Start learning"} <ArrowRight size={16}/></Link><Link to="/subjects" className="v5-subtle-link">Browse subjects <ArrowRight size={15}/></Link></div><BookOpen className="v5-hero-watermark" size={124} strokeWidth={.7} aria-hidden="true"/></section>
      <section className="v5-panel v5-today"><div className="v5-card-heading"><span className="v5-icon"><CalendarCheck2 size={18}/></span><div><h2>Today</h2><p>Keep your plan manageable</p></div></div><div className="v5-today-body">{planner ? <><strong>{planner.summary.completedTaskCount}</strong><span>tasks completed</span><p>{planned.length ? "You have " + planned.length + " task(s) to work on." : "No pending tasks right now."}</p></> : <p>Your study plan is temporarily unavailable.</p>}</div><Link className="v5-card-action" to="/planner">{planned.length ? "Open your plan" : "Plan your next step"} <ArrowRight size={15}/></Link></section>
      <section className="v5-panel v5-lecture"><div className="v5-card-heading"><span className="v5-icon"><Video size={18}/></span><div><h2>Learning activity</h2><p>What you studied recently</p></div><Link to="/digital-activity" className="v5-corner" aria-label="Detailed activity"><ArrowRight size={18}/></Link></div>
      {lecture ? <><div className="v5-lecture-details"><small>{lecture.platformName}{lecture.courseTitle ? " · " + lecture.courseTitle : ""}</small><h3>{lecture.lectureTitle}</h3></div><div className="v5-progress-caption"><span>Video progress</span><strong>{percent(lecture.completionPercent)}%</strong></div><div className="v5-track"><span style={{width: percent(lecture.completionPercent) + "%"}}/></div><div className="v5-lecture-metrics"><div><strong>{duration(lecture.totalDurationSeconds)}</strong><small>Video length</small></div><div><strong>{duration(lecture.watchedSeconds)}</strong><small>Watch time</small></div><div><strong>—</strong><small>Pauses</small></div></div><p className="v5-lecture-foot">Rewinds: not tracked · Elapsed time: not tracked</p></> : <div className="v5-empty"><BookOpen size={21}/><strong>No lecture activity to show</strong><p>{!activity ? "Activity information is unavailable." : !monitoring ? "Monitoring is off or paused." : "Your supported lectures will appear here."}</p><Link to="/digital-activity">Open activity settings <ArrowRight size={14}/></Link></div>}
      </section>
      <section className="v5-panel v5-backlog"><div className="v5-card-heading"><span className="v5-icon"><ListTodo size={18}/></span><div><h2>Backlog & next steps</h2><p>What needs your attention</p></div><Link className="v5-corner" to="/planner" aria-label="View backlog"><ArrowRight size={18}/></Link></div>{planner ? <><div className="v5-backlog-summary"><strong>{overdue.length}</strong><span>overdue {overdue.length === 1 ? "task" : "tasks"}</span></div><div className="v5-task-list">{(overdue.length ? overdue : planned).slice(0,2).map(item => <Link key={item.id} className="v5-task" to="/planner"><span className="v5-task-mark"/><span><strong>{item.title}</strong><small>{item.chapter?.name || item.subject?.name || (overdue.includes(item) ? "Overdue" : "Planned")}</small></span><ArrowRight size={14}/></Link>)}{!planned.length && <p className="v5-clear"><CheckCircle2 size={16}/> No pending tasks in your plan.</p>}</div><Link to={planned.length ? "/planner" : "/subjects"} className="v5-card-action">{planned.length ? "Continue next task" : "Explore subjects"} <ArrowRight size={15}/></Link></> : <div className="v5-empty"><p>Your backlog information is unavailable.</p><Link to="/planner">Open planner <ArrowRight size={14}/></Link></div>}</section>
    </div>
    <footer className="v5-footer"><span><ShieldCheck size={15}/> Your study activity is under your control.</span><Link to="/ai-mentor"><Sparkles size={15}/> Ask AIMERS <ArrowRight size={14}/></Link><Link to="/digital-activity">Activity details <ArrowRight size={14}/></Link></footer>
  </main>;
}
