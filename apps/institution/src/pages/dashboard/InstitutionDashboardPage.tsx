import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import "./institution-dashboard.css";

interface InstitutionMetricProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: string;
}

const batches = [
  {
    name: "NEET 2027 Alpha",
    students: 124,
    attendance: "94%",
    accuracy: "79%",
    risk: "Low"
  },
  {
    name: "NEET 2027 Beta",
    students: 118,
    attendance: "89%",
    accuracy: "73%",
    risk: "Medium"
  },
  {
    name: "Foundation Class 10",
    students: 96,
    attendance: "92%",
    accuracy: "81%",
    risk: "Low"
  },
  {
    name: "NEET 2026 Intensive",
    students: 82,
    attendance: "86%",
    accuracy: "71%",
    risk: "High"
  }
];

function InstitutionMetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: InstitutionMetricProps) {
  return (
    <article
      className={`institution-metric-card institution-tone-${tone}`}
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

function InstitutionPanel({
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
      className={`institution-panel ${className}`}
    >
      <header className="institution-panel-heading">
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

export function InstitutionDashboardPage() {
  return (
    <div className="institution-dashboard-page">
      <section className="institution-dashboard-heading">
        <div>
          <span>
            <Sparkles size={14} />
            INSTITUTION INTELLIGENCE
          </span>

          <h1>
            Good afternoon, Academic Director.
          </h1>

          <p>
            Attendance is stable, but one
            intensive batch needs academic
            intervention.
          </p>
        </div>

        <div>
          <Link to="/reports">
            <FileText size={14} />
            Generate report
          </Link>

          <Link to="/analytics">
            <BarChart3 size={14} />
            Open analytics
          </Link>
        </div>
      </section>

      <section className="institution-metric-grid">
        <InstitutionMetricCard
          label="ACTIVE STUDENTS"
          value="1,842"
          detail="1,716 active this week"
          icon={<Users size={17} />}
          tone="violet"
        />

        <InstitutionMetricCard
          label="ACTIVE BATCHES"
          value="18"
          detail="Six examination programmes"
          icon={<Layers3 size={17} />}
          tone="blue"
        />

        <InstitutionMetricCard
          label="AVERAGE ATTENDANCE"
          value="91.4%"
          detail="Up 2.8% this month"
          icon={<CalendarDays size={17} />}
          tone="green"
        />

        <InstitutionMetricCard
          label="AVERAGE ACCURACY"
          value="76.8%"
          detail="Across current assessments"
          icon={<Target size={17} />}
          tone="cyan"
        />

        <InstitutionMetricCard
          label="STUDENTS AT RISK"
          value="64"
          detail="17 require immediate review"
          icon={
            <AlertTriangle size={17} />
          }
          tone="danger"
        />
      </section>

      <section className="institution-primary-grid">
        <InstitutionPanel
          title="Institution Performance"
          description="Attendance, accuracy and student engagement"
          action={
            <button type="button">
              Last 12 weeks
            </button>
          }
        >
          <div className="institution-chart-summary">
            <section>
              <small>Average accuracy</small>
              <strong>76.8%</strong>
              <span>+4.2%</span>
            </section>

            <section>
              <small>Attendance</small>
              <strong>91.4%</strong>
              <span>+2.8%</span>
            </section>

            <section>
              <small>Test participation</small>
              <strong>88.7%</strong>
              <span>+6.1%</span>
            </section>
          </div>

          <div className="institution-performance-chart">
            <div className="institution-chart-axis">
              <span>100%</span>
              <span>85%</span>
              <span>70%</span>
              <span>55%</span>
              <span>40%</span>
            </div>

            <div className="institution-chart-plot">
              <svg
                viewBox="0 0 760 240"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="institutionArea"
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
                  d="M0 185 L70 174 L140 158 L210 166 L280 139 L350 121 L420 129 L490 101 L560 86 L630 72 L700 61 L760 43 L760 240 L0 240 Z"
                  fill="url(#institutionArea)"
                />

                <polyline
                  points="0,185 70,174 140,158 210,166 280,139 350,121 420,129 490,101 560,86 630,72 700,61 760,43"
                  fill="none"
                  stroke="#9875ff"
                  strokeWidth="4"
                />

                <polyline
                  points="0,205 70,198 140,185 210,191 280,174 350,162 420,166 490,145 560,137 630,124 700,116 760,100"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                />
              </svg>

              <div>
                <span>W1</span>
                <span>W2</span>
                <span>W3</span>
                <span>W4</span>
                <span>W5</span>
                <span>W6</span>
                <span>W7</span>
                <span>W8</span>
                <span>W9</span>
                <span>W10</span>
                <span>W11</span>
                <span>W12</span>
              </div>
            </div>
          </div>

          <footer className="institution-chart-legend">
            <span>
              <i />
              Academic accuracy
            </span>

            <span>
              <i />
              Student engagement
            </span>
          </footer>
        </InstitutionPanel>

        <InstitutionPanel
          title="Institution Overview"
          description="Current operational scale"
          action={
            <Building2 size={18} />
          }
        >
          <div className="institution-overview-ring">
            <div>
              <strong>86%</strong>
              <small>Institution health</small>
            </div>
          </div>

          <div className="institution-overview-list">
            <section>
              <span>Teachers</span>
              <strong>74</strong>
            </section>

            <section>
              <span>Active courses</span>
              <strong>26</strong>
            </section>

            <section>
              <span>Tests this month</span>
              <strong>118</strong>
            </section>

            <section>
              <span>Content resources</span>
              <strong>4,820</strong>
            </section>
          </div>

          <Link
            className="institution-full-link"
            to="/analytics"
          >
            Open institution analytics
          </Link>
        </InstitutionPanel>
      </section>

      <section className="institution-table-grid">
        <InstitutionPanel
          title="Batch Performance"
          description="Current academic and attendance indicators"
          action={
            <Link to="/batches">
              View all batches
            </Link>
          }
        >
          <div className="institution-batch-table">
            <header>
              <span>Batch</span>
              <span>Students</span>
              <span>Attendance</span>
              <span>Accuracy</span>
              <span>Risk</span>
              <span />
            </header>

            {batches.map((batch) => (
              <section key={batch.name}>
                <span>
                  <i>
                    <Layers3 size={14} />
                  </i>

                  <strong>{batch.name}</strong>
                </span>

                <span>{batch.students}</span>
                <span>{batch.attendance}</span>
                <strong>{batch.accuracy}</strong>

                <span>
                  <b
                    className={batch.risk.toLowerCase()}
                  >
                    {batch.risk}
                  </b>
                </span>

                <Link to="/batches">
                  <ArrowRight size={14} />
                </Link>
              </section>
            ))}
          </div>
        </InstitutionPanel>

        <InstitutionPanel
          title="Academic Attention"
          description="Institution-wide risk summary"
          action={
            <Link to="/students">
              Review students
            </Link>
          }
        >
          <div className="institution-risk-list">
            <section>
              <span className="critical">
                <AlertTriangle size={15} />
              </span>

              <div>
                <strong>
                  Critical academic risk
                </strong>

                <small>
                  17 students require
                  immediate review
                </small>
              </div>

              <b>17</b>
            </section>

            <section>
              <span className="warning">
                <Activity size={15} />
              </span>

              <div>
                <strong>
                  Attendance decline
                </strong>

                <small>
                  28 students below target
                </small>
              </div>

              <b>28</b>
            </section>

            <section>
              <span className="violet">
                <Brain size={15} />
              </span>

              <div>
                <strong>
                  Intervention active
                </strong>

                <small>
                  46 improvement plans
                </small>
              </div>

              <b>46</b>
            </section>

            <section>
              <span className="success">
                <CheckCircle2 size={15} />
              </span>

              <div>
                <strong>
                  Intervention success
                </strong>

                <small>
                  81% positive outcomes
                </small>
              </div>

              <b>81%</b>
            </section>
          </div>
        </InstitutionPanel>
      </section>

      <section className="institution-secondary-grid">
        <InstitutionPanel
          title="Teacher Engagement"
          description="Teaching and mentoring activity"
        >
          <div className="institution-teacher-grid">
            <section>
              <span>
                <UserCheck size={17} />
              </span>

              <div>
                <small>Active today</small>
                <strong>62/74</strong>
              </div>
            </section>

            <section>
              <span>
                <BookOpen size={17} />
              </span>

              <div>
                <small>Content assigned</small>
                <strong>384</strong>
              </div>
            </section>

            <section>
              <span>
                <Target size={17} />
              </span>

              <div>
                <small>Tests reviewed</small>
                <strong>92%</strong>
              </div>
            </section>

            <section>
              <span>
                <BarChart3 size={17} />
              </span>

              <div>
                <small>Follow-up compliance</small>
                <strong>88%</strong>
              </div>
            </section>
          </div>
        </InstitutionPanel>

        <InstitutionPanel
          title="Licence Usage"
          description="Current AIMERS allocation"
          action={
            <Link to="/licences">
              Manage licences
            </Link>
          }
        >
          <div className="institution-licence-summary">
            <strong>1,842 / 2,000</strong>
            <span>Student licences used</span>
          </div>

          <div className="institution-licence-bar">
            <i />
          </div>

          <div className="institution-licence-list">
            <section>
              <span>Student licences</span>
              <strong>92.1%</strong>
            </section>

            <section>
              <span>Teacher licences</span>
              <strong>74 / 100</strong>
            </section>

            <section>
              <span>Renewal date</span>
              <strong>1 July 2027</strong>
            </section>
          </div>
        </InstitutionPanel>

        <InstitutionPanel
          title="AI Institution Insight"
          description="Aggregate institutional intelligence"
          className="institution-ai-panel"
          action={<Brain size={18} />}
        >
          <div className="institution-ai-message">
            <span>
              <Brain size={18} />
            </span>

            <div>
              <strong>
                Recommended action
              </strong>

              <p>
                NEET 2026 Intensive has lower
                attendance and accuracy. Review
                evening lecture load and create
                a two-week recovery intervention.
              </p>
            </div>
          </div>

          <Link
            className="institution-full-link"
            to="/analytics"
          >
            Open AI analysis
          </Link>
        </InstitutionPanel>
      </section>

      <section className="institution-security-strip">
        <div>
          <ShieldCheck size={19} />

          <span>
            <strong>
              Institution access controls active
            </strong>

            <small>
              Teachers, mentors and
              administrators can access only
              information permitted by their
              institution role and assignment.
            </small>
          </span>
        </div>

        <Link to="/settings">
          Review access settings
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
