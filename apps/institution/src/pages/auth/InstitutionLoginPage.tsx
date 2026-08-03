import {
  ArrowRight,
  Brain,
  Building2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

const SESSION_KEY =
  "aimers_institution_session";

const DEMO_EMAIL =
  "admin@academy.test";

const DEMO_PASSWORD =
  "Academy@123";

export function InstitutionLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState(DEMO_EMAIL);

  const [password, setPassword] =
    useState(DEMO_PASSWORD);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (
      localStorage.getItem(SESSION_KEY)
    ) {
      navigate(
        "/dashboard",
        {
          replace: true,
        },
      );
    }
  }, [navigate]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      normalizedEmail !== DEMO_EMAIL ||
      password !== DEMO_PASSWORD
    ) {
      setError(
        "Incorrect institution demo credentials.",
      );

      return;
    }

    setLoading(true);

    const session = {
      email: normalizedEmail,
      role: "institution-admin",
      institution:
        "AIMERS Academy",
      createdAt: Date.now(),
      expiresAt:
        Date.now() +
        8 * 60 * 60 * 1000,
    };

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session),
    );

    navigate(
      "/dashboard",
      {
        replace: true,
      },
    );
  }

  return (
    <div className="institution-login-page">
      <section className="institution-login-visual">
        <div className="institution-login-brand">
          <span>
            <Brain size={27} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Institution Intelligence
            </small>
          </div>
        </div>

        <div>
          <span>
            INSTITUTION LEARNING OPERATING
            SYSTEM
          </span>

          <h1>
            Improve outcomes across every
            batch and classroom.
          </h1>

          <p>
            Connect students, teachers,
            assessments, content and
            interventions through one
            institution intelligence
            platform.
          </p>

          <section>
            <ShieldCheck size={18} />

            <div>
              <strong>
                Role-based institution
                access
              </strong>

              <small>
                Sensitive student and staff
                views are securely
                controlled.
              </small>
            </div>
          </section>
        </div>
      </section>

      <section className="institution-login-form">
        <form onSubmit={handleSubmit}>
          <span>
            AIMERS INSTITUTION PORTAL
          </span>

          <h2>Institution sign in</h2>

          <p>
            Use your authorised institution
            administrator account.
          </p>

          <div className="institution-demo-credentials">
            <strong>
              Development credentials
            </strong>

            <span>
              Email: {DEMO_EMAIL}
            </span>

            <span>
              Password: {DEMO_PASSWORD}
            </span>
          </div>

          <label>
            <span>Institution email</span>

            <div>
              <Mail size={16} />

              <input
                required
                autoComplete="email"
                type="email"
                value={email}
                placeholder="admin@institution.edu"
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
              />
            </div>
          </label>

          <label>
            <span>Password</span>

            <div>
              <LockKeyhole size={16} />

              <input
                required
                autoComplete="current-password"
                type="password"
                value={password}
                placeholder="Enter password"
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
              />
            </div>
          </label>

          {error && (
            <div
              className="institution-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
          >
            <Building2 size={15} />

            {loading
              ? "Opening workspace..."
              : "Open institution workspace"}

            <ArrowRight size={15} />
          </button>

          <small>
            Demo authentication is active
            during frontend development.
          </small>
        </form>
      </section>
    </div>
  );
}
