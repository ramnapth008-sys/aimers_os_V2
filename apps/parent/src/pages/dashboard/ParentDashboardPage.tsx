import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import "./parent-dashboard.css";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: string;
}

const subjects = [
  {
    name: "Physics",
    value: 82,
    status: "Strong"
  },
  {
    name: "Chemistry",
    value: 71,
    status: "Improving"
  },
  {
    name: "Biology",
    value: 79,
    status: "Good"
  }
];

const schedule = [
  {
    title: "Physics mock test",
    date: "5 August",
    time: "10:00 AM"
  },
  {
    title: "Mentor progress review",
    date: "7 August",
    time: "6:30 PM"
  },
  {
    title: "Chemistry revision target",
    date: "8 August",
    time: "Daily plan"
  }
];

function ParentMetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: MetricCardProps) {
  return (
    <article
      className={`parent-metric-card parent-tone-${tone}`}
    >
      <header>
        <span>{icon}</span>
        <small>{label}</small>

        <button type="button">
          <ArrowUpRight size={13} />
        </button>
      </header>

      <strong>{value}</strong>
      <p>{detail}</p>

      <footer>
        <TrendingUp size={13} />
        Updated today
      </footer>
    </article>
  );
}

function ParentPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`parent-panel ${className}`}
    >
      <header className="parent-panel-heading">
        <div>
          <h2>{title}</h2>

          {description && (
            <p>{description}</p>
          )}
        </div>

        {action}
      </header>

      {children}
    </article>
  );
}

