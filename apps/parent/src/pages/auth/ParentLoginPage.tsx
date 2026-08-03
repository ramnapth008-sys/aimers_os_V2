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

export function ParentLoginPage() {
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

      if (
        !session.user.roles.includes(
          "PARENT",
        )
      ) {
        await logout();

        setError(
          "This account is not authorised for the parent portal.",
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
                Student-sensitive information
                remains protected.
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
