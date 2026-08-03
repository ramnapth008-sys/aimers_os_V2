import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  Brain,
  Check,
  CirclePlay,
  Clock3,
  GraduationCap,
  LineChart,
  Monitor,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";

const features = [
  {
    title: "AI Mentor",
    description:
      "A personal teacher that understands your goals, weaknesses and learning preferences.",
    icon: Bot,
    tone: "violet",
  },
  {
    title: "Behavior AI",
    description:
      "Discover distraction patterns, productive hours and practical improvement opportunities.",
    icon: Activity,
    tone: "pink",
  },
  {
    title: "Memory Engine",
    description:
      "Use active recall, spaced repetition and retention analytics to remember more.",
    icon: Brain,
    tone: "blue",
  },
  {
    title: "Prediction Engine",
    description:
      "Estimate score, rank and readiness using your study and test performance.",
    icon: LineChart,
    tone: "green",
  },
  {
    title: "Digital Activity",
    description:
      "Consent-based insight into study applications, websites, lectures and distractions.",
    icon: Monitor,
    tone: "cyan",
  },
  {
    title: "Test Intelligence",
    description:
      "Practise questions, attempt mock tests and identify weak chapters automatically.",
    icon: Target,
    tone: "orange",
  },
];

const outcomes = [
  "Plan every study day",
  "Track lecture completion",
  "Detect weak topics",
  "Improve revision timing",
  "Reduce digital distractions",
  "Measure test readiness",
];

