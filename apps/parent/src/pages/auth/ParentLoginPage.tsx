import {
  ArrowRight,
  Brain,
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
  "aimers_parent_session";

const DEMO_EMAIL =
  "parent@aimers.test";

const DEMO_PASSWORD =
  "Parent@123";

export function ParentLoginPage() {
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
        "Incorrect demo email or password.",
      );

      return;
    }

    setLoading(true);

    const session = {
      email: normalizedEmail,
      role: "parent",
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
    <div className="parent-login-page">
      <section className="parent-login-visual">
        <div className="parent-login-brand">
          <span>
            <Brain size={27} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>Parent Portal</small>
          </div>
        </div>

        <div>
          <span>
            RESPECTFUL PARENT SUPPORT
          </span>

          <h1>
            Understand progress without
            increasing pressure.
          </h1>

          <p>
            Follow meaningful learning
            trends, receive academic updates
            and help your child maintain a
            healthy, consistent study system.
          </p>

          <section>
            <ShieldCheck size={18} />

            <div>
              <strong>
                Privacy-aware reporting
              </strong>

              <small>
                Student-sensitive
                information remains
                protected.
              </small>
            </div>
          </section>
        </div>
      </section>

      <section className="parent-login-form">
        <form onSubmit={handleSubmit}>
          <span>
            AIMERS PARENT PORTAL
          </span>

          <h2>Parent sign in</h2>

          <p>
            Use your verified parent or
            guardian account.
          </p>

          <div className="parent-demo-credentials">
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
            <span>Email address</span>

            <div>
              <Mail size={16} />

              <input
                required
                autoComplete="email"
                type="email"
                value={email}
                placeholder="parent@example.com"
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
              className="parent-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
          >
            {loading
              ? "Opening dashboard..."
              : "Sign in securely"}

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
