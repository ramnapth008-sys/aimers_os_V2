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
