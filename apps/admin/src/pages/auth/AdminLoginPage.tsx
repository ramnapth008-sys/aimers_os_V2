import {
  useAuth,
} from "@aimers/auth";

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

import {
  useNavigate,
} from "react-router-dom";

export function AdminLoginPage() {
  const navigate = useNavigate();

  const {
    login,
    logout,
    status,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (
      status === "authenticated" &&
      !loading
    ) {
      void logout();
    }
  }, [status, loading, logout]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session =
        await login({
          email,
          password,
        });

      const allowed =
        session.user.roles.includes(
          "ADMIN",
        ) ||
        session.user.roles.includes(
          "SUPER_ADMIN",
        );

      if (!allowed) {
        await logout();

        setError(
          "This account is not authorised for company administration.",
        );

        setLoading(false);
        return;
      }

      navigate(
        "/overview",
        {
          replace: true,
        },
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to sign in.",
      );

      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-visual">
        <div className="admin-login-brand">
          <span>
            <Brain size={27} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Company Command Centre
            </small>
          </div>
        </div>

        <div>
          <span>
            RESTRICTED COMPANY ACCESS
          </span>

          <h1>
            Operate AIMERS with complete
            accountability.
          </h1>

          <p>
            Review platform operations,
            customers, security, AI systems
            and company-level intelligence.
          </p>

          <section>
            <ShieldCheck size={18} />

            <div>
              <strong>
                Administrative role checks
              </strong>

              <small>
                Access is enforced by the API,
                not by the browser interface.
              </small>
            </div>
          </section>
        </div>
      </section>

      <section className="admin-login-form">
        <form onSubmit={handleSubmit}>
          <span>
            AIMERS ADMINISTRATION
          </span>

          <h2>Administrator sign in</h2>

          <p>
            Use an authorised AIMERS company
            account.
          </p>

          <label>
            <span>Email address</span>

            <div>
              <Mail size={16} />

              <input
                required
                autoComplete="email"
                type="email"
                value={email}
                placeholder="admin@aimers.ai"
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
              className="admin-login-error"
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
              ? "Verifying access..."
              : "Open command centre"}

            <ArrowRight size={15} />
          </button>
        </form>
      </section>
    </main>
  );
}
