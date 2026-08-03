import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Check,
  Clock,
  CreditCard,
  Database,
  IndianRupee,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

import type {
  CSSProperties,
  ReactNode,
} from "react";

import { Link } from "react-router-dom";

import "./admin-overview.css";

interface MetricProps {
  label: string;
  value: string;
  detail: string;
  change: string;
  positive?: boolean;
  icon: ReactNode;
  tone: string;
}

const subscriptions = [
  {
    customer: "Arjun Menon",
    plan: "AIMERS Pro",
    amount: "₹699",
    status: "Active",
    time: "2 min ago",
  },
  {
    customer: "Nayana S.",
    plan: "AIMERS Plus",
    amount: "₹299",
    status: "Active",
    time: "8 min ago",
  },
  {
    customer: "Vivek Raj",
    plan: "AIMERS Elite",
    amount: "₹1,499",
    status: "Trial",
    time: "14 min ago",
  },
  {
    customer: "Maya Thomas",
    plan: "AIMERS Pro",
    amount: "₹699",
    status: "Active",
    time: "22 min ago",
  },
];

const interventions = [
  {
    student: "Akhil P.",
    reason: "High distraction risk",
    action: "Focus-plan assigned",
    outcome: "+18% focus",
  },
  {
    student: "Diya R.",
    reason: "Chemistry backlog",
    action: "Revision queue created",
    outcome: "In progress",
  },
  {
    student: "Sanjay K.",
    reason: "Low test accuracy",
    action: "Mentor review requested",
    outcome: "+9% accuracy",
  },
];

function MetricCard({
  label,
  value,
  detail,
  change,
  positive = true,
  icon,
  tone,
}: MetricProps) {
  return (
    <article
      className={`admin-metric-card admin-tone-${tone}`}
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

      <footer
        className={
          positive
            ? "positive"
            : "negative"
        }
      >
        {positive ? (
          <TrendingUp size={13} />
        ) : (
          <TrendingDown size={13} />
        )}

        {change}
      </footer>
    </article>
  );
}

