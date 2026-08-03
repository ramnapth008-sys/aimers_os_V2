import {
  useAuth,
  type UserRole,
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
  Link,
  useNavigate,
} from "react-router-dom";

const ALLOWED_ROLES:
  readonly UserRole[] = [
    "MENTOR",
    "TEACHER",
    "STAFF",
  ];

export function StaffLoginPage() {
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
        ALLOWED_ROLES.some(
          (role) =>
            session.user.roles.includes(
              role,
            ),
        );

      if (!allowed) {
        await logout();

        setError(
          "This account is not authorised for the staff portal.",
        );

        setLoading(false);
        return;
      }

      navigate(
        "/dashboard",
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
        <form onSubmit={handleSubmit}>
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
                required
                autoComplete="email"
                type="email"
                value={email}
                placeholder="mentor@aimers.ai"
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
              className="staff-login-error"
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
              ? "Signing in..."
              : "Sign in securely"}

            <ArrowRight size={15} />
          </button>

          <small>
            Access is verified by the AIMERS
            API and restricted by role.
          </small>
        </form>
      </section>
    </div>
  );
}