export function ParentDashboardPage() {
  return (
    <div className="parent-dashboard-page">
      <section className="parent-dashboard-heading">
        <div>
          <span>
            <Sparkles size={14} />
            WEEKLY PARENT SUMMARY
          </span>

          <h1>
            Ram is making steady progress.
          </h1>

          <p>
            Study consistency improved this
            week, while Chemistry still needs
            additional revision.
          </p>
        </div>

        <div>
          <Link to="/reports">
            <FileText size={14} />
            Download report
          </Link>

          <Link to="/alerts">
            <MessageSquareText size={14} />
            View updates
          </Link>
        </div>
      </section>

      <section className="parent-metric-grid">
        <ParentMetricCard
          label="STUDY TIME TODAY"
          value="7h 32m"
          detail="Weekly average: 6h 48m"
          icon={<Clock3 size={17} />}
          tone="blue"
        />

        <ParentMetricCard
          label="AVERAGE ACCURACY"
          value="78%"
          detail="Up 6% this month"
          icon={<Target size={17} />}
          tone="green"
        />

        <ParentMetricCard
          label="STUDY STREAK"
          value="27 days"
          detail="Personal best"
          icon={<Flame size={17} />}
          tone="orange"
        />

        <ParentMetricCard
          label="TASK COMPLETION"
          value="84%"
          detail="21 of 25 tasks completed"
          icon={
            <CheckCircle2 size={17} />
          }
          tone="violet"
        />

        <ParentMetricCard
          label="ATTENTION ITEMS"
          value="3"
          detail="One needs parent awareness"
          icon={
            <AlertTriangle size={17} />
          }
          tone="danger"
        />
      </section>

      <section className="parent-primary-grid">
        <ParentPanel
          title="Weekly Learning Progress"
          description="Study time and academic accuracy"
          action={
            <button type="button">
              This week
            </button>
          }
        >
          <div className="parent-chart-summary">
            <section>
              <small>Total study time</small>
              <strong>47h 36m</strong>
              <span>+5h 12m</span>
            </section>

            <section>
              <small>Questions solved</small>
              <strong>846</strong>
              <span>+128</span>
            </section>

            <section>
              <small>Average accuracy</small>
              <strong>78%</strong>
              <span>+6%</span>
            </section>
          </div>

          <div className="parent-progress-chart">
            <div className="parent-chart-axis">
              <span>10h</span>
              <span>8h</span>
              <span>6h</span>
              <span>4h</span>
              <span>2h</span>
            </div>

            <div className="parent-chart-plot">
              <svg
                viewBox="0 0 700 230"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="parentStudyArea"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity="0.5"
                    />

                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 185 L115 155 L230 165 L345 110 L460 128 L575 75 L700 58 L700 230 L0 230 Z"
                  fill="url(#parentStudyArea)"
                />

                <polyline
                  points="0,185 115,155 230,165 345,110 460,128 575,75 700,58"
                  fill="none"
                  stroke="#9875ff"
                  strokeWidth="4"
                />

                <polyline
                  points="0,205 115,188 230,194 345,161 460,170 575,138 700,118"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                />
              </svg>

              <div>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          <footer className="parent-chart-legend">
            <span>
              <i />
              Study time
            </span>

            <span>
              <i />
              Accuracy trend
            </span>
          </footer>
        </ParentPanel>

        <ParentPanel
          title="Subject Progress"
          description="Current subject mastery"
          action={
            <Link to="/child-progress">
              Full progress
            </Link>
          }
        >
          <div className="parent-subject-score">
            <div className="parent-overall-ring">
              <span>
                <strong>77%</strong>
                <small>Overall</small>
              </span>
            </div>

            <div>
              <strong>
                Good overall momentum
              </strong>

              <p>
                Chemistry needs more regular
                revision to match Physics and
                Biology performance.
              </p>
            </div>
          </div>

          <div className="parent-subject-list">
            {subjects.map((subject) => (
              <section key={subject.name}>
                <header>
                  <span>{subject.name}</span>

                  <strong>
                    {subject.value}%
                  </strong>
                </header>

                <div>
                  <i
                    style={{
                      width: `${subject.value}%`,
                    }}
                  />
                </div>

                <small>{subject.status}</small>
              </section>
            ))}
          </div>
        </ParentPanel>
      </section>

      <section className="parent-secondary-grid">
        <ParentPanel
          title="Recent Academic Updates"
          description="Important progress events"
        >
          <div className="parent-update-list">
            <section>
              <span className="success">
                <CheckCircle2 size={15} />
              </span>

              <div>
                <strong>
                  Biology accuracy improved
                </strong>

                <p>
                  Human Physiology accuracy
                  increased from 69% to 81%.
                </p>

                <small>Today</small>
              </div>
            </section>

            <section>
              <span className="warning">
                <AlertTriangle size={15} />
              </span>

              <div>
                <strong>
                  Chemistry revision pending
                </strong>

                <p>
                  Two Organic Chemistry
                  revision tasks remain.
                </p>

                <small>Yesterday</small>
              </div>
            </section>

            <section>
              <span className="violet">
                <Brain size={15} />
              </span>

              <div>
                <strong>
                  New AI study plan created
                </strong>

                <p>
                  AIMERS adjusted next week's
                  study order.
                </p>

                <small>2 days ago</small>
              </div>
            </section>
          </div>
        </ParentPanel>

        <ParentPanel
          title="Upcoming Schedule"
          description="Important learning events"
          action={
            <Link to="/attendance">
              View calendar
            </Link>
          }
        >
          <div className="parent-schedule-list">
            {schedule.map((item, index) => (
              <section key={item.title}>
                <span>
                  <CalendarDays size={16} />
                </span>

                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {item.date} · {item.time}
                  </small>
                </div>

                <i>{index + 1}</i>
              </section>
            ))}
          </div>
        </ParentPanel>

        <ParentPanel
          title="Mentor Summary"
          description="Academic mentor guidance"
          className="parent-mentor-panel"
          action={<Brain size={18} />}
        >
          <div className="parent-mentor-message">
            <span>
              <Brain size={18} />
            </span>

            <div>
              <strong>
                Weekly mentor note
              </strong>

              <p>
                Ram is consistent and responds
                well to morning study sessions.
                Encourage regular sleep and
                avoid increasing daily pressure.
              </p>
            </div>
          </div>

          <div className="parent-support-actions">
            <Link to="/reports">
              Read full report
              <ArrowRight size={13} />
            </Link>

            <Link to="/alerts">
              View parent alerts
              <ArrowRight size={13} />
            </Link>
          </div>
        </ParentPanel>
      </section>

      <section className="parent-privacy-strip">
        <div>
          <ShieldCheck size={19} />

          <span>
            <strong>
              Student privacy is protected
            </strong>

            <small>
              This portal shows progress
              summaries and academic support
              information. It does not expose
              private conversations, passwords,
              raw browsing history or sensitive
              personal content.
            </small>
          </span>
        </div>

        <Link to="/privacy">
          Review privacy controls
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
