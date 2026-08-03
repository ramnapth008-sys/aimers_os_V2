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
