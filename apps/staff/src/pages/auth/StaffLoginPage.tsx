import {
  ArrowRight,
  Brain,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Link } from "react-router-dom";

export function StaffLoginPage() {
  return (
    <div className="staff-login-page">
      <section className="staff-login-brand-panel">
        <Link to="/login">
          <span>
            <Brain size={27} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Mentor Intelligence
            </small>
          </div>
        </Link>

        <div>
          <span>
            AUTHORISED STAFF ACCESS
          </span>

          <h1>
            Support every student with better
            information.
          </h1>

          <p>
            Review assigned learners,
            understand academic risks and
            coordinate evidence-based
            interventions.
          </p>

          <section>
            <ShieldCheck size={18} />

            <div>
              <strong>
                Permission-aware access
              </strong>

              <small>
                Sensitive views and actions are
                securely audited.
              </small>
            </div>
          </section>
        </div>
      </section>

      <section className="staff-login-form-panel">
        <form
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <span>
            AIMERS MENTOR PORTAL
          </span>

          <h2>Staff sign in</h2>

          <p>
            Use your authorised AIMERS staff
            account.
          </p>

          <label>
            <span>Email address</span>

            <div>
              <Mail size={16} />

              <input
                type="email"
                placeholder="mentor@aimers.ai"
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

          <button type="submit">
            Sign in securely
            <ArrowRight size={15} />
          </button>

          <small>
            This portal is restricted to
            authorised AIMERS staff.
          </small>
        </form>
      </section>
    </div>
  );
}
