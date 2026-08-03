import {
  Activity,
  AppWindow,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  Brain,
  Check,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  Flame,
  Globe2,
  Headphones,
  Library,
  Mic2,
  Play,
  Radio,
  Sparkles,
  Target,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react";

import type {
  CSSProperties,
  ReactNode,
} from "react";

import { Link } from "react-router-dom";

import "./dashboard.css";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  change: string;
  icon: ReactNode;
  tone: "orange" | "blue" | "violet" | "pink" | "green";
  points: string;
}

const missions = [
  {
    title: "Physics: Electrostatics",
    detail: "20 Questions",
    completed: true,
  },
  {
    title: "Chemistry: Organic Reactions",
    detail: "25 Questions",
    completed: true,
  },
  {
    title: "Biology: Human Physiology",
    detail: "Read & Notes",
    completed: false,
  },
  {
    title: "Physics: Current Electricity",
    detail: "15 Questions",
    completed: false,
  },
];

const weakTopics = [
  {
    topic: "Electrostatics",
    value: "72% Weak",
    tone: "danger",
  },
  {
    topic: "Organic Reactions",
    value: "65% Weak",
    tone: "danger",
  },
  {
    topic: "Human Physiology",
    value: "58% Weak",
    tone: "warning",
  },
  {
    topic: "Current Electricity",
    value: "47% Weak",
    tone: "success",
  },
];

const quickActions = [
  {
    label: "Start Mock Test",
    icon: Target,
    path: "/mock-tests",
  },
  {
    label: "Flashcards",
    icon: LayersIcon,
    path: "/flashcards",
  },
  {
    label: "AI Doubt Solver",
    icon: Bot,
    path: "/ai-mentor",
  },
  {
    label: "Voice Notes",
    icon: Mic2,
    path: "/notes",
  },
  {
    label: "Memory Review",
    icon: Brain,
    path: "/memory-engine",
  },
  {
    label: "Question Bank",
    icon: Library,
    path: "/question-bank",
  },
  {
    label: "Study Planner",
    icon: Clock3,
    path: "/planner",
  },
  {
    label: "Focus Music",
    icon: Headphones,
    path: "/focus-room",
  },
];

function LayersIcon() {
  return <BookOpenCheck size={16} />;
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  change,
  icon,
  tone,
  points,
}: MetricCardProps) {
  return (
    <article
      className={`metric-card metric-${tone}`}
    >
      <header>
        <div className="metric-icon">
          {icon}
        </div>

        <span>{label}</span>

        <button
          type="button"
          aria-label={`Open ${label}`}
        >
          <ArrowUpRight size={13} />
        </button>
      </header>

      <div className="metric-value">
        <strong>{value}</strong>

        {unit && <span>{unit}</span>}
      </div>

      <p>{detail}</p>

      <svg
        className="metric-sparkline"
        viewBox="0 0 120 28"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

      <small>{change}</small>
    </article>
  );
}

function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`dashboard-panel ${className}`}
    >
      <header className="panel-heading">
        <div>
          {eyebrow && (
            <span>{eyebrow}</span>
          )}

          <h2>{title}</h2>
        </div>

        {action}
      </header>

      {children}
    </article>
  );
}

function ProgressRing({
  value,
  size = 112,
}: {
  value: number;
  size?: number;
}) {
  const style = {
    "--ring-value": `${value * 3.6}deg`,
    width: `${size}px`,
    height: `${size}px`,
  } as CSSProperties;

  return (
    <div
      className="progress-ring"
      style={style}
    >
      <div>
        <strong>{value}%</strong>
        <span>Completed</span>
      </div>
    </div>
  );
}

