#!/usr/bin/env bash

set -euo pipefail

echo "Creating AIMERS OS public subscription website..."

mkdir -p \
  apps/marketing/src/app/router \
  apps/marketing/src/components/navigation \
  apps/marketing/src/components/marketing \
  apps/marketing/src/layouts \
  apps/marketing/src/pages/home \
  apps/marketing/src/pages/pricing \
  apps/marketing/src/pages/auth \
  apps/marketing/src/pages/shared \
  apps/marketing/src/styles

# ============================================================
# PACKAGE CONFIGURATION
# ============================================================

cat > apps/marketing/package.json <<'EOF'
{
  "name": "@aimers/marketing",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "AIMERS OS public subscription website",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5174",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  }
}
EOF

cat > apps/marketing/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",

  "compilerOptions": {
    "noEmit": true,

    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],

    "types": [
      "vite/client"
    ]
  },

  "include": [
    "src",
    "vite.config.ts"
  ]
}
EOF

cat > apps/marketing/vite.config.ts <<'EOF'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5174,
  },
});
EOF

cat > apps/marketing/index.html <<'EOF'
<!doctype html>

<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />

    <meta
      name="theme-color"
      content="#030510"
    />

    <meta
      name="description"
      content="AIMERS OS is an AI-powered learning operating system for ambitious students."
    />

    <title>
      AIMERS OS — Your AI Education Operating System
    </title>
  </head>

  <body>
    <div id="root"></div>

    <script
      type="module"
      src="/src/main.tsx"
    ></script>
  </body>
</html>
EOF

# ============================================================
# NAVIGATION
# ============================================================

cat > apps/marketing/src/components/navigation/MarketingHeader.tsx <<'EOF'
import {
  Brain,
  Menu,
  Sparkles,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

const navigation = [
  {
    label: "Features",
    path: "/features",
  },
  {
    label: "How It Works",
    path: "/how-it-works",
  },
  {
    label: "Students",
    path: "/students",
  },
  {
    label: "Parents",
    path: "/parents",
  },
  {
    label: "Institutions",
    path: "/institutions",
  },
  {
    label: "Pricing",
    path: "/pricing",
  },
  {
    label: "Security",
    path: "/security",
  },
];

export function MarketingHeader() {
  const location = useLocation();

  const [menuOpen, setMenuOpen] =
    useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="marketing-header">
      <Link
        className="marketing-brand"
        to="/"
      >
        <span>
          <Brain size={27} />
        </span>

        <div>
          <strong>
            AIMERS <i>OS</i>
          </strong>

          <small>
            Your AI Education OS
          </small>
        </div>
      </Link>

      <nav
        className={
          menuOpen
            ? "marketing-navigation open"
            : "marketing-navigation"
        }
      >
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
          >
            {item.label}
          </NavLink>
        ))}

        <div className="mobile-auth-actions">
          <Link to="/login">
            Sign in
          </Link>

          <Link
            className="marketing-primary-button"
            to="/register"
          >
            Start free
          </Link>
        </div>
      </nav>

      <div className="marketing-header-actions">
        <Link
          className="marketing-login-link"
          to="/login"
        >
          Sign in
        </Link>

        <Link
          className="marketing-primary-button"
          to="/register"
        >
          <Sparkles size={15} />
          Start free
        </Link>

        <button
          className="marketing-menu-button"
          type="button"
          aria-label={
            menuOpen
              ? "Close menu"
              : "Open menu"
          }
          onClick={() =>
            setMenuOpen(
              (current) => !current,
            )
          }
        >
          {menuOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>
      </div>
    </header>
  );
}
EOF

cat > apps/marketing/src/components/navigation/MarketingFooter.tsx <<'EOF'
import {
  Brain,
  Linkedin,
  Mail,
  MapPin,
  Twitter,
  Youtube,
} from "lucide-react";

import { Link } from "react-router-dom";

const productLinks = [
  ["Features", "/features"],
  ["Pricing", "/pricing"],
  ["Students", "/students"],
  ["Parents", "/parents"],
  ["Institutions", "/institutions"],
];

const companyLinks = [
  ["About", "/about"],
  ["Careers", "/careers"],
  ["Contact", "/contact"],
  ["Blog", "/blog"],
  ["System Status", "/status"],
];

const legalLinks = [
  ["Privacy", "/privacy"],
  ["Security", "/security"],
  ["Terms", "/terms"],
  ["Help Centre", "/help"],
];

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <section className="footer-main">
        <div className="footer-brand-column">
          <Link
            className="marketing-brand"
            to="/"
          >
            <span>
              <Brain size={25} />
            </span>

            <div>
              <strong>
                AIMERS <i>OS</i>
              </strong>

              <small>
                Your AI Education OS
              </small>
            </div>
          </Link>

          <p>
            A personalised learning operating
            system that helps students plan,
            learn, practise, remember and
            improve.
          </p>

          <div className="footer-contact">
            <span>
              <MapPin size={14} />
              Kerala, India
            </span>

            <span>
              <Mail size={14} />
              hello@aimers.ai
            </span>
          </div>
        </div>

        <div className="footer-link-column">
          <strong>Product</strong>

          {productLinks.map(
            ([label, path]) => (
              <Link
                key={path}
                to={path}
              >
                {label}
              </Link>
            ),
          )}
        </div>

        <div className="footer-link-column">
          <strong>Company</strong>

          {companyLinks.map(
            ([label, path]) => (
              <Link
                key={path}
                to={path}
              >
                {label}
              </Link>
            ),
          )}
        </div>

        <div className="footer-link-column">
          <strong>Trust</strong>

          {legalLinks.map(
            ([label, path]) => (
              <Link
                key={path}
                to={path}
              >
                {label}
              </Link>
            ),
          )}
        </div>

        <div className="footer-newsletter">
          <strong>
            Learning intelligence updates
          </strong>

          <p>
            Product news, study insights and
            AIMERS research.
          </p>

          <form
            onSubmit={(event) =>
              event.preventDefault()
            }
          >
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
            />

            <button type="submit">
              Join
            </button>
          </form>
        </div>
      </section>

      <section className="footer-bottom">
        <span>
          © 2026 AIMERS OS. All rights
          reserved.
        </span>

        <div>
          <button
            type="button"
            aria-label="Twitter"
          >
            <Twitter size={15} />
          </button>

          <button
            type="button"
            aria-label="YouTube"
          >
            <Youtube size={15} />
          </button>

          <button
            type="button"
            aria-label="LinkedIn"
          >
            <Linkedin size={15} />
          </button>
        </div>
      </section>
    </footer>
  );
}
EOF

# Replace unsupported brand icons proactively.
python3 - <<'PY'
from pathlib import Path

path = Path(
    "apps/marketing/src/components/navigation/MarketingFooter.tsx"
)

text = path.read_text()

text = text.replace(
    "  Linkedin,\n",
    "  BriefcaseBusiness,\n",
)

