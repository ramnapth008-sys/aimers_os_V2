import {
  ArrowUpRight,
  Brain,
  ChartNoAxesCombined,
  CircleCheckBig,
  Sparkles,
} from "lucide-react";

interface ModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function ModulePage({
  eyebrow,
  title,
  description,
}: ModulePageProps) {
  return (
    <div className="module-page">
      <header className="module-hero">
        <div>
          <span>{eyebrow}</span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>

        <button type="button">
          <Sparkles size={17} />
          Open AI Assistant
        </button>
      </header>

      <section className="module-stat-grid">
        <article>
          <span>
            <CircleCheckBig size={17} />
          </span>

          <div>
            <small>STATUS</small>
            <strong>System Ready</strong>
          </div>
        </article>

        <article>
          <span>
            <ChartNoAxesCombined
              size={17}
            />
          </span>

          <div>
            <small>INSIGHTS</small>
            <strong>Live Intelligence</strong>
          </div>
        </article>

        <article>
          <span>
            <Brain size={17} />
          </span>

          <div>
            <small>AI ENGINE</small>
            <strong>Connected</strong>
          </div>
        </article>
      </section>

      <section className="module-content-grid">
        <article className="module-main-panel">
          <header>
            <div>
              <span>WORKSPACE</span>
              <h2>{title} Overview</h2>
            </div>

            <button type="button">
              View Details
              <ArrowUpRight size={15} />
            </button>
          </header>

          <div className="module-empty-visual">
            <div>
              <Brain size={42} />
            </div>

            <h3>
              {title} interface prepared
            </h3>

            <p>
              The responsive page shell and
              visual system are active. Real
              data and module functionality
              will be connected during its
              implementation milestone.
            </p>
          </div>
        </article>

        <aside className="module-side-panel">
          <span>AI SUMMARY</span>

          <h2>
            Your intelligence layer is ready.
          </h2>

          <p>
            AIMERS will analyse this module,
            connect it with your learning
            profile and generate personalised
            actions.
          </p>

          <button type="button">
            Configure Module
          </button>
        </aside>
      </section>
    </div>
  );
}