function AdminPanel({
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
      className={`admin-panel ${className}`}
    >
      <header className="admin-panel-heading">
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

export function AdminOverviewPage() {
  return (
    <div className="admin-overview-page">
      <section className="admin-overview-heading">
        <div>
          <span>
            <Sparkles size={14} />
            MONDAY, 3 AUGUST 2026
          </span>

          <h1>
            Good afternoon, Ram.
          </h1>

          <p>
            AIMERS gained 127 students today
            and all critical services are
            healthy.
          </p>
        </div>

        <div>
          <button type="button">
            Export report
          </button>

          <button type="button">
            <Zap size={15} />
            Create intervention
          </button>
        </div>
      </section>

      <section className="admin-metric-grid">
        <MetricCard
          label="MONTHLY RECURRING REVENUE"
          value="₹18.42L"
          detail="Annual run rate: ₹2.21Cr"
          change="12.8% this month"
          icon={<IndianRupee size={17} />}
          tone="violet"
        />

        <MetricCard
          label="ACTIVE SUBSCRIPTIONS"
          value="4,812"
          detail="318 new this month"
          change="8.4% this month"
          icon={<CreditCard size={17} />}
          tone="blue"
        />

        <MetricCard
          label="ACTIVE STUDENTS"
          value="6,284"
          detail="4,921 active this week"
          change="6.7% this month"
          icon={<Users size={17} />}
          tone="cyan"
        />

        <MetricCard
          label="AI OPERATING COST"
          value="₹1.84L"
          detail="₹29.28 per active student"
          change="4.1% cost reduction"
          icon={<Brain size={17} />}
          tone="pink"
        />

        <MetricCard
          label="SUBSCRIPTION CHURN"
          value="2.7%"
          detail="Target remains below 3%"
          change="0.4% improvement"
          icon={<Activity size={17} />}
          tone="green"
        />
      </section>

      <section className="admin-primary-grid">
        <AdminPanel
          title="Revenue and Subscriber Growth"
          description="Monthly recurring revenue and paid subscribers"
          className="growth-panel"
          action={
            <button className="admin-panel-filter">
              Last 12 months
            </button>
          }
        >
          <div className="growth-chart-summary">
            <section>
              <small>MRR</small>
              <strong>₹18.42L</strong>
              <span>
                <ArrowUpRight size={12} />
                12.8%
              </span>
            </section>

            <section>
              <small>Paid subscribers</small>
              <strong>4,812</strong>
              <span>
                <ArrowUpRight size={12} />
                8.4%
              </span>
            </section>

            <section>
              <small>ARPU</small>
              <strong>₹383</strong>
              <span>
                <ArrowUpRight size={12} />
                3.2%
              </span>
            </section>
          </div>

          <div className="admin-growth-chart">
            <div className="growth-y-axis">
              <span>₹20L</span>
              <span>₹15L</span>
              <span>₹10L</span>
              <span>₹5L</span>
              <span>₹0</span>
            </div>

            <div className="growth-chart-plot">
              <svg
                viewBox="0 0 760 260"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="adminGrowthArea"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity="0.52"
                    />

                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 220 L70 210 L140 190 L210 175 L280 166 L350 135 L420 144 L490 105 L560 88 L630 72 L700 44 L760 29 L760 260 L0 260 Z"
                  fill="url(#adminGrowthArea)"
                />

                <polyline
                  points="0,220 70,210 140,190 210,175 280,166 350,135 420,144 490,105 560,88 630,72 700,44 760,29"
                  fill="none"
                  stroke="#9a74ff"
                  strokeWidth="4"
                />

                <polyline
                  points="0,238 70,229 140,214 210,201 280,193 350,174 420,179 490,153 560,139 630,128 700,103 760,88"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                />
              </svg>

              <div className="growth-x-axis">
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
              </div>
            </div>
          </div>

          <footer className="admin-chart-legend">
            <span>
              <i className="mrr" />
              Monthly recurring revenue
            </span>

            <span>
              <i className="subscribers" />
              Paid subscribers
            </span>
          </footer>
        </AdminPanel>

        <AdminPanel
          title="Subscription Distribution"
          description="Current active plan mix"
          action={
            <Link to="/subscriptions">
              View plans
            </Link>
          }
        >
          <div className="subscription-total">
            <div>
              <strong>4,812</strong>
              <span>Active subscriptions</span>
            </div>

            <small>
              <ArrowUpRight size={12} />
              318 this month
            </small>
          </div>

          <div className="subscription-bars">
            {[
              {
                plan: "Free",
                value: 100,
                count: "1,472",
              },
              {
                plan: "Plus",
                value: 66,
                count: "1,122",
              },
              {
                plan: "Pro",
                value: 91,
                count: "1,684",
              },
              {
                plan: "Elite",
                value: 31,
                count: "534",
              },
            ].map((item) => (
              <section key={item.plan}>
                <header>
                  <span>{item.plan}</span>
                  <strong>{item.count}</strong>
                </header>

                <div>
                  <i
                    style={{
                      width: `${item.value}%`,
                    }}
                  />
                </div>
              </section>
            ))}
          </div>

          <div className="subscription-insight">
            <Brain size={17} />

            <div>
              <strong>
                Pro conversion is accelerating
              </strong>

              <p>
                Students using Memory Engine are
                2.4× more likely to upgrade.
              </p>
            </div>
          </div>
        </AdminPanel>
      </section>

      <section className="admin-secondary-grid">
        <AdminPanel
          title="Student Outcomes"
          description="Academic and engagement indicators"
          action={
            <Link to="/learning-analytics">
              Full analytics
            </Link>
          }
        >
          <div className="outcome-score-grid">
            <section>
              <span>
                <Target size={16} />
              </span>

              <div>
                <small>
                  Average accuracy
                </small>
                <strong>74.8%</strong>
              </div>

              <i>+6.2%</i>
            </section>

            <section>
              <span>
                <Clock size={16} />
              </span>

              <div>
                <small>
                  Daily study time
                </small>
                <strong>4h 18m</strong>
              </div>

              <i>+22m</i>
            </section>

            <section>
              <span>
                <UserCheck size={16} />
              </span>

              <div>
                <small>
                  Weekly retention
                </small>
                <strong>71.3%</strong>
              </div>

              <i>+4.7%</i>
            </section>

            <section>
              <span>
                <Zap size={16} />
              </span>

              <div>
                <small>
                  Focus efficiency
                </small>
                <strong>78.1%</strong>
              </div>

              <i>+8.9%</i>
            </section>
          </div>

          <div className="student-risk-summary">
            <header>
              <span>
                Students requiring attention
              </span>

              <strong>184</strong>
            </header>

            <div>
              <span>
                <i className="critical" />
                Critical risk
                <strong>28</strong>
              </span>

              <span>
                <i className="medium" />
                Moderate risk
                <strong>67</strong>
              </span>

              <span>
                <i className="watch" />
                Watch list
                <strong>89</strong>
              </span>
            </div>

            <Link to="/students">
              Review student risks
              <ArrowRight size={13} />
            </Link>
          </div>
        </AdminPanel>

        <AdminPanel
          title="AI Operations"
          description="Usage, quality, cost and safety"
          action={
            <span className="admin-live-label">
              <i />
              Live
            </span>
          }
        >
          <div className="ai-operation-score">
            <div className="ai-score-ring">
              <span>
                <strong>98.7%</strong>
                <small>Availability</small>
              </span>
            </div>

            <div>
              <section>
                <small>Requests today</small>
                <strong>182,604</strong>
              </section>

              <section>
                <small>Average latency</small>
                <strong>1.42s</strong>
              </section>

              <section>
                <small>Evaluation score</small>
                <strong>92.4%</strong>
              </section>
            </div>
          </div>

          <div className="ai-cost-bars">
            {[
              {
                label: "AI Mentor",
                value: 84,
                amount: "₹68,420",
              },
              {
                label: "Behavior AI",
                value: 53,
                amount: "₹37,180",
              },
              {
                label: "Research AI",
                value: 36,
                amount: "₹24,850",
              },
              {
                label: "Predictions",
                value: 22,
                amount: "₹15,440",
              },
            ].map((item) => (
              <section key={item.label}>
                <header>
                  <span>{item.label}</span>
                  <strong>
                    {item.amount}
                  </strong>
                </header>

                <div>
                  <i
                    style={{
                      width: `${item.value}%`,
                    }}
                  />
                </div>
              </section>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="System Health"
          description="Production infrastructure"
          action={
            <Link to="/system-health">
              View systems
            </Link>
          }
        >
          <div className="system-health-list">
            {[
              {
                icon: Server,
                label: "API Services",
                status: "Operational",
                latency: "118 ms",
              },
              {
                icon: Database,
                label: "Primary Database",
                status: "Operational",
                latency: "24 ms",
              },
              {
                icon: Brain,
                label: "AI Services",
                status: "Operational",
                latency: "1.42 s",
              },
              {
                icon: Zap,
                label: "Realtime Gateway",
                status: "Operational",
                latency: "46 ms",
              },
              {
                icon: ShieldCheck,
                label: "Security Services",
                status: "Operational",
                latency: "31 ms",
              },
            ].map((service) => {
              const Icon = service.icon;

              return (
                <section key={service.label}>
                  <span>
                    <Icon size={15} />
                  </span>

                  <div>
                    <strong>
                      {service.label}
                    </strong>

                    <small>
                      {service.latency}
                    </small>
                  </div>

                  <i />

                  <b>{service.status}</b>
                </section>
              );
            })}
          </div>

          <div className="system-uptime">
            <span>
              30-day platform uptime
            </span>

            <strong>99.982%</strong>
          </div>
        </AdminPanel>
      </section>

      <section className="admin-table-grid">
        <AdminPanel
          title="Recent Subscriptions"
          description="Latest paid and trial activity"
          action={
            <Link to="/subscriptions">
              View all
            </Link>
          }
        >
          <div className="admin-data-table">
            <header>
              <span>Customer</span>
              <span>Plan</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Time</span>
            </header>

            {subscriptions.map((item) => (
              <section key={item.customer}>
                <span>
                  <i>
                    {item.customer
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </i>

                  {item.customer}
                </span>

                <span>{item.plan}</span>
                <strong>{item.amount}</strong>

                <span>
                  <b
                    className={
                      item.status === "Trial"
                        ? "trial"
                        : ""
                    }
                  >
                    {item.status}
                  </b>
                </span>

                <small>{item.time}</small>
              </section>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Intervention Outcomes"
          description="Recent personalised interventions"
          action={
            <Link to="/interventions">
              Open centre
            </Link>
          }
        >
          <div className="intervention-list">
            {interventions.map((item) => (
              <section key={item.student}>
                <span>
                  <Zap size={14} />
                </span>

                <div>
                  <strong>{item.student}</strong>
                  <small>{item.reason}</small>
                </div>

                <div>
                  <strong>{item.action}</strong>
                  <small>Intervention</small>
                </div>

                <b>{item.outcome}</b>
              </section>
            ))}
          </div>
        </AdminPanel>
      </section>

      <section className="admin-alert-strip">
        <div>
          <AlertTriangle size={18} />

          <span>
            <strong>
              3 operational items need review
            </strong>

            <small>
              Two failed subscription payments
              and one elevated AI latency event.
            </small>
          </span>
        </div>

        <button type="button">
          Review alerts
          <ArrowRight size={14} />
        </button>
      </section>
    </div>
  );
}