text = text.replace(
    "  Twitter,\n",
    "  MessageCircle,\n",
)

text = text.replace(
    "  Youtube,\n",
    "  Video,\n",
)

text = text.replace(
    "<Twitter size={15} />",
    "<MessageCircle size={15} />",
)

text = text.replace(
    "<Youtube size={15} />",
    "<Video size={15} />",
)

text = text.replace(
    "<Linkedin size={15} />",
    "<BriefcaseBusiness size={15} />",
)

path.write_text(text)
PY

# ============================================================
# LAYOUT
# ============================================================

cat > apps/marketing/src/layouts/MarketingLayout.tsx <<'EOF'
import { Outlet } from "react-router-dom";

import { MarketingFooter } from "../components/navigation/MarketingFooter";
import { MarketingHeader } from "../components/navigation/MarketingHeader";

export function MarketingLayout() {
  return (
    <div className="marketing-app">
      <MarketingHeader />

      <main>
        <Outlet />
      </main>

      <MarketingFooter />
    </div>
  );
}
EOF

# ============================================================
# HOME PAGE
# ============================================================

cat > apps/marketing/src/pages/home/HomePage.tsx <<'EOF'
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
EOF

# ============================================================
# PRICING PAGE
# ============================================================

cat > apps/marketing/src/pages/pricing/PricingPage.tsx <<'EOF'
import {
  ArrowRight,
  Check,
  Crown,
  Sparkles,
} from "lucide-react";

import { useState } from "react";

import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    description:
      "Start organising and measuring your learning.",
    monthly: 0,
    yearly: 0,
    button: "Start free",
    featured: false,
    features: [
      "Study planner",
      "Basic dashboard",
      "Limited AI Mentor",
      "Basic analytics",
      "Limited question practice",
    ],
  },
  {
    name: "AIMERS Plus",
    description:
      "For students building a consistent study system.",
    monthly: 299,
    yearly: 239,
    button: "Choose Plus",
    featured: false,
    features: [
      "Everything in Free",
      "More AI Mentor usage",
      "Memory Engine",
      "Mock-test analytics",
      "Flashcard reviews",
      "Subject progress",
    ],
  },
  {
    name: "AIMERS Pro",
    description:
      "Advanced intelligence for serious aspirants.",
    monthly: 699,
    yearly: 559,
    button: "Start Pro",
    featured: true,
    features: [
      "Everything in Plus",
      "Behavior AI",
      "Digital Activity insights",
      "Advanced predictions",
      "Weak-topic intelligence",
      "Research AI",
      "Priority AI processing",
    ],
  },
  {
    name: "AIMERS Elite",
    description:
      "Maximum support and deeper intervention tools.",
    monthly: 1499,
    yearly: 1199,
    button: "Choose Elite",
    featured: false,
    features: [
      "Everything in Pro",
      "Advanced reports",
      "Mentor intervention tools",
      "Premium test series",
      "Long-term performance analysis",
      "Priority support",
    ],
  },
];

const frequentlyAsked = [
  {
    question:
      "Can I start without a payment method?",
    answer:
      "Yes. The Free plan can be started without entering payment details.",
  },
  {
    question:
      "Can I cancel a paid subscription?",
    answer:
      "Subscriptions will support cancellation and plan changes from the billing settings.",
  },
  {
    question:
      "Is Digital Activity monitoring mandatory?",
    answer:
      "No. It is optional and controlled through separate consent and privacy settings.",
  },
  {
    question:
      "Are institution plans available?",
    answer:
      "Institution pricing will be customised for student count, features and support requirements.",
  },
];

