import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  Zap,
} from "lucide-react";

import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import "./staff-dashboard.css";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: string;
}

const students = [
  {
    initials: "AK",
    name: "Akhil Prasad",
    target: "NEET 2027",
    study: "6h 42m",
    accuracy: "78%",
    risk: "High",
  },
  {
    initials: "DR",
    name: "Diya Raj",
    target: "NEET 2027",
    study: "7h 10m",
    accuracy: "84%",
    risk: "Low",
  },
  {
    initials: "SK",
    name: "Sanjay Kumar",
    target: "NEET 2027",
    study: "4h 18m",
    accuracy: "69%",
    risk: "Medium",
  },
  {
    initials: "NM",
    name: "Nayana Menon",
    target: "NEET 2027",
    study: "8h 02m",
    accuracy: "87%",
    risk: "Low",
  },
];

const alerts = [
  {
    title: "Akhil missed two lectures",
    detail:
      "Electrostatics lectures remain incomplete.",
    time: "12 minutes ago",
    tone: "danger",
  },
  {
    title: "Sanjay accuracy decreased",
    detail:
      "Physics accuracy fell by 9% this week.",
    time: "34 minutes ago",
    tone: "warning",
  },
  {
    title: "Diya completed intervention",
    detail:
      "Organic Chemistry revision plan completed.",
    time: "1 hour ago",
    tone: "success",
  },
  {
    title: "Nayana reached 30-day streak",
    detail:
      "New consistency milestone achieved.",
    time: "2 hours ago",
    tone: "violet",
  },
];

