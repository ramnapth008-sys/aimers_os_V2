import {
  ArrowRight,
  Brain,
  FileText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

interface StaffModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function StaffModulePage({
  eyebrow,
  title,
  description,
}: StaffModulePageProps) {
  return (
    <div className="staff-module-page">
      <header className="staff-module-hero">
        <div>
          <span>
            <Sparkles size={13} />
            {eyebrow}
          </span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>

        <button type="button">
          Create mentor report
          <ArrowRight size={14} />
        </button>
      </header>

      <section className="staff-module-metrics">
        <article>
          <span>
            <Users size={18} />
          </span>

          <div>
            <small>ACCESS SCOPE</small>
            <strong>
              Assigned students
            </strong>
          </div>
        </article>

        <article>
          <span>
            <Brain size={18} />
          </span>

          <div>
            <small>AI SUPPORT</small>
            <strong>
              Mentor AI connected
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FileText size={18} />
          </span>

          <div>
            <small>REPORTING</small>
            <strong>
              Data synchronised
            </strong>
          </div>
        </article>

        <article>
          <span>
            <ShieldCheck size={18} />
          </span>

          <div>
            <small>SECURITY</small>
            <strong>
              Access audited
            </strong>
          </div>
        </article>
      </section>

      <section className="staff-module-content">
        <article>
          <header>
            <div>
              <span>MENTOR WORKSPACE</span>

              <h2>
                {title} Overview
              </h2>
            </div>

            <button type="button">
              Configure view
            </button>
          </header>

          <div className="staff-module-placeholder">
            <span>
              <Brain size={43} />
            </span>

            <h3>
              {title} workspace prepared
            </h3>

            <p>
              The responsive mentor interface,
              permissions boundary and module
              layout are ready. Real student
              information will be connected
              through the authorised API.
            </p>
          </div>
        </article>

        <aside>
          <span>AI MENTOR SUMMARY</span>

          <h2>
            Student-support intelligence is
            ready.
          </h2>

          <p>
            AIMERS will combine academic
            progress, test outcomes, study
            behaviour and interventions while
            respecting role and consent rules.
          </p>

          <button type="button">
            Open documentation
          </button>
        </aside>
      </section>
    </div>
  );
}
