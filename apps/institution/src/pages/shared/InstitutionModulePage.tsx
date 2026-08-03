import {
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface InstitutionModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function InstitutionModulePage({
  eyebrow,
  title,
  description,
}: InstitutionModulePageProps) {
  return (
    <div className="institution-module-page">
      <header className="institution-module-hero">
        <div>
          <span>
            <Sparkles size={13} />
            {eyebrow}
          </span>

          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <button type="button">
          Generate report
          <ArrowRight size={14} />
        </button>
      </header>

      <section className="institution-module-metrics">
        <article>
          <span>
            <Building2 size={18} />
          </span>

          <div>
            <small>WORKSPACE</small>
            <strong>AIMERS Academy</strong>
          </div>
        </article>

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
            <small>DATA</small>
            <strong>Synchronised</strong>
          </div>
        </article>

        <article>
          <span>
            <ShieldCheck size={18} />
          </span>

          <div>
            <small>ACCESS</small>
            <strong>Role protected</strong>
          </div>
        </article>
      </section>

      <section className="institution-module-content">
        <article>
          <header>
            <div>
              <span>INSTITUTION WORKSPACE</span>
              <h2>{title} Overview</h2>
            </div>

            <button type="button">
              Configure view
            </button>
          </header>

          <div className="institution-module-placeholder">
            <span>
              <Brain size={43} />
            </span>

            <h3>
              {title} workspace prepared
            </h3>

            <p>
              The responsive institution
              interface, role boundary and
              analytics structure are ready.
              Real institution data will be
              connected through the authorised
              API.
            </p>
          </div>
        </article>

        <aside>
          <span>INSTITUTION AI</span>

          <h2>
            Cohort and outcome intelligence is
            ready.
          </h2>

          <p>
            AIMERS will combine student,
            teacher, batch, content and test
            information into aggregate
            institution-level insights.
          </p>

          <button type="button">
            Open institution guide
          </button>
        </aside>
      </section>
    </div>
  );
}
