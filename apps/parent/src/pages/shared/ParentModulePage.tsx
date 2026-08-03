import {
  ArrowRight,
  BarChart3,
  Brain,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface ParentModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function ParentModulePage({
  eyebrow,
  title,
  description,
}: ParentModulePageProps) {
  return (
    <div className="parent-module-page">
      <header className="parent-module-hero">
        <div>
          <span>
            <Sparkles size={13} />
            {eyebrow}
          </span>

          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <button type="button">
          Download summary
          <ArrowRight size={14} />
        </button>
      </header>

      <section className="parent-module-metrics">
        <article>
          <span>
            <BarChart3 size={18} />
          </span>

          <div>
            <small>PROGRESS DATA</small>
            <strong>Updated today</strong>
          </div>
        </article>

        <article>
          <span>
            <Brain size={18} />
          </span>

          <div>
            <small>AI SUMMARY</small>
            <strong>Available</strong>
          </div>
        </article>

        <article>
          <span>
            <FileText size={18} />
          </span>

          <div>
            <small>REPORTING</small>
            <strong>Ready</strong>
          </div>
        </article>

        <article>
          <span>
            <ShieldCheck size={18} />
          </span>

          <div>
            <small>PRIVACY</small>
            <strong>Protected view</strong>
          </div>
        </article>
      </section>

      <section className="parent-module-content">
        <article>
          <header>
            <div>
              <span>PARENT WORKSPACE</span>
              <h2>{title} Overview</h2>
            </div>

            <button type="button">
              Configure view
            </button>
          </header>

          <div className="parent-module-placeholder">
            <span>
              <Brain size={43} />
            </span>

            <h3>
              {title} workspace prepared
            </h3>

            <p>
              The responsive parent interface
              and privacy-aware reporting
              structure are ready. Real student
              summaries will be connected
              through the authorised API.
            </p>
          </div>
        </article>

        <aside>
          <span>PARENT GUIDANCE</span>

          <h2>
            Support progress without creating
            unnecessary pressure.
          </h2>

          <p>
            AIMERS will present meaningful
            academic trends and support actions
            while protecting student autonomy
            and private information.
          </p>

          <button type="button">
            Open parent guide
          </button>
        </aside>
      </section>
    </div>
  );
}