export function DashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-metrics">
        <MetricCard
          label="Study Streak"
          value="27"
          unit="days"
          detail="Best: 27 days"
          change="↑ 4 days this month"
          icon={<Flame size={17} />}
          tone="orange"
          points="0,23 12,18 24,21 36,14 48,17 60,9 72,14 84,8 96,11 108,3 120,5"
        />

        <MetricCard
          label="AI Score"
          value="85%"
          detail="Cognitive performance"
          change="↑ 12% this week"
          icon={<BarChart3 size={17} />}
          tone="violet"
          points="0,24 12,20 24,22 36,13 48,17 60,8 72,12 84,5 96,8 108,2 120,4"
        />

        <MetricCard
          label="Study Time"
          value="7h 32m"
          detail="Today"
          change="↑ 1h 20m vs yesterday"
          icon={<Clock3 size={17} />}
          tone="blue"
          points="0,25 15,25 15,20 30,20 30,22 45,22 45,11 60,11 60,17 75,17 75,7 90,7 90,14 105,14 105,3 120,3"
        />

        <MetricCard
          label="Questions Solved"
          value="142"
          detail="Today"
          change="↑ 28 vs yesterday"
          icon={<CircleCheckBig size={17} />}
          tone="pink"
          points="0,25 12,24 24,22 36,24 48,16 60,23 72,9 84,20 96,4 108,14 120,8"
        />

        <MetricCard
          label="Accuracy"
          value="78%"
          detail="Good"
          change="↑ 8% vs last 7 days"
          icon={<Target size={17} />}
          tone="green"
          points="0,25 12,22 24,23 36,17 48,20 60,9 72,14 84,4 96,11 108,6 120,8"
        />
      </section>

      <section className="dashboard-hero-grid">
        <div className="dashboard-primary-column">
          <div className="mission-mentor-grid">
            <Panel
              title="Today's Mission"
              className="mission-panel"
              action={
                <span className="panel-count">
                  2/4 Completed
                </span>
              }
            >
              <div className="mission-content">
                <div className="mission-list">
                  {missions.map(
                    (mission) => (
                      <section
                        key={mission.title}
                        className={
                          mission.completed
                            ? "mission-item completed"
                            : "mission-item"
                        }
                      >
                        <span className="mission-state">
                          {mission.completed ? (
                            <Check size={13} />
                          ) : (
                            <Play size={12} />
                          )}
                        </span>

                        <div>
                          <strong>
                            {mission.title}
                          </strong>

                          <small>
                            {mission.detail}
                          </small>
                        </div>

                        <ChevronRight
                          size={15}
                        />
                      </section>
                    ),
                  )}
                </div>

                <ProgressRing value={50} />
              </div>

              <div className="mission-footer">
                <span>
                  <CircleCheckBig
                    size={15}
                  />
                  Keep going! You're doing
                  great.
                </span>

                <Link to="/planner">
                  Continue Mission
                  <ChevronRight size={15} />
                </Link>
              </div>
            </Panel>

            <Panel
              title="AI Mentor"
              eyebrow="Always here to help"
              className="mentor-panel"
              action={
                <Sparkles size={18} />
              }
            >
              <div className="mentor-conversation">
                <div className="mentor-message assistant">
                  <span>
                    <Bot size={15} />
                  </span>

                  <p>
                    Ram, I noticed your
                    Chemistry accuracy is
                    improving. Would you like
                    to revise SN1 and SN2
                    reactions today?
                  </p>
                </div>

                <div className="mentor-message user">
                  Yes, explain in Malayalam
                  please.
                </div>

                <div className="mentor-message assistant compact">
                  <span>
                    <Bot size={15} />
                  </span>

                  <p>
                    ശരി Ram! നമുക്ക്
                    ഘട്ടംഘട്ടമായി പഠിക്കാം.
                  </p>
                </div>
              </div>

              <div className="mentor-input">
                <span>Ask anything...</span>

                <Mic2 size={16} />

                <Link to="/ai-mentor">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </Panel>
          </div>

          <section className="dashboard-analysis-grid">
            <Panel
              title="Study Analytics"
              action={
                <button
                  className="panel-filter"
                  type="button"
                >
                  This Week
                </button>
              }
            >
              <div className="study-chart">
                <div className="chart-y-axis">
                  <span>12h</span>
                  <span>9h</span>
                  <span>6h</span>
                  <span>3h</span>
                  <span>0h</span>
                </div>

                <div className="chart-plot">
                  <svg
                    viewBox="0 0 440 180"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="studyArea"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6d5dfc"
                          stopOpacity="0.55"
                        />

                        <stop
                          offset="100%"
                          stopColor="#6d5dfc"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <path
                      d="M0 150 L65 120 L130 130 L195 75 L260 100 L325 48 L390 72 L440 38 L440 180 L0 180 Z"
                      fill="url(#studyArea)"
                    />

                    <polyline
                      points="0,150 65,120 130,130 195,75 260,100 325,48 390,72 440,38"
                      fill="none"
                      stroke="#7d74ff"
                      strokeWidth="4"
                    />

                    <polyline
                      points="0,165 65,143 130,153 195,125 260,144 325,112 390,133 440,97"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="3"
                    />
                  </svg>

                  <div className="chart-days">
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

              <div className="chart-legend">
                <span>
                  <i className="legend-study" />
                  Study Time
                </span>

                <span>
                  <i className="legend-focus" />
                  Focus Time
                </span>
              </div>
            </Panel>

            <Panel
              title="Subject Wise Progress"
              action={
                <button
                  className="panel-filter"
                  type="button"
                >
                  This Month
                </button>
              }
            >
              <div className="subject-progress">
                <div className="subject-donut">
                  <div>
                    <strong>78%</strong>
                    <span>Overall</span>
                  </div>
                </div>

                <div className="subject-list">
                  <span>
                    <i className="physics" />
                    Physics
                    <strong>82%</strong>
                  </span>

                  <span>
                    <i className="chemistry" />
                    Chemistry
                    <strong>75%</strong>
                  </span>

                  <span>
                    <i className="biology" />
                    Biology
                    <strong>78%</strong>
                  </span>

                  <span>
                    <i className="other" />
                    Others
                    <strong>65%</strong>
                  </span>
                </div>
              </div>
            </Panel>

            <Panel
              title="Weak Topics"
              action={
                <span className="ai-detected">
                  AI Detected
                </span>
              }
            >
              <div className="weak-topic-list">
                {weakTopics.map(
                  (item) => (
                    <section
                      key={item.topic}
                    >
                      <span
                        className={`weak-icon ${item.tone}`}
                      >
                        <Zap size={13} />
                      </span>

                      <strong>
                        {item.topic}
                      </strong>

                      <small
                        className={
                          item.tone
                        }
                      >
                        {item.value}
                      </small>
                    </section>
                  ),
                )}
              </div>

              <Link
                className="panel-full-link"
                to="/analytics"
              >
                View All Weak Topics
              </Link>
            </Panel>

            <Panel
              title="Predicted Performance"
              action={
                <span className="prediction-tag">
                  NEET 2027
                </span>
              }
            >
              <div className="prediction-score">
                <strong>620–650</strong>
                <span>
                  Expected Score Range
                </span>
              </div>

              <div className="prediction-boxes">
                <section>
                  <span>All India Rank</span>
                  <strong>
                    1,250–2,300
                  </strong>
                </section>

                <section>
                  <span>
                    Confidence Level
                  </span>
                  <strong>High · 81%</strong>
                </section>
              </div>

              <Link
                className="panel-full-link"
                to="/prediction"
              >
                View Full Prediction
              </Link>
            </Panel>
          </section>
        </div>

        <aside className="dashboard-secondary-column">
          <Panel
            title="AIMERS Brain"
            eyebrow="Your Cognitive Intelligence Map"
            className="brain-panel"
            action={
              <span className="live-badge">
                <i />
                Live
              </span>
            }
          >
            <div className="brain-map">
              <div className="brain-signals left">
                <span>
                  Memory Engine
                  <strong>82%</strong>
                </span>

                <span>
                  Knowledge Graph
                  <strong>76%</strong>
                </span>

                <span>
                  Reasoning Core
                  <strong>88%</strong>
                </span>

                <span>
                  Language Engine
                  <strong>90%</strong>
                </span>
              </div>

              <div className="brain-visual">
                <div className="brain-orbit orbit-one" />
                <div className="brain-orbit orbit-two" />
                <div className="brain-orbit orbit-three" />

                <Brain size={104} />

                <i className="brain-node node-one" />
                <i className="brain-node node-two" />
                <i className="brain-node node-three" />
                <i className="brain-node node-four" />
              </div>

              <div className="brain-signals right">
                <span>
                  Focus Engine
                  <strong>84%</strong>
                </span>

                <span>
                  Behavior AI
                  <strong>73%</strong>
                </span>

                <span>
                  Prediction AI
                  <strong>81%</strong>
                </span>

                <span>
                  Emotional AI
                  <strong>70%</strong>
                </span>
              </div>
            </div>

            <footer className="brain-status">
              <span>
                <i />
                All systems active
              </span>

              <small>
                Synced just now
              </small>
            </footer>
          </Panel>

          <div className="insights-activity-grid">
            <Panel
              title="AI Insights"
              eyebrow="Personalized for you"
            >
              <div className="insight-card-content">
                <div>
                  <p>
                    You perform best between
                  </p>

                  <strong>
                    6:00 AM – 9:00 AM
                  </strong>

                  <small>
                    Focus is highest in the
                    morning. Schedule important
                    subjects first.
                  </small>
                </div>

                <div className="time-dial">
                  <span>6 AM</span>
                  <Clock3 size={28} />
                  <span>9 AM</span>
                </div>
              </div>
            </Panel>

            <Panel
              title="Digital Activity Monitor"
              eyebrow="With your consent"
              action={
                <span className="active-badge">
                  <i />
                  Active
                </span>
              }
            >
              <div className="activity-list">
                <span>
                  <Globe2 size={14} />
                  Study Websites
                  <strong>2h 15m</strong>
                </span>

                <span>
                  <Video size={14} />
                  YouTube (Edu)
                  <strong>1h 05m</strong>
                </span>

                <span>
                  <AppWindow size={14} />
                  Notes Apps
                  <strong>1h 30m</strong>
                </span>

                <span>
                  <BookOpenCheck size={14} />
                  Practice Platforms
                  <strong>1h 20m</strong>
                </span>

                <span>
                  <Activity size={14} />
                  Other Apps
                  <strong>45m</strong>
                </span>
              </div>

              <Link
                className="panel-full-link"
                to="/digital-activity"
              >
                View Detailed Report
              </Link>
            </Panel>
          </div>

          <div className="secondary-lower-grid">
            <Panel
              title="Memory Engine"
              eyebrow="Retention Status"
              className="memory-panel"
            >
              <div className="memory-score">
                <strong>72%</strong>
                <span>Retention Score</span>
              </div>

              <svg
                className="memory-line-chart"
                viewBox="0 0 300 90"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,8 60,24 120,35 180,56 240,72 300,83"
                  fill="none"
                  stroke="#a56dff"
                  strokeWidth="3"
                />

                <circle
                  cx="0"
                  cy="8"
                  r="4"
                  fill="#69d8ff"
                />

                <circle
                  cx="120"
                  cy="35"
                  r="4"
                  fill="#69d8ff"
                />

                <circle
                  cx="180"
                  cy="56"
                  r="4"
                  fill="#ec73ff"
                />

                <circle
                  cx="300"
                  cy="83"
                  r="4"
                  fill="#6dd6ff"
                />
              </svg>

              <div className="memory-axis">
                <span>1D</span>
                <span>3D</span>
                <span>7D</span>
                <span>15D</span>
                <span>30D</span>
              </div>
            </Panel>

            <Panel
              title="AI Voice Assistant"
              eyebrow="Tap to speak"
              className="voice-panel"
            >
              <button
                type="button"
                aria-label="Start voice assistant"
              >
                <Radio size={20} />
                <span>
                  <Mic2 size={28} />
                </span>
              </button>
            </Panel>
          </div>
        </aside>
      </section>

      <section className="quick-actions-panel">
        <header>
          <h2>Quick Actions</h2>
        </header>

        <div>
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.label}
                to={action.path}
              >
                <span>
                  <Icon size={16} />
                </span>

                <strong>
                  {action.label}
                </strong>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