export function HomePage() {
  return (
    <div className="marketing-home">
      <section className="marketing-hero">
        <div className="hero-grid-background" />

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />

            <span>
              Built for ambitious learners
            </span>

            <strong>V2</strong>
          </div>

          <h1>
            Your complete
            <span> AI education </span>
            operating system.
          </h1>

          <p>
            AIMERS combines planning,
            personalised teaching, behaviour
            intelligence, memory science,
            testing and prediction into one
            connected learning platform.
          </p>

          <div className="hero-actions">
            <Link
              className="marketing-primary-button hero-primary"
              to="/register"
            >
              Start learning free
              <ArrowRight size={16} />
            </Link>

            <Link
              className="marketing-secondary-button"
              to="/how-it-works"
            >
              <CirclePlay size={17} />
              See how AIMERS works
            </Link>
          </div>

          <div className="hero-trust-row">
            <span>
              <Check size={13} />
              Start without payment
            </span>

            <span>
              <ShieldCheck size={13} />
              Privacy-first controls
            </span>

            <span>
              <Zap size={13} />
              Personalised instantly
            </span>
          </div>
        </div>

        <div className="hero-product-preview">
          <div className="preview-glow" />

          <section className="preview-window">
            <header>
              <div className="preview-logo">
                <Brain size={18} />
                AIMERS OS
              </div>

              <div className="preview-window-actions">
                <i />
                <i />
                <i />
              </div>
            </header>

            <div className="preview-layout">
              <aside>
                {[
                  Brain,
                  Bot,
                  Activity,
                  Monitor,
                  BarChart3,
                  Target,
                ].map((Icon, index) => (
                  <span
                    key={index}
                    className={
                      index === 0
                        ? "active"
                        : ""
                    }
                  >
                    <Icon size={15} />
                  </span>
                ))}
              </aside>

              <main>
                <div className="preview-greeting">
                  <div>
                    <small>
                      GOOD MORNING, RAM
                    </small>

                    <strong>
                      Ready to improve?
                    </strong>
                  </div>

                  <span>
                    <Sparkles size={14} />
                    Ask AIMERS
                  </span>
                </div>

                <div className="preview-metrics">
                  <article>
                    <FlameIcon />
                    <strong>27</strong>
                    <span>day streak</span>
                  </article>

                  <article>
                    <BarChart3 size={17} />
                    <strong>85%</strong>
                    <span>AI score</span>
                  </article>

                  <article>
                    <Clock3 size={17} />
                    <strong>7h 32m</strong>
                    <span>study time</span>
                  </article>
                </div>

                <div className="preview-main-grid">
                  <section>
                    <header>
                      <strong>
                        Today's Mission
                      </strong>

                      <span>2/4</span>
                    </header>

                    {[
                      "Physics questions",
                      "Organic Chemistry",
                      "Human Physiology",
                    ].map(
                      (item, index) => (
                        <p key={item}>
                          <i
                            className={
                              index < 2
                                ? "done"
                                : ""
                            }
                          >
                            {index < 2 && (
                              <Check
                                size={9}
                              />
                            )}
                          </i>

                          {item}
                        </p>
                      ),
                    )}
                  </section>

                  <section className="preview-brain">
                    <Brain size={69} />

                    <span>
                      AIMERS Brain
                    </span>

                    <small>
                      All systems active
                    </small>
                  </section>
                </div>
              </main>
            </div>
          </section>
        </div>
      </section>

      <section className="marketing-proof-strip">
        <span>
          <GraduationCap size={18} />
          Personalised learning
        </span>

        <span>
          <Brain size={18} />
          Cognitive intelligence
        </span>

        <span>
          <BookOpenCheck size={18} />
          Complete syllabus tracking
        </span>

        <span>
          <Trophy size={18} />
          Outcome-focused design
        </span>
      </section>

      <section className="marketing-section feature-section">
        <header className="marketing-section-heading">
          <span>
            ONE CONNECTED LEARNING SYSTEM
          </span>

          <h2>
            Everything required to turn effort
            into measurable progress.
          </h2>

          <p>
            Every AIMERS module shares the same
            student profile, performance
            history and learning intelligence.
          </p>
        </header>

        <div className="marketing-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className={`feature-card feature-${feature.tone}`}
              >
                <span>
                  <Icon size={21} />
                </span>

                <h3>{feature.title}</h3>

                <p>
                  {feature.description}
                </p>

                <Link to="/features">
                  Explore feature
                  <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="marketing-section intelligence-section">
        <div className="intelligence-copy">
          <span className="section-label">
            PERSONALISED INTELLIGENCE
          </span>

          <h2>
            AIMERS learns how each student
            learns.
          </h2>

          <p>
            The system connects plans,
            lectures, questions, tests,
            retention and optional digital
            activity to create useful,
            personalised recommendations.
          </p>

          <div className="outcome-list">
            {outcomes.map((outcome) => (
              <span key={outcome}>
                <Check size={14} />
                {outcome}
              </span>
            ))}
          </div>

          <Link
            className="marketing-secondary-button"
            to="/how-it-works"
          >
            Explore the intelligence system
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="intelligence-visual">
          <div className="intelligence-orbit orbit-a" />
          <div className="intelligence-orbit orbit-b" />
          <div className="intelligence-orbit orbit-c" />

          <div className="intelligence-core">
            <Brain size={90} />

            <strong>AIMERS Brain</strong>

            <span>
              Cognitive learning map
            </span>
          </div>

          <article className="intelligence-node node-memory">
            <Brain size={16} />
            Memory
            <strong>82%</strong>
          </article>

          <article className="intelligence-node node-focus">
            <Target size={16} />
            Focus
            <strong>84%</strong>
          </article>

          <article className="intelligence-node node-behavior">
            <Activity size={16} />
            Behavior
            <strong>73%</strong>
          </article>

          <article className="intelligence-node node-prediction">
            <LineChart size={16} />
            Prediction
            <strong>81%</strong>
          </article>
        </div>
      </section>

      <section className="marketing-section audience-section">
        <header className="marketing-section-heading">
          <span>
            BUILT FOR THE LEARNING ECOSYSTEM
          </span>

          <h2>
            One platform. Different experiences.
          </h2>
        </header>

        <div className="audience-grid">
          <Link to="/students">
            <span>
              <GraduationCap size={24} />
            </span>

            <h3>For Students</h3>

            <p>
              Personalised learning,
              revision, tests and progress
              intelligence.
            </p>

            <strong>
              Explore student experience
              <ArrowRight size={14} />
            </strong>
          </Link>

          <Link to="/parents">
            <span>
              <Users size={24} />
            </span>

            <h3>For Parents</h3>

            <p>
              Clear, respectful progress
              reports and academic support
              insights.
            </p>

            <strong>
              Explore parent portal
              <ArrowRight size={14} />
            </strong>
          </Link>

          <Link to="/institutions">
            <span>
              <BookOpenCheck size={24} />
            </span>

            <h3>For Institutions</h3>

            <p>
              Cohorts, teachers, tests,
              analytics and outcome
              optimisation.
            </p>

            <strong>
              Explore institution platform
              <ArrowRight size={14} />
            </strong>
          </Link>
        </div>
      </section>

      <section className="marketing-cta">
        <div>
          <span>
            <Sparkles size={15} />
            YOUR NEXT STUDY SYSTEM
          </span>

          <h2>
            Build the habits, knowledge and
            confidence required for your goal.
          </h2>

          <p>
            Start with the free plan and
            upgrade when you need deeper AI
            intelligence.
          </p>
        </div>

        <div>
          <Link
            className="marketing-primary-button hero-primary"
            to="/register"
          >
            Create free account
            <ArrowRight size={16} />
          </Link>

          <Link
            className="marketing-secondary-button"
            to="/pricing"
          >
            Compare plans
          </Link>
        </div>
      </section>
    </div>
  );
}

function FlameIcon() {
  return <Zap size={17} />;
}