export function PricingPage() {
  const [yearly, setYearly] =
    useState(true);

  const [openFaq, setOpenFaq] =
    useState<number | null>(0);

  return (
    <div className="pricing-page">
      <section className="pricing-hero">
        <span>
          <Sparkles size={14} />
          SIMPLE, FLEXIBLE PLANS
        </span>

        <h1>
          Start free. Upgrade as your
          ambition grows.
        </h1>

        <p>
          Choose the level of planning, AI
          assistance, behaviour intelligence
          and analytics that fits your
          learning journey.
        </p>

        <div className="billing-toggle">
          <button
            className={!yearly ? "active" : ""}
            type="button"
            onClick={() =>
              setYearly(false)
            }
          >
            Monthly
          </button>

          <button
            className={yearly ? "active" : ""}
            type="button"
            onClick={() =>
              setYearly(true)
            }
          >
            Yearly
            <span>Save 20%</span>
          </button>
        </div>
      </section>

      <section className="pricing-grid">
        {plans.map((plan) => {
          const price = yearly
            ? plan.yearly
            : plan.monthly;

          return (
            <article
              key={plan.name}
              className={
                plan.featured
                  ? "pricing-card featured"
                  : "pricing-card"
              }
            >
              {plan.featured && (
                <span className="popular-label">
                  <Crown size={13} />
                  MOST POPULAR
                </span>
              )}

              <header>
                <h2>{plan.name}</h2>

                <p>
                  {plan.description}
                </p>
              </header>

              <div className="plan-price">
                <strong>
                  ₹{price}
                </strong>

                <span>
                  {price === 0
                    ? "forever"
                    : "/ month"}
                </span>
              </div>

              {yearly && price > 0 && (
                <small className="billing-note">
                  Billed annually
                </small>
              )}

              <Link
                className={
                  plan.featured
                    ? "marketing-primary-button"
                    : "marketing-secondary-button"
                }
                to="/register"
              >
                {plan.button}
                <ArrowRight size={14} />
              </Link>

              <div className="plan-features">
                {plan.features.map(
                  (feature) => (
                    <span key={feature}>
                      <Check size={14} />
                      {feature}
                    </span>
                  ),
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="institution-pricing">
        <div>
          <span>
            INSTITUTIONS AND COACHING CENTRES
          </span>

          <h2>
            Bring AIMERS intelligence to your
            entire student organisation.
          </h2>

          <p>
            Cohort analytics, staff tools,
            institution dashboards and
            configurable licences.
          </p>
        </div>

        <Link
          className="marketing-primary-button"
          to="/contact"
        >
          Contact sales
          <ArrowRight size={15} />
        </Link>
      </section>

      <section className="pricing-faq">
        <header className="marketing-section-heading">
          <span>
            FREQUENTLY ASKED QUESTIONS
          </span>

          <h2>
            Questions about subscriptions
          </h2>
        </header>

        <div>
          {frequentlyAsked.map(
            (item, index) => (
              <article
                key={item.question}
                className={
                  openFaq === index
                    ? "open"
                    : ""
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenFaq(
                      openFaq === index
                        ? null
                        : index,
                    )
                  }
                >
                  {item.question}
                  <span>
                    {openFaq === index
                      ? "−"
                      : "+"}
                  </span>
                </button>

                {openFaq === index && (
                  <p>{item.answer}</p>
                )}
              </article>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
EOF

# ============================================================
# AUTH PAGES
# ============================================================

cat > apps/marketing/src/pages/auth/AuthPage.tsx <<'EOF'
import {
  ArrowRight,
  Brain,
  Check,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "react-router-dom";

export function AuthPage() {
  const location = useLocation();

  const register =
    location.pathname === "/register";

  return (
    <div className="marketing-auth-page">
      <section className="auth-visual-panel">
        <Link
          className="marketing-brand"
          to="/"
        >
          <span>
            <Brain size={26} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Your AI Education OS
            </small>
          </div>
        </Link>

        <div>
          <span className="section-label">
            PERSONAL LEARNING INTELLIGENCE
          </span>

          <h1>
            Your goals deserve a system built
            around you.
          </h1>

          <p>
            Plan better, learn with AI,
            practise intelligently and improve
            using evidence from your own
            progress.
          </p>

          <div className="auth-benefits">
            <span>
              <Check size={14} />
              Personalised learning profile
            </span>

            <span>
              <Check size={14} />
              Connected study modules
            </span>

            <span>
              <Check size={14} />
              Privacy and consent controls
            </span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-card">
          <span>
            {register
              ? "CREATE YOUR AIMERS ACCOUNT"
              : "WELCOME BACK"}
          </span>

          <h2>
            {register
              ? "Start your learning system"
              : "Sign in to AIMERS OS"}
          </h2>

          <p>
            {register
              ? "Start free. Payment details are not required."
              : "Continue where you stopped and open your Command Center."}
          </p>

          <form
            onSubmit={(event) =>
              event.preventDefault()
            }
          >
            {register && (
              <label>
                <span>Full name</span>

                <div>
                  <User size={16} />

                  <input
                    type="text"
                    placeholder="Your name"
                  />
                </div>
              </label>
            )}

            <label>
              <span>Email address</span>

              <div>
                <Mail size={16} />

                <input
                  type="email"
                  placeholder="student@example.com"
                />
              </div>
            </label>

            <label>
              <span>Password</span>

              <div>
                <LockKeyhole size={16} />

                <input
                  type="password"
                  placeholder="Enter password"
                />
              </div>
            </label>

            {!register && (
              <div className="auth-form-options">
                <label>
                  <input type="checkbox" />
                  Remember me
                </label>

                <Link to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              className="marketing-primary-button"
              type="submit"
            >
              {register
                ? "Create free account"
                : "Sign in"}

              <ArrowRight size={15} />
            </button>
          </form>

          <footer>
            {register
              ? "Already have an account?"
              : "New to AIMERS?"}

            <Link
              to={
                register
                  ? "/login"
                  : "/register"
              }
            >
              {register
                ? "Sign in"
                : "Create account"}
            </Link>
          </footer>
        </div>
      </section>
    </div>
  );
}
EOF

# ============================================================
# SHARED CONTENT PAGE
# ============================================================

cat > apps/marketing/src/pages/shared/MarketingContentPage.tsx <<'EOF'
import {
  ArrowRight,
  Brain,
  Check,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

interface MarketingContentPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function MarketingContentPage({
  eyebrow,
  title,
  description,
}: MarketingContentPageProps) {
  return (
    <div className="marketing-content-page">
      <section className="content-page-hero">
        <span>
          <Sparkles size={14} />
          {eyebrow}
        </span>

        <h1>{title}</h1>

        <p>{description}</p>

        <div>
          <Link
            className="marketing-primary-button"
            to="/register"
          >
            Start free
            <ArrowRight size={15} />
          </Link>

          <Link
            className="marketing-secondary-button"
            to="/pricing"
          >
            View pricing
          </Link>
        </div>
      </section>

      <section className="content-page-grid">
        {[
          "Personalised experience",
          "Connected learning intelligence",
          "Responsive premium interface",
        ].map((item, index) => (
          <article key={item}>
            <span>
              {index === 1 ? (
                <Brain size={21} />
              ) : (
                <Check size={21} />
              )}
            </span>

            <h2>{item}</h2>

            <p>
              This page structure is prepared
              for the complete AIMERS OS
              product content and interactive
              experience.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
EOF

# ============================================================
# ROUTER
# ============================================================

cat > apps/marketing/src/app/router/MarketingRouter.tsx <<'EOF'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { MarketingLayout } from "../../layouts/MarketingLayout";

import { AuthPage } from "../../pages/auth/AuthPage";
import { HomePage } from "../../pages/home/HomePage";
import { PricingPage } from "../../pages/pricing/PricingPage";
import { MarketingContentPage } from "../../pages/shared/MarketingContentPage";

const contentPages = [
  {
    path: "features",
    eyebrow: "AIMERS PRODUCT MODULES",
    title:
      "One connected system for every stage of learning.",
    description:
      "Explore AI Mentor, Behavior AI, Memory Engine, tests, analytics, research, digital activity and more.",
  },
  {
    path: "how-it-works",
    eyebrow: "FROM DATA TO IMPROVEMENT",
    title:
      "Understand. Personalise. Intervene. Improve.",
    description:
      "AIMERS turns study activity and performance into useful learning actions.",
  },
  {
    path: "students",
    eyebrow: "BUILT FOR STUDENTS",
    title:
      "A personal operating system for ambitious learners.",
    description:
      "Plan, focus, learn, practise, remember and improve inside one connected workspace.",
  },
  {
    path: "parents",
    eyebrow: "PARENT EXPERIENCE",
    title:
      "Support progress without turning learning into pressure.",
    description:
      "Clear academic summaries, meaningful alerts and consent-aware progress reporting.",
  },
  {
    path: "institutions",
    eyebrow: "INSTITUTION INTELLIGENCE",
    title:
      "Improve student outcomes across batches and classrooms.",
    description:
      "Give teachers and leaders access to cohort analytics, tests, interventions and outcome dashboards.",
  },
  {
    path: "coaching-centres",
    eyebrow: "FOR COACHING ORGANISATIONS",
    title:
      "Connect content, mentoring and learning intelligence.",
    description:
      "Manage batches, tests, staff workflows and individual student improvement.",
  },
  {
    path: "security",
    eyebrow: "TRUST AND SECURITY",
    title:
      "Privacy, consent and responsible access by design.",
    description:
      "AIMERS separates student data, mentor access and company-level analytics with strict controls.",
  },
  {
    path: "privacy",
    eyebrow: "PRIVACY CONTROLS",
    title:
      "Students remain in control of optional monitoring.",
    description:
      "Granular consent, monitoring pauses, data exports, retention controls and deletion workflows.",
  },
  {
    path: "terms",
    eyebrow: "AIMERS TERMS",
    title:
      "Clear terms for a trustworthy learning platform.",
    description:
      "The final legal terms will be published before production launch.",
  },
  {
    path: "about",
    eyebrow: "ABOUT AIMERS",
    title:
      "Building a better learning system for every student.",
    description:
      "AIMERS combines education, technology, AI and continuous experimentation.",
  },
  {
    path: "contact",
    eyebrow: "CONTACT AIMERS",
    title:
      "Talk to the AIMERS team.",
    description:
      "Contact us about subscriptions, institutions, partnerships, support or the product roadmap.",
  },
  {
    path: "blog",
    eyebrow: "AIMERS RESEARCH",
    title:
      "Learning science, product updates and student improvement.",
    description:
      "The AIMERS publication system will contain educational research and product announcements.",
  },
  {
    path: "careers",
    eyebrow: "BUILD AIMERS",
    title:
      "Join the team building the learning operating system.",
    description:
      "Future roles will include education, engineering, AI, design, research and student success.",
  },
  {
    path: "help",
    eyebrow: "HELP CENTRE",
    title:
      "Find answers and get support.",
    description:
      "Documentation, account help, subscription support and product guidance.",
  },
  {
    path: "status",
    eyebrow: "SYSTEM STATUS",
    title:
      "AIMERS services and platform availability.",
    description:
      "Operational status for websites, applications, APIs, workers and AI services.",
  },
];

export function MarketingRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route
            index
            element={<HomePage />}
          />

          <Route
            path="pricing"
            element={<PricingPage />}
          />

          {contentPages.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={
                <MarketingContentPage
                  eyebrow={page.eyebrow}
                  title={page.title}
                  description={
                    page.description
                  }
                />
              }
            />
          ))}
        </Route>

        <Route
          path="login"
          element={<AuthPage />}
        />

        <Route
          path="register"
          element={<AuthPage />}
        />

        <Route
          path="*"
          element={
            <Navigate
              replace
              to="/"
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
EOF

cat > apps/marketing/src/app/App.tsx <<'EOF'
import { MarketingRouter } from "./router/MarketingRouter";

export function App() {
  return <MarketingRouter />;
}
EOF

cat > apps/marketing/src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";

import "./styles/index.css";

const root = document.getElementById(
  "root",
);

if (!root) {
  throw new Error(
    "AIMERS marketing root element was not found.",
  );
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

cat > apps/marketing/src/vite-env.d.ts <<'EOF'
/// <reference types="vite/client" />
EOF

# ============================================================
# STYLES
# ============================================================

cat > apps/marketing/src/styles/index.css <<'EOF'
@import "@aimers/design-tokens/tokens.css";
@import "./marketing.css";
EOF

cat > apps/marketing/src/styles/marketing.css <<'EOF'
* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  min-height: 100%;
  background: var(--aimers-bg-primary);
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  overflow-x: hidden;
  color: var(--aimers-text-primary);
  background:
    radial-gradient(
      circle at 82% 4%,
      rgba(120, 47, 224, 0.18),
      transparent 28%
    ),
    radial-gradient(
      circle at 14% 30%,
      rgba(28, 89, 196, 0.08),
      transparent 25%
    ),
    var(--aimers-bg-primary);
  font-family:
    Inter,
    Satoshi,
    ui-sans-serif,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
}

svg {
  display: block;
}

.marketing-app {
  min-height: 100vh;
}

.marketing-header {
  position: sticky;
  z-index: 80;
  top: 0;
  display: grid;
  min-height: 72px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 30px;
  border-bottom: 1px solid
    rgba(145, 157, 255, 0.09);
  padding: 0 clamp(18px, 5vw, 80px);
  background:
    rgba(3, 5, 16, 0.86);
  backdrop-filter: blur(22px);
}

.marketing-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.marketing-brand > span {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid
    rgba(149, 94, 255, 0.34);
  border-radius: 13px;
  color: #cf91ff;
  background:
    radial-gradient(
      circle,
      rgba(151, 66, 239, 0.24),
      rgba(57, 34, 113, 0.08)
    );
  box-shadow:
    0 0 24px rgba(139, 92, 246, 0.2);
}

.marketing-brand strong {
  display: block;
  font-size: 15px;
  letter-spacing: 0.14em;
}

.marketing-brand strong i {
  color: #a86dff;
  font-style: normal;
}

.marketing-brand small {
  display: block;
  margin-top: 3px;
  color: var(--aimers-text-muted);
  font-size: 8px;
}

.marketing-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(13px, 2vw, 28px);
}

.marketing-navigation > a {
  position: relative;
  color: var(--aimers-text-secondary);
  font-size: 11px;
  text-decoration: none;
}

.marketing-navigation > a:hover,
.marketing-navigation > a.active {
  color: white;
}

.marketing-navigation > a.active::after {
  position: absolute;
  right: 0;
  bottom: -12px;
  left: 0;
  height: 2px;
  border-radius: 999px;
  background: var(--aimers-gradient-primary);
  content: "";
}

.marketing-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.marketing-login-link {
  color: var(--aimers-text-secondary);
  font-size: 11px;
  text-decoration: none;
}

.marketing-primary-button,
.marketing-secondary-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 11px;
  padding: 0 17px;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}

.marketing-primary-button {
  border: 1px solid
    rgba(222, 130, 255, 0.33);
  color: white;
  background: var(--aimers-gradient-primary);
  box-shadow:
    0 0 28px rgba(157, 62, 227, 0.2);
}

.marketing-secondary-button {
  border: 1px solid
    var(--aimers-border);
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.025);
}

.marketing-primary-button:hover,
.marketing-secondary-button:hover {
  transform: translateY(-1px);
}

.marketing-menu-button {
  display: none;
  width: 39px;
  height: 39px;
  place-items: center;
  border: 1px solid
    var(--aimers-border);
  border-radius: 11px;
  color: var(--aimers-text-secondary);
  background: rgba(255, 255, 255, 0.025);
}

.mobile-auth-actions {
  display: none;
}

.marketing-hero {
  position: relative;
  display: grid;
  min-height: 760px;
  grid-template-columns:
    minmax(0, 0.92fr)
    minmax(520px, 1.08fr);
  align-items: center;
  gap: clamp(35px, 6vw, 95px);
  overflow: hidden;
  padding:
    80px clamp(22px, 6vw, 100px)
    90px;
}

.hero-grid-background {
  position: absolute;
  inset: 0;
  opacity: 0.24;
  background-image:
    linear-gradient(
      rgba(128, 116, 217, 0.08)
        1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(128, 116, 217, 0.08)
        1px,
      transparent 1px
    );
  background-size: 46px 46px;
  mask-image:
    linear-gradient(
      to bottom,
      black,
      transparent 85%
    );
}

.hero-content,
.hero-product-preview {
  position: relative;
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid
    rgba(171, 100, 255, 0.24);
  border-radius: 999px;
  padding: 7px 10px;
  color: #c8a2ff;
  background: rgba(128, 61, 205, 0.07);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.hero-badge strong {
  border-radius: 999px;
  padding: 3px 6px;
  color: white;
  background: var(--aimers-gradient-primary);
  font-size: 7px;
}

.hero-content h1 {
  max-width: 730px;
  margin: 24px 0 19px;
  font-size:
    clamp(47px, 6.1vw, 91px);
  font-weight: 600;
  letter-spacing: -0.068em;
  line-height: 0.99;
}

.hero-content h1 span {
  color: transparent;
  background:
    linear-gradient(
      100deg,
      #8b7cff,
      #c566ff,
      #ef5eb5
    );
  background-clip: text;
}

.hero-content > p {
  max-width: 680px;
  margin: 0;
  color: var(--aimers-text-secondary);
  font-size: clamp(14px, 1.25vw, 18px);
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.hero-primary {
  min-height: 49px;
  padding: 0 21px;
}

.hero-trust-row {
  display: flex;
  flex-wrap: wrap;
  gap: 17px;
  margin-top: 22px;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.hero-trust-row span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hero-trust-row svg {
  color: #5ee6a0;
}

.hero-product-preview {
  perspective: 1200px;
}

.preview-glow {
  position: absolute;
  inset: 10% 2%;
  border-radius: 50%;
  background:
    radial-gradient(
      circle,
      rgba(118, 73, 255, 0.3),
      rgba(214, 49, 203, 0.11)
        35%,
      transparent 70%
    );
  filter: blur(30px);
}

.preview-window {
  position: relative;
  z-index: 2;
  overflow: hidden;
  border: 1px solid
    rgba(145, 135, 255, 0.24);
  border-radius: 20px;
  background:
    linear-gradient(
      145deg,
      rgba(12, 18, 41, 0.97),
      rgba(5, 8, 21, 0.98)
    );
  box-shadow:
    0 35px 110px rgba(0, 0, 0, 0.5),
    0 0 65px rgba(118, 74, 255, 0.15);
  transform:
    rotateY(-5deg)
    rotateX(2deg);
}

.preview-window > header {
  display: flex;
  height: 45px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid
    var(--aimers-border-soft);
  padding: 0 14px;
}

.preview-logo {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #cab6ff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.preview-window-actions {
  display: flex;
  gap: 5px;
}

.preview-window-actions i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #414966;
}

.preview-layout {
  display: grid;
  min-height: 390px;
  grid-template-columns: 52px 1fr;
}

.preview-layout > aside {
  display: grid;
  align-content: start;
  gap: 7px;
  border-right: 1px solid
    var(--aimers-border-soft);
  padding: 12px 8px;
}

.preview-layout > aside span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  color: #68718f;
}

.preview-layout > aside span.active {
  color: #c18bff;
  background:
    rgba(132, 72, 224, 0.15);
}

.preview-layout > main {
  padding: 16px;
}

.preview-greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-greeting small {
  color: #8175ac;
  font-size: 6px;
  letter-spacing: 0.13em;
}

.preview-greeting strong {
  display: block;
  margin-top: 5px;
  font-size: 13px;
}

.preview-greeting > span {
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 8px;
  padding: 7px 9px;
  background: var(--aimers-gradient-primary);
  font-size: 7px;
}

.preview-metrics {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 15px;
}

.preview-metrics article {
  min-height: 78px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 10px;
  padding: 10px;
  color: #9f7eff;
  background: rgba(255, 255, 255, 0.02);
}

.preview-metrics strong {
  display: block;
  margin-top: 8px;
  color: white;
  font-size: 15px;
}

.preview-metrics span {
  color: var(--aimers-text-muted);
  font-size: 6px;
}

.preview-main-grid {
  display: grid;
  grid-template-columns: 1fr 0.78fr;
  gap: 8px;
  margin-top: 9px;
}

.preview-main-grid > section {
  min-height: 190px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 11px;
  padding: 11px;
  background: rgba(255, 255, 255, 0.018);
}

.preview-main-grid
  > section
  > header {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
}

.preview-main-grid
  > section
  > header span {
  color: var(--aimers-text-muted);
}

.preview-main-grid p {
  display: flex;
  align-items: center;
  gap: 7px;
  border-bottom: 1px solid
    rgba(255, 255, 255, 0.035);
  margin: 0;
  padding: 13px 0;
  color: #adb3c9;
  font-size: 7px;
}

.preview-main-grid p i {
  display: grid;
  width: 15px;
  height: 15px;
  place-items: center;
  border: 1px solid #39405b;
  border-radius: 50%;
}

.preview-main-grid p i.done {
  border-color: #ff527c;
  color: white;
  background: #e74470;
}

.preview-brain {
  display: grid;
  place-content: center;
  justify-items: center;
  color: #9569ff;
  text-align: center;
}

.preview-brain svg {
  filter:
    drop-shadow(
      0 0 18px
      rgba(135, 88, 255, 0.66)
    );
}

.preview-brain span {
  margin-top: 11px;
  color: white;
  font-size: 8px;
}

.preview-brain small {
  margin-top: 4px;
  color: #4ee1a1;
  font-size: 6px;
}

.marketing-proof-strip {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  border-top: 1px solid
    var(--aimers-border-soft);
  border-bottom: 1px solid
    var(--aimers-border-soft);
  padding:
    0 clamp(20px, 6vw, 100px);
  background: rgba(255, 255, 255, 0.012);
}

.marketing-proof-strip span {
  display: flex;
  min-height: 80px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--aimers-text-secondary);
  font-size: 10px;
}

.marketing-proof-strip svg {
  color: #aa72ff;
}

.marketing-section {
  padding:
    110px clamp(22px, 7vw, 115px);
}

.marketing-section-heading {
  max-width: 850px;
  margin: 0 auto 46px;
  text-align: center;
}

.marketing-section-heading > span,
.section-label,
.content-page-hero > span,
.pricing-hero > span,
.institution-pricing > div > span {
  color: #ae8ae1;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.17em;
}

.marketing-section-heading h2 {
  margin: 15px 0 13px;
  font-size:
    clamp(34px, 4.6vw, 62px);
  letter-spacing: -0.055em;
  line-height: 1.06;
}

.marketing-section-heading p {
  max-width: 700px;
  margin: 0 auto;
  color: var(--aimers-text-muted);
  line-height: 1.7;
}

.marketing-feature-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.feature-card {
  min-height: 270px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 20px;
  padding: 24px;
  background:
    linear-gradient(
      160deg,
      rgba(13, 18, 40, 0.92),
      rgba(7, 10, 24, 0.92)
    );
  transition:
    transform var(--aimers-transition),
    border-color var(--aimers-transition);
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color:
    var(--aimers-border-strong);
}

.feature-card > span {
  display: grid;
  width: 47px;
  height: 47px;
  place-items: center;
  border-radius: 14px;
  color: #be82ff;
  background:
    rgba(137, 75, 230, 0.12);
}

.feature-blue > span {
  color: #65a1ff;
  background:
    rgba(37, 99, 235, 0.12);
}

.feature-pink > span {
  color: #ff71b1;
  background:
    rgba(236, 72, 153, 0.11);
}

.feature-green > span {
  color: #5be2a0;
  background:
    rgba(34, 197, 94, 0.1);
}

.feature-cyan > span {
  color: #5bdcee;
  background:
    rgba(34, 211, 238, 0.1);
}

.feature-orange > span {
  color: #ffb553;
  background:
    rgba(245, 158, 11, 0.1);
}

.feature-card h3 {
  margin: 25px 0 10px;
  font-size: 18px;
}

.feature-card p {
  min-height: 70px;
  margin: 0;
  color: var(--aimers-text-muted);
  font-size: 12px;
  line-height: 1.65;
}

.feature-card a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 21px;
  color: #b992ff;
  font-size: 10px;
  text-decoration: none;
}

.intelligence-section {
  display: grid;
  min-height: 700px;
  grid-template-columns:
    minmax(0, 0.85fr)
    minmax(500px, 1.15fr);
  align-items: center;
  gap: clamp(40px, 8vw, 130px);
  background:
    radial-gradient(
      circle at 75% 50%,
      rgba(95, 55, 207, 0.13),
      transparent 33%
    );
}

.intelligence-copy h2 {
  margin: 16px 0;
  font-size:
    clamp(37px, 4.7vw, 66px);
  letter-spacing: -0.06em;
  line-height: 1.03;
}

.intelligence-copy > p {
  color: var(--aimers-text-muted);
  font-size: 14px;
  line-height: 1.75;
}

.outcome-list {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 12px;
  margin: 28px 0;
}

.outcome-list span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aimers-text-secondary);
  font-size: 11px;
}

.outcome-list svg {
  color: #5ee6a0;
}

.intelligence-visual {
  position: relative;
  display: grid;
  min-height: 520px;
  place-items: center;
}

.intelligence-orbit {
  position: absolute;
  border: 1px solid
    rgba(111, 92, 255, 0.25);
  border-radius: 50%;
}

.orbit-a {
  width: 410px;
  height: 410px;
}

.orbit-b {
  width: 470px;
  height: 235px;
  transform: rotate(25deg);
  border-color:
    rgba(217, 74, 225, 0.22);
}

.orbit-c {
  width: 260px;
  height: 490px;
  transform: rotate(-24deg);
  border-color:
    rgba(34, 161, 238, 0.2);
}

.intelligence-core {
  position: relative;
  z-index: 3;
  display: grid;
  width: 245px;
  height: 245px;
  place-content: center;
  justify-items: center;
  border: 1px solid
    rgba(161, 110, 255, 0.32);
  border-radius: 50%;
  color: #a775ff;
  background:
    radial-gradient(
      circle,
      rgba(100, 77, 225, 0.2),
      rgba(17, 20, 53, 0.92)
        62%,
      rgba(8, 10, 25, 0.96)
    );
  box-shadow:
    0 0 70px rgba(110, 67, 225, 0.2);
}

.intelligence-core svg {
  filter:
    drop-shadow(
      0 0 20px
      rgba(147, 93, 255, 0.72)
    );
}

.intelligence-core strong {
  margin-top: 14px;
  color: white;
}

.intelligence-core span {
  margin-top: 6px;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.intelligence-node {
  position: absolute;
  z-index: 4;
  display: grid;
  min-width: 135px;
  grid-template-columns: 25px 1fr auto;
  align-items: center;
  gap: 6px;
  border: 1px solid
    var(--aimers-border);
  border-radius: 12px;
  padding: 11px;
  color: var(--aimers-text-secondary);
  background:
    rgba(10, 16, 36, 0.94);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.3);
  font-size: 9px;
}

.intelligence-node strong {
  color: #5be1a1;
  font-weight: 500;
}

.node-memory {
  top: 30px;
  left: 4%;
}

.node-focus {
  top: 27%;
  right: 0;
}

.node-behavior {
  bottom: 24%;
  left: 0;
}

.node-prediction {
  right: 7%;
  bottom: 28px;
}

.audience-section {
  background:
    linear-gradient(
      180deg,
      rgba(9, 13, 29, 0.5),
      transparent
    );
}

.audience-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.audience-grid > a {
  min-height: 310px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 20px;
  padding: 26px;
  background:
    linear-gradient(
      150deg,
      rgba(12, 18, 40, 0.93),
      rgba(6, 10, 24, 0.93)
    );
  text-decoration: none;
}

.audience-grid > a > span {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 16px;
  color: #bc86ff;
  background:
    rgba(134, 77, 228, 0.12);
}

.audience-grid h3 {
  margin: 30px 0 12px;
  font-size: 22px;
}

.audience-grid p {
  min-height: 83px;
  color: var(--aimers-text-muted);
  line-height: 1.7;
}

.audience-grid strong {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #b791f4;
  font-size: 10px;
}

.marketing-cta {
  display: flex;
  min-height: 340px;
  align-items: center;
  justify-content: space-between;
  gap: 50px;
  overflow: hidden;
  border: 1px solid
    rgba(156, 104, 255, 0.21);
  border-radius: 28px;
  margin:
    35px clamp(22px, 6vw, 100px)
    105px;
  padding:
    50px clamp(28px, 5vw, 70px);
  background:
    radial-gradient(
      circle at 82% 40%,
      rgba(222, 58, 200, 0.2),
      transparent 31%
    ),
    radial-gradient(
      circle at 15% 30%,
      rgba(77, 91, 230, 0.2),
      transparent 32%
    ),
    linear-gradient(
      135deg,
      rgba(18, 23, 54, 0.98),
      rgba(11, 11, 37, 0.98)
    );
}

.marketing-cta > div:first-child {
  max-width: 800px;
}

.marketing-cta > div:first-child > span {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #c28dfc;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.marketing-cta h2 {
  margin: 18px 0 13px;
  font-size:
    clamp(31px, 4vw, 55px);
  letter-spacing: -0.055em;
  line-height: 1.06;
}

.marketing-cta p {
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.7;
}

.marketing-cta > div:last-child {
  display: flex;
  min-width: 190px;
  flex-direction: column;
  gap: 10px;
}

.pricing-page,
.marketing-content-page {
  padding-bottom: 100px;
}

.pricing-hero,
.content-page-hero {
  display: grid;
  min-height: 480px;
  place-content: center;
  justify-items: center;
  padding: 80px 22px 60px;
  text-align: center;
}

.pricing-hero > span,
.content-page-hero > span {
  display: flex;
  align-items: center;
  gap: 7px;
}

.pricing-hero h1,
.content-page-hero h1 {
  max-width: 950px;
  margin: 20px 0 15px;
  font-size:
    clamp(43px, 6.5vw, 82px);
  letter-spacing: -0.067em;
  line-height: 1;
}

.pricing-hero p,
.content-page-hero p {
  max-width: 730px;
  margin: 0;
  color: var(--aimers-text-muted);
  font-size: 15px;
  line-height: 1.75;
}

.billing-toggle {
  display: flex;
  border: 1px solid
    var(--aimers-border);
  border-radius: 13px;
  margin-top: 30px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.025);
}

.billing-toggle button {
  min-height: 37px;
  border: 0;
  border-radius: 9px;
  padding: 0 13px;
  color: var(--aimers-text-muted);
  background: transparent;
  font-size: 10px;
}

.billing-toggle button.active {
  color: white;
  background:
    rgba(133, 79, 225, 0.22);
}

.billing-toggle span {
  margin-left: 6px;
  color: #5ee6a0;
  font-size: 7px;
}

.pricing-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 13px;
  padding:
    0 clamp(20px, 5vw, 80px);
}

.pricing-card {
  position: relative;
  min-height: 610px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 21px;
  padding: 25px;
  background:
    linear-gradient(
      155deg,
      rgba(13, 18, 40, 0.96),
      rgba(7, 10, 24, 0.96)
    );
}

.pricing-card.featured {
  border-color:
    rgba(171, 99, 255, 0.5);
  box-shadow:
    0 0 48px rgba(139, 92, 246, 0.14);
}

.popular-label {
  position: absolute;
  top: -13px;
  left: 50%;
  display: flex;
  min-height: 27px;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 0 11px;
  transform: translateX(-50%);
  background: var(--aimers-gradient-primary);
  font-size: 7px;
  font-weight: 800;
  white-space: nowrap;
}

.pricing-card h2 {
  margin: 8px 0;
  font-size: 23px;
}

.pricing-card header p {
  min-height: 68px;
  margin: 0;
  color: var(--aimers-text-muted);
  font-size: 11px;
  line-height: 1.6;
}

.plan-price {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-top: 22px;
}

.plan-price strong {
  font-size: 40px;
  letter-spacing: -0.05em;
}

.plan-price span {
  padding-bottom: 7px;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.billing-note {
  display: block;
  min-height: 22px;
  margin-top: 4px;
  color: var(--aimers-text-muted);
  font-size: 7px;
}

.pricing-card > a {
  width: 100%;
  margin-top: 17px;
}

.plan-features {
  display: grid;
  gap: 13px;
  border-top: 1px solid
    var(--aimers-border-soft);
  margin-top: 25px;
  padding-top: 23px;
}

.plan-features span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aimers-text-secondary);
  font-size: 10px;
}

.plan-features svg {
  color: #5ee6a0;
}

.institution-pricing {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 24px;
  margin:
    60px clamp(20px, 5vw, 80px);
  padding: 40px;
  background:
    radial-gradient(
      circle at 85% 20%,
      rgba(139, 57, 224, 0.16),
      transparent 32%
    ),
    var(--aimers-surface-1);
}

.institution-pricing > div {
  max-width: 780px;
}

.institution-pricing h2 {
  margin: 15px 0 10px;
  font-size:
    clamp(28px, 3.8vw, 48px);
  letter-spacing: -0.05em;
}

.institution-pricing p {
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.pricing-faq {
  max-width: 950px;
  margin: 100px auto 0;
  padding: 0 20px;
}

.pricing-faq > div {
  display: grid;
  gap: 9px;
}

.pricing-faq article {
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 14px;
  background: var(--aimers-surface-1);
}

.pricing-faq article > button {
  display: flex;
  width: 100%;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  border: 0;
  padding: 0 18px;
  color: white;
  background: transparent;
  text-align: left;
}

.pricing-faq article p {
  margin: 0;
  padding: 0 18px 19px;
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.content-page-hero > div {
  display: flex;
  gap: 10px;
  margin-top: 28px;
}

.content-page-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 13px;
  padding:
    0 clamp(20px, 7vw, 110px);
}

.content-page-grid article {
  min-height: 280px;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 20px;
  padding: 25px;
  background: var(--aimers-surface-1);
}

.content-page-grid article > span {
  display: grid;
  width: 47px;
  height: 47px;
  place-items: center;
  border-radius: 14px;
  color: #bd82ff;
  background:
    rgba(137, 75, 230, 0.12);
}

.content-page-grid h2 {
  margin: 26px 0 10px;
  font-size: 20px;
}

.content-page-grid p {
  color: var(--aimers-text-muted);
  line-height: 1.65;
}

.marketing-auth-page {
  display: grid;
  min-height: 100vh;
  grid-template-columns:
    minmax(430px, 0.95fr)
    minmax(480px, 1.05fr);
}

.auth-visual-panel {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: space-between;
  padding:
    35px clamp(35px, 6vw, 90px)
    80px;
  background:
    radial-gradient(
      circle at 20% 75%,
      rgba(42, 104, 220, 0.19),
      transparent 31%
    ),
    radial-gradient(
      circle at 80% 25%,
      rgba(164, 58, 224, 0.2),
      transparent 35%
    ),
    linear-gradient(
      145deg,
      #060a1a,
      #08081d
    );
}

.auth-visual-panel > div h1 {
  max-width: 690px;
  margin: 18px 0;
  font-size:
    clamp(41px, 5.5vw, 73px);
  letter-spacing: -0.065em;
  line-height: 1;
}

.auth-visual-panel > div > p {
  max-width: 620px;
  color: var(--aimers-text-secondary);
  line-height: 1.75;
}

.auth-benefits {
  display: grid;
  gap: 13px;
  margin-top: 30px;
}

.auth-benefits span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aimers-text-secondary);
  font-size: 11px;
}

.auth-benefits svg {
  color: #5ee6a0;
}

.auth-form-panel {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 30px;
  background: var(--aimers-bg-primary);
}

.auth-form-card {
  width: min(440px, 100%);
}

.auth-form-card > span {
  color: #aa85d7;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.auth-form-card h2 {
  margin: 14px 0 9px;
  font-size: 35px;
  letter-spacing: -0.05em;
}

.auth-form-card > p {
  margin: 0;
  color: var(--aimers-text-muted);
  line-height: 1.6;
}

.auth-form-card form {
  display: grid;
  gap: 17px;
  margin-top: 30px;
}

.auth-form-card form > label {
  display: grid;
  gap: 8px;
}

.auth-form-card form > label > span {
  color: var(--aimers-text-secondary);
  font-size: 10px;
}

.auth-form-card form > label > div {
  display: grid;
  min-height: 48px;
  grid-template-columns: 24px 1fr;
  align-items: center;
  border: 1px solid
    var(--aimers-border);
  border-radius: 12px;
  padding: 0 13px;
  color: var(--aimers-text-muted);
  background: var(--aimers-surface-1);
}

.auth-form-card input {
  min-width: 0;
  border: 0;
  outline: 0;
  color: white;
  background: transparent;
}

.auth-form-card input::placeholder {
  color: var(--aimers-text-faint);
}

.auth-form-card form > button {
  margin-top: 4px;
}

.auth-form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.auth-form-options label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.auth-form-options a,
.auth-form-card footer a {
  color: #ba8cff;
  text-decoration: none;
}

.auth-form-card footer {
  margin-top: 24px;
  color: var(--aimers-text-muted);
  font-size: 10px;
  text-align: center;
}

.auth-form-card footer a {
  margin-left: 5px;
}

.marketing-footer {
  border-top: 1px solid
    var(--aimers-border-soft);
  padding:
    65px clamp(22px, 6vw, 100px)
    25px;
  background: rgba(3, 6, 16, 0.9);
}

.footer-main {
  display: grid;
  grid-template-columns:
    minmax(230px, 1.4fr)
    repeat(3, minmax(100px, 0.55fr))
    minmax(240px, 1fr);
  gap: 35px;
}

.footer-brand-column > p,
.footer-newsletter p {
  color: var(--aimers-text-muted);
  font-size: 10px;
  line-height: 1.65;
}

.footer-contact {
  display: grid;
  gap: 8px;
  margin-top: 20px;
  color: var(--aimers-text-muted);
  font-size: 9px;
}

.footer-contact span {
  display: flex;
  align-items: center;
  gap: 7px;
}

.footer-link-column {
  display: grid;
  align-content: start;
  gap: 12px;
}

.footer-link-column strong,
.footer-newsletter > strong {
  margin-bottom: 7px;
  font-size: 10px;
}

.footer-link-column a {
  color: var(--aimers-text-muted);
  font-size: 9px;
  text-decoration: none;
}

.footer-link-column a:hover {
  color: white;
}

.footer-newsletter form {
  display: grid;
  min-height: 43px;
  grid-template-columns: 1fr auto;
  border: 1px solid
    var(--aimers-border);
  border-radius: 11px;
  margin-top: 16px;
  padding: 4px;
  background: var(--aimers-surface-1);
}

.footer-newsletter input {
  min-width: 0;
  border: 0;
  outline: 0;
  padding: 0 9px;
  color: white;
  background: transparent;
  font-size: 9px;
}

.footer-newsletter button {
  border: 0;
  border-radius: 8px;
  padding: 0 13px;
  color: white;
  background: var(--aimers-gradient-primary);
  font-size: 8px;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid
    var(--aimers-border-soft);
  margin-top: 50px;
  padding-top: 20px;
  color: var(--aimers-text-faint);
  font-size: 8px;
}

.footer-bottom > div {
  display: flex;
  gap: 8px;
}

.footer-bottom button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid
    var(--aimers-border-soft);
  border-radius: 8px;
  color: var(--aimers-text-muted);
  background: rgba(255, 255, 255, 0.02);
}

@media (max-width: 1150px) {
  .marketing-navigation {
    gap: 13px;
  }

  .marketing-navigation a {
    font-size: 9px;
  }

  .marketing-hero {
    grid-template-columns: 1fr;
    padding-top: 100px;
  }

  .hero-content {
    max-width: 900px;
  }

  .hero-product-preview {
    width: min(850px, 100%);
    justify-self: center;
  }

  .preview-window {
    transform: none;
  }

  .intelligence-section {
    grid-template-columns: 1fr;
  }

  .intelligence-copy {
    max-width: 780px;
  }

  .intelligence-visual {
    width: min(700px, 100%);
    justify-self: center;
  }

  .pricing-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .footer-main {
    grid-template-columns:
      1.4fr repeat(3, 0.6fr);
  }

  .footer-newsletter {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .marketing-header {
    grid-template-columns: 1fr auto;
  }

  .marketing-navigation {
    position: fixed;
    top: 72px;
    right: 0;
    left: 0;
    display: none;
    align-items: stretch;
    flex-direction: column;
    border-bottom: 1px solid
      var(--aimers-border);
    padding: 18px;
    background:
      rgba(4, 7, 18, 0.98);
    backdrop-filter: blur(20px);
  }

  .marketing-navigation.open {
    display: flex;
  }

  .marketing-navigation > a {
    min-height: 42px;
    padding: 12px;
    font-size: 11px;
  }

  .marketing-navigation
    > a.active::after {
    display: none;
  }

  .marketing-login-link,
  .marketing-header-actions
    > .marketing-primary-button {
    display: none;
  }

  .marketing-menu-button {
    display: grid;
  }

  .mobile-auth-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
    border-top: 1px solid
      var(--aimers-border-soft);
    margin-top: 10px;
    padding-top: 16px;
  }

  .mobile-auth-actions > a {
    display: flex;
    min-height: 42px;
    align-items: center;
    justify-content: center;
    border: 1px solid
      var(--aimers-border);
    border-radius: 10px;
    text-decoration: none;
  }

  .marketing-feature-grid,
  .audience-grid,
  .content-page-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .marketing-proof-strip {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .marketing-cta {
    align-items: flex-start;
    flex-direction: column;
  }

  .marketing-cta > div:last-child {
    width: 100%;
    min-width: 0;
  }

  .marketing-auth-page {
    grid-template-columns: 1fr;
  }

  .auth-visual-panel {
    min-height: 530px;
  }

  .auth-form-panel {
    min-height: 700px;
  }
}

@media (max-width: 650px) {
  .marketing-header {
    min-height: 64px;
    padding: 0 13px;
  }

  .marketing-navigation {
    top: 64px;
  }

  .marketing-brand small {
    display: none;
  }

  .marketing-hero {
    min-height: auto;
    padding:
      75px 16px 70px;
  }

  .hero-content h1 {
    font-size:
      clamp(46px, 14vw, 68px);
  }

  .hero-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions a {
    width: 100%;
  }

  .hero-product-preview {
    overflow-x: hidden;
  }

  .preview-window {
    min-width: 590px;
    transform: scale(0.62);
    transform-origin: top left;
  }

  .hero-product-preview {
    height: 295px;
  }

  .marketing-proof-strip,
  .marketing-feature-grid,
  .audience-grid,
  .content-page-grid,
  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .marketing-proof-strip span {
    min-height: 62px;
  }

  .marketing-section {
    padding: 80px 16px;
  }

  .outcome-list {
    grid-template-columns: 1fr;
  }

  .intelligence-visual {
    min-height: 430px;
    transform: scale(0.75);
  }

  .marketing-cta {
    margin: 20px 14px 75px;
    padding: 30px 20px;
  }

  .pricing-hero,
  .content-page-hero {
    min-height: 430px;
    padding: 70px 16px 50px;
  }

  .pricing-card {
    min-height: auto;
  }

  .institution-pricing {
    align-items: stretch;
    flex-direction: column;
    margin: 45px 14px;
    padding: 25px;
  }

  .content-page-hero > div {
    width: 100%;
    flex-direction: column;
  }

  .auth-visual-panel {
    min-height: 560px;
    padding: 25px 20px 55px;
  }

  .auth-form-panel {
    padding: 25px 18px;
  }

  .footer-main {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .footer-brand-column,
  .footer-newsletter {
    grid-column: 1 / -1;
  }

  .footer-bottom {
    align-items: flex-start;
    flex-direction: column;
    gap: 15px;
  }
}
EOF

echo "AIMERS OS marketing website source created."
