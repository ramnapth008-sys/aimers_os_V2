import {
  ArrowRight,
  BarChart3,
  Brain,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface AdminModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function AdminModulePage({
  eyebrow,
  title,
  description,
}: AdminModulePageProps) {
  return (
    <div className="admin-module-page">
      <header className="admin-module-hero">
        <div>
          <span>
            <Sparkles size={13} />
            {eyebrow}
          </span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>

        <button type="button">
          Create report
          <ArrowRight size={15} />
        </button>
      </header>

      <section className="admin-module-metrics">
        <article>
          <span>
            <BarChart3 size={18} />
          </span>

          <div>
            <small>ANALYTICS</small>
            <strong>Live intelligence</strong>
          </div>
        </article>

        <article>
          <span>
            <Database size={18} />
          </span>

          <div>
            <small>DATA STATUS</small>
            <strong>Fully synchronised</strong>
          </div>
        </article>

        <article>
          <span>
            <Brain size={18} />
          </span>

          <div>
            <small>AI LAYER</small>
            <strong>Connected</strong>
          </div>
        </article>

        <article>
          <span>
            <ShieldCheck size={18} />
          </span>

          <div>
            <small>ACCESS</small>
            <strong>Authorised</strong>
          </div>
        </article>
      </section>

      <section className="admin-module-content">
        <article>
          <header>
            <div>
              <span>WORKSPACE</span>
              <h2>{title} Intelligence</h2>
            </div>

            <button type="button">
              Configure view
            </button>
          </header>

          <div className="admin-module-placeholder">
            <span>
              <Brain size={44} />
            </span>

            <h3>
              {title} foundation is ready
            </h3>

            <p>
              The responsive company
              administration shell, permissions
              boundary and visual workspace are
              prepared. Real API data will be
              connected during this module's
              implementation phase.
            </p>
          </div>
        </article>

        <aside>
          <span>EXECUTIVE SUMMARY</span>

          <h2>
            AIMERS intelligence is connected.
          </h2>

          <p>
            This module will provide aggregate,
            pseudonymised and permission-aware
            insights for authorised company
            operations.
          </p>

          <button type="button">
            Open documentation
          </button>
        </aside>
      </section>
    </div>
  );
}
