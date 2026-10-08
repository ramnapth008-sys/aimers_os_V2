import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface ModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function ModulePage({ eyebrow, title, description }: ModulePageProps) {
  return (
    <div className="module-page">
      <header className="module-hero">
        <div>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <section className="module-main-panel">
        <header>
          <div>
            <span>PLANNED FEATURE</span>
            <h2>This space is being built.</h2>
          </div>
        </header>
        <div className="module-empty-visual">
          <div>
            <BookOpen size={38} />
          </div>
          <h3>{title} is not available yet.</h3>
          <p>
            For now, continue with your study plan or bring your question to the
            AI companion.
          </p>
          <Link
            className="today-primary"
            to="/planner"
            style={{ marginTop: 24 }}
          >
            Open my study plan <ArrowRight size={16} />
          </Link>
          <Link
            className="today-text-link"
            to="/ai-mentor"
            style={{ marginTop: 20 }}
          >
            <Sparkles size={16} />
            Talk to Aimers
          </Link>
        </div>
      </section>
    </div>
  );
}