const interventions = [
  {
    student: "Akhil Prasad",
    action: "Focus recovery plan",
    progress: 62,
    outcome: "+18% focus",
  },
  {
    student: "Sanjay Kumar",
    action: "Physics accuracy plan",
    progress: 45,
    outcome: "In progress",
  },
  {
    student: "Diya Raj",
    action: "Organic revision queue",
    progress: 100,
    outcome: "+11% accuracy",
  },
];

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: MetricCardProps) {
  return (
    <article
      className={`staff-metric-card staff-tone-${tone}`}
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

function StaffPanel({
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
      className={`staff-panel ${className}`}
    >
      <header className="staff-panel-heading">
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

export function StaffDashboardPage() {
  return (
    <div className="staff-dashboard-page">
      <section className="staff-dashboard-heading">
        <div>
          <span>
            <Sparkles size={14} />
            MONDAY MENTOR BRIEF
          </span>

          <h1>
            Good afternoon, Anjali.
          </h1>

          <p>
            Three students need attention
            and two interventions are due
            for review today.
          </p>
        </div>

        <div>
          <Link to="/reports">
            <FileText size={14} />
            Generate report
          </Link>

          <Link to="/interventions">
            <Zap size={14} />
            New intervention
          </Link>
        </div>
      </section>

      <section className="staff-metric-grid">
        <MetricCard
          label="ASSIGNED STUDENTS"
          value="42"
          detail="38 active this week"
          icon={<Users size={17} />}
          tone="violet"
        />

        <MetricCard
          label="STUDENTS AT RISK"
          value="7"
          detail="3 require immediate action"
          icon={<AlertTriangle size={17} />}
          tone="danger"
        />

        <MetricCard
          label="ACTIVE INTERVENTIONS"
          value="16"
          detail="5 reviews due today"
          icon={<Zap size={17} />}
          tone="blue"
        />

        <MetricCard
          label="AVERAGE ACCURACY"
          value="76.8%"
          detail="Up 4.2% this month"
          icon={<Target size={17} />}
          tone="green"
        />

        <MetricCard
          label="MENTOR RESPONSE"
          value="18m"
          detail="Average response time"
          icon={
            <MessageSquareText size={17} />
          }
          tone="cyan"
        />
      </section>

      <section className="staff-primary-grid">
        <StaffPanel
          title="Assigned Student Overview"
          description="Current learning and risk status"
          action={
            <Link to="/assigned-students">
              View all students
            </Link>
          }
        >
          <div className="student-table">
            <header>
              <span>Student</span>
              <span>Target</span>
              <span>Study Today</span>
              <span>Accuracy</span>
              <span>Risk</span>
              <span />
            </header>

            {students.map((student) => (
              <section key={student.name}>
                <span>
                  <i>{student.initials}</i>

                  <strong>
                    {student.name}
                  </strong>
                </span>

                <span>{student.target}</span>

                <span>
                  <Clock3 size={12} />
                  {student.study}
                </span>

                <strong>
                  {student.accuracy}
                </strong>

                <span>
                  <b
                    className={student.risk.toLowerCase()}
                  >
                    {student.risk}
                  </b>
                </span>

                <Link to="/student-profile">
                  <ArrowRight size={14} />
                </Link>
              </section>
            ))}
          </div>
        </StaffPanel>

        <StaffPanel
          title="Daily Alerts"
          description="AI and system-generated attention items"
          action={
            <Link to="/daily-alerts">
              View all
            </Link>
          }
        >
          <div className="mentor-alert-list">
            {alerts.map((alert) => (
              <section key={alert.title}>
                <span className={alert.tone}>
                  {alert.tone === "success" ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <AlertTriangle size={15} />
                  )}
                </span>

                <div>
                  <strong>
                    {alert.title}
                  </strong>

                  <p>{alert.detail}</p>

                  <small>{alert.time}</small>
                </div>
              </section>
            ))}
          </div>
        </StaffPanel>
      </section>

      <section className="staff-secondary-grid">
        <StaffPanel
          title="Study Performance"
          description="Assigned-student weekly trend"
          action={
            <button type="button">
              This week
            </button>
          }
        >
          <div className="mentor-chart">
            <div className="mentor-chart-axis">
              <span>90%</span>
              <span>75%</span>
              <span>60%</span>
              <span>45%</span>
            </div>

            <div className="mentor-chart-plot">
              <svg
                viewBox="0 0 520 190"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="staffArea"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity="0.48"
                    />

                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 145 L85 129 L170 135 L255 90 L340 102 L425 64 L520 48 L520 190 L0 190 Z"
                  fill="url(#staffArea)"
                />

                <polyline
                  points="0,145 85,129 170,135 255,90 340,102 425,64 520,48"
                  fill="none"
                  stroke="#9b79ff"
                  strokeWidth="4"
                />

                <polyline
                  points="0,165 85,151 170,157 255,132 340,140 425,106 520,96"
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

          <footer className="mentor-chart-legend">
            <span>
              <i />
              Average accuracy
            </span>

            <span>
              <i />
              Study consistency
            </span>
          </footer>
        </StaffPanel>

        <StaffPanel
          title="Academic Attention"
          description="Current pending learning problems"
        >
          <div className="attention-grid">
            <Link to="/missed-lectures">
              <span>
                <BookOpenCheck size={18} />
              </span>

              <div>
                <strong>18</strong>
                <small>
                  Missed lectures
                </small>
              </div>

              <ArrowRight size={14} />
            </Link>

            <Link to="/backlogs">
              <span>
                <Clock3 size={18} />
              </span>

              <div>
                <strong>27</strong>
                <small>
                  Active backlogs
                </small>
              </div>

              <ArrowRight size={14} />
            </Link>

            <Link to="/weak-topics">
              <span>
                <Target size={18} />
              </span>

              <div>
                <strong>36</strong>
                <small>
                  Critical weak topics
                </small>
              </div>

              <ArrowRight size={14} />
            </Link>

            <Link to="/test-performance">
              <span>
                <BarChart3 size={18} />
              </span>

              <div>
                <strong>9</strong>
                <small>
                  Low test scores
                </small>
              </div>

              <ArrowRight size={14} />
            </Link>
          </div>
        </StaffPanel>

        <StaffPanel
          title="Mentor Effectiveness"
          description="Your current support outcomes"
        >
          <div className="mentor-effectiveness">
            <div className="effectiveness-ring">
              <span>
                <strong>88%</strong>
                <small>
                  Mentor score
                </small>
              </span>
            </div>

            <div>
              <section>
                <span>
                  Students improved
                </span>
                <strong>34/42</strong>
              </section>

              <section>
                <span>
                  Intervention success
                </span>
                <strong>81%</strong>
              </section>

              <section>
                <span>
                  Response compliance
                </span>
                <strong>96%</strong>
              </section>
            </div>
          </div>

          <Link
            className="staff-full-link"
            to="/reports"
          >
            Open mentor performance report
          </Link>
        </StaffPanel>
      </section>

      <section className="staff-lower-grid">
        <StaffPanel
          title="Active Interventions"
          description="Current student-improvement plans"
          action={
            <Link to="/interventions">
              Intervention centre
            </Link>
          }
        >
          <div className="active-intervention-list">
            {interventions.map(
              (intervention) => (
                <section
                  key={intervention.student}
                >
                  <span>
                    <Zap size={15} />
                  </span>

                  <div>
                    <strong>
                      {intervention.student}
                    </strong>

                    <small>
                      {intervention.action}
                    </small>
                  </div>

                  <div className="intervention-progress">
                    <header>
                      <span>
                        {intervention.progress}%
                      </span>

                      <strong>
                        {intervention.outcome}
                      </strong>
                    </header>

                    <div>
                      <i
                        style={{
                          width: `${intervention.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </section>
              ),
            )}
          </div>
        </StaffPanel>

        <StaffPanel
          title="AI Mentor Assistant"
          description="Support for authorised mentor work"
          className="staff-ai-panel"
          action={<Brain size={18} />}
        >
          <div className="mentor-ai-message">
            <span>
              <Brain size={18} />
            </span>

            <div>
              <strong>
                Suggested priority
              </strong>

              <p>
                Review Akhil's missed
                Electrostatics lectures before
                assigning another Physics test.
              </p>
            </div>
          </div>

          <div className="mentor-ai-message">
            <span>
              <Activity size={18} />
            </span>

            <div>
              <strong>
                Behaviour insight
              </strong>

              <p>
                Sanjay's study consistency is
                stable, but long evening
                sessions are reducing accuracy.
              </p>
            </div>
          </div>

          <button type="button">
            Ask Mentor AI
            <ArrowRight size={14} />
          </button>
        </StaffPanel>
      </section>

      <section className="staff-audit-strip">
        <div>
          <UserRoundCheck size={18} />

          <span>
            <strong>
              Access policy active
            </strong>

            <small>
              You can view only assigned or
              explicitly authorised students.
              Sensitive access is logged.
            </small>
          </span>
        </div>

        <Link to="/settings">
          Review permissions
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
