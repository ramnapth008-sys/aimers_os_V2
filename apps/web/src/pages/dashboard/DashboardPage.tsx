import { useAuth } from "@aimers/auth";
import { ArrowRight, BookOpen, CalendarCheck2, CheckCircle2, LoaderCircle, Play, RefreshCw, Sparkles, Video, ListTodo, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAcademicWorkspace } from "../subjects/subjects.service";
import { getPlannerWorkspace } from "../planner/planner.service";
import { getDigitalActivityWorkspace } from "../digital-activity/digital-activity.service";
import type { AcademicWorkspace } from "../subjects/subjects.types";
import type { PlannerWorkspace } from "../planner/planner.types";
import type { DigitalActivityWorkspace } from "../digital-activity/digital-activity.types";
import "./dashboard-v5.css";
import { usePwLectureSync } from "./usePwLectureSync";

const percent = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
function duration(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Not tracked";
  const m = Math.round(Math.max(0, value) / 60);
  return m >= 60 ? Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m" : m + "m";
}
export function DashboardPage() {
  const { apiFetch } = useAuth();
  const pwSync = usePwLectureSync();
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
  const nextLink = activeSession || nextTask ? "/planner" : nextChapter ? "/subjects?chapter=" + encodeURIComponent(nextChapter.chapter.id) : "/subjects";
  const lecture = pwSync.saved ?? activity?.overview.recentLectures[0];
  const currentLive = pwSync.enabled ? pwSync.live : null;
  const lectureMeta = lecture?.metadata;
  const metric = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? String(Math.round(value)) : "—";
  const hms = (sec: number | null | undefined) => sec == null ? "—" : Math.floor(sec/3600) + ":" + String(Math.floor(sec%3600/60)).padStart(2,"0") + ":" + String(Math.floor(sec%60)).padStart(2,"0");
  const hasPlan = Boolean(planner?.plans.length || planner?.tasks.length);
  const noTasks = Boolean(planner && planned.length === 0);
  const hasLecture = Boolean(lecture);
  const isNewStudent = Boolean(academic && !activeSession && !hasPlan && !hasLecture);
  const monitoring = Boolean(activity?.overview.monitoring.enabled && !activity.overview.monitoring.pausedAt);
  if (loading) return <main className="v5-state"><LoaderCircle className="v5-spin" size={28}/><h1>Preparing your learning space</h1></main>;
  if (error && !academic && !planner && !activity) return <main className="v5-state"><h1>Dashboard unavailable</h1><p>{error}</p><button onClick={() => void load()}><RefreshCw size={16}/> Try again</button></main>;
  return <main className="v5-home" aria-label="AIMERS student dashboard">
    <header className="v5-heading"><div><span>YOUR LEARNING SPACE</span><h1>{isNewStudent ? "Ready for your first study session?" : "One step closer to your goal."}</h1><p>{isNewStudent ? "Choose one chapter, start learning, and let AIMERS guide the next step." : "Focus on what matters today. Everything else can wait."}</p></div><button onClick={() => void load(true)} disabled={refreshing} aria-label="Refresh dashboard"><RefreshCw size={18} className={refreshing ? "v5-spin" : ""}/></button></header>
    {notice && <p className="v5-notice" role="status">{notice}</p>}
    <div className="v5-grid">
      <section className="v5-panel v5-hero"><span className="v5-eyebrow"><span className="v5-dot"/> AIMERS RECOMMENDATION · NOT YOUR PW LECTURE</span><div className="v5-hero-content"><small>Suggested from your AIMERS syllabus · {nextContext}</small><h2>{nextTitle}</h2><p>{activeSession ? "You have an active study session. Return when you're ready." : nextTask ? "Your next study task is ready. Just take one step." : "A good place to begin. We'll help you build momentum."}</p></div><div className="v5-hero-actions"><Link to={nextLink} className="v5-primary"><Play size={15} fill="currentColor"/>{activeSession ? "Resume session" : nextChapter && !nextTask ? "Open this chapter" : "Start learning"} <ArrowRight size={16}/></Link><Link to="/subjects" className="v5-subtle-link">Browse subjects <ArrowRight size={15}/></Link></div><BookOpen className="v5-hero-watermark" size={124} strokeWidth={.7} aria-hidden="true"/></section>
      <section className="v5-panel v5-today"><div className="v5-card-heading"><span className="v5-icon"><CalendarCheck2 size={18}/></span><div><h2>Today</h2><p>Keep your plan manageable</p></div></div><div className="v5-today-body">{planner ? hasPlan ? <><strong>{planner.summary.completedTaskCount}</strong><span>tasks completed</span><p>{planned.length ? "Next up: " + planned[0].title : "Your plan is clear for now."}</p></> : <div className="v5-setup"><strong>Make a simple plan</strong><p>Choose what to study and when. Start with just one task.</p><span>About 2 minutes to get started</span></div> : <p>Your study plan is temporarily unavailable.</p>}</div><Link className="v5-card-action" to="/planner">{hasPlan ? "View study plan" : "Create study plan"} <ArrowRight size={15}/></Link></section>
      <section className="v5-panel v5-lecture"><div className="v5-card-heading"><span className="v5-icon"><Video size={18}/></span><div><h2>Learning activity</h2><p>External lecture observations</p></div><Link to="/digital-activity" className="v5-corner" aria-label="Detailed activity"><ArrowRight size={18}/></Link></div>
      {(currentLive || lecture) ? <><div className="v5-sync-indicator" role="status">{pwSync.enabled ? pwSync.state : "Saved lecture"}</div><div className="v5-lecture-details"><small>{currentLive?.platform ?? lecture?.platformName}{!currentLive && lecture?.courseTitle ? " · " + lecture.courseTitle : ""}</small><h3>{currentLive?.title ?? lecture?.lectureTitle}</h3>{(currentLive?.platform ?? lecture?.platformName)==="pw.live" && <p className="v5-source-disclaimer">PW video detected · Chapter and topic not yet matched to your AIMERS syllabus. Playback does not automatically confirm topic mastery.</p>}</div><div className="v5-progress-caption"><span>Playback position (not mastery)</span><strong>{currentLive ? hms(currentLive.positionSeconds) : hms(lecture?.playbackPositionSeconds)}</strong></div><div className="v5-track"><span style={{width: percent((currentLive?.positionSeconds ?? lecture?.playbackPositionSeconds ?? 0) / Math.max(1,currentLive?.videoLengthSeconds ?? lecture?.totalDurationSeconds ?? 1) * 100) + "%"}}/></div><div className="v5-lecture-metrics"><div><strong>{hms(currentLive?.videoLengthSeconds ?? lecture?.totalDurationSeconds)}</strong><small>Video length</small></div><div><strong>{hms(currentLive?.playSeconds ?? lecture?.watchedSeconds)}</strong><small>Playing time</small></div><div><strong>{metric(currentLive?.pauses ?? lectureMeta?.pauseCount)}</strong><small>Pauses</small></div></div><p className="v5-lecture-foot">Elapsed: {hms(currentLive?.elapsedSeconds ?? (typeof lectureMeta?.elapsedSeconds === "number" ? lectureMeta.elapsedSeconds : null))} · Rewinds: {metric(currentLive?.rewinds ?? lectureMeta?.rewindCount)}{!currentLive && lecture?.lastProgressAt ? " · Saved " + new Date(lecture.lastProgressAt).toLocaleTimeString() : ""}</p></> : <div className="v5-empty"><BookOpen size={21}/><strong>Your lectures, in one place</strong><p>{!activity ? "Activity information is unavailable." : !monitoring ? "Optional activity tracking is currently off. You can connect supported learning sources when you choose." : "Your connected lectures will appear here when available."}</p><Link to="/digital-activity">{monitoring ? "See connected activity" : "Explore learning connections"} <ArrowRight size={14}/></Link></div>}
        <div className="v5-lecture-connect">
          {pwSync.enabled ? <><span className="v5-connection-state">{pwSync.state}{pwSync.error ? " · " + pwSync.error : ""}</span><button type="button" onClick={pwSync.disconnect}>Disconnect account sync</button></>
          : <><label className="v5-consent-check"><input type="checkbox" checked={pwSync.reviewed} onChange={event=>pwSync.setReviewed(event.target.checked)}/> <span>Save lecture measurements (video title, duration, playback position, playing time, elapsed time, pauses, rewinds) to my AIMERS account. I understand this enables digital activity monitoring, lecture progress and cross-device sync, and I can disconnect or revoke consent in Settings. No history, messages or social feeds are included.</span></label><button type="button" onClick={()=>void pwSync.connect()} disabled={pwSync.busy || !pwSync.reviewed}>{pwSync.busy ? "Connecting…" : "Connect and save PW lectures"}</button></>}
          {!pwSync.configured && <small>Set VITE_AIMERS_LECTURE_EXTENSION_ID to the installed extension's ID.</small>}
          {pwSync.error && <small role="alert">{pwSync.error}</small>}
        </div>
      </section>
      <section className="v5-panel v5-backlog"><div className="v5-card-heading"><span className="v5-icon"><ListTodo size={18}/></span><div><h2>Backlog & next steps</h2><p>What needs your attention</p></div><Link className="v5-corner" to="/planner" aria-label="View backlog"><ArrowRight size={18}/></Link></div>{planner ? <><div className="v5-backlog-summary"><strong>{overdue.length}</strong><span>overdue {overdue.length === 1 ? "task" : "tasks"}</span></div><div className="v5-task-list">{(overdue.length ? overdue : planned).slice(0,2).map(item => <Link key={item.id} className="v5-task" to="/planner"><span className="v5-task-mark"/><span><strong>{item.title}</strong><small>{item.chapter?.name || item.subject?.name || (overdue.includes(item) ? "Overdue" : "Planned")}</small></span><ArrowRight size={14}/></Link>)}{!planned.length && <p className="v5-clear"><CheckCircle2 size={16}/> {hasPlan ? "All planned tasks are complete or not started yet." : "No plan yet. Create one small study task."}</p>}</div><Link to="/planner" className="v5-card-action">{planned.length ? "Continue next task" : hasPlan ? "Review your plan" : "Create your first plan"} <ArrowRight size={15}/></Link></> : <div className="v5-empty"><p>Your backlog information is unavailable.</p><Link to="/planner">Open planner <ArrowRight size={14}/></Link></div>}</section>
    </div>
    <footer className="v5-footer"><span><ShieldCheck size={15}/> Connected activity is optional and controlled by you.</span><Link to="/ai-mentor"><Sparkles size={15}/> Ask AIMERS for help <ArrowRight size={14}/></Link><Link to="/digital-activity">Your learning activity <ArrowRight size={14}/></Link></footer>
  </main>;
}
