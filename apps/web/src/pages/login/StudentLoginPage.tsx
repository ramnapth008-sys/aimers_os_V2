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
  useMemo,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import "./login.css";

function resolveReturnPath(
  search:
    string,
): string {
  const requested =
    new URLSearchParams(
      search,
    ).get(
      "returnTo",
    );

  if (!requested) {
    return "/dashboard";
  }

  try {
    const target =
      new URL(
        requested,
        window.location.origin,
      );

    if (
      target.origin !==
      window.location.origin
    ) {
      return "/dashboard";
    }

    return (
      target.pathname +
      target.search +
      target.hash
    );
  } catch {
    return "/dashboard";
  }
}

export function StudentLoginPage() {
  const location =
    useLocation();

  const {
    login,
    logout,
    status,
  } = useAuth();

  const destination =
    useMemo(
      () =>
        resolveReturnPath(
          location.search,
        ),
      [location.search],
    );

  const [
    email,
    setEmail,
  ] = useState(
    "",
  );

  const [
    password,
    setPassword,
  ] = useState(
    "",
  );

  const [
    loading,
    setLoading,
  ] = useState(
    false,
  );

  const [
    error,
    setError,
  ] = useState(
    "",
  );

  useEffect(() => {
    if (
      status ===
        "authenticated" &&
      !loading
    ) {
      window.location.replace(
        destination,
      );
    }
  }, [
    destination,
    loading,
    status,
  ]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(
      true,
    );

    try {
      const session =
        await login({
          email,
          password,
        });

      if (
        !session.user.roles
          .includes(
            "STUDENT",
          )
      ) {
        await logout();

        setError(
          "This account does not have access to the student workspace.",
        );

        setLoading(
          false,
        );

        return;
      }

      window.location.replace(
        destination,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to sign in.",
      );

      setLoading(
        false,
      );
    }
  }

  return (
    <main className="student-login-page">
      <section className="student-login-visual">
        <div className="student-login-brand">
          <span>
            <Brain size={28} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Your AI Education OS
            </small>
          </div>
        </div>

        <div className="student-login-message">
          <span>
            PERSONAL LEARNING INTELLIGENCE
          </span>

          <h1>
            Continue your learning system.
          </h1>

          <p>
            Return to your study plan, AI Mentor,
            progress evidence and privacy-controlled
            intelligence workspace.
          </p>

          <article>
            <ShieldCheck size={19} />

            <div>
              <strong>
                Secure student session
              </strong>

              <small>
                Access is verified by the AIMERS API
                and restricted by account role.
              </small>
            </div>
          </article>
        </div>
      </section>

      <section className="student-login-form-panel">
        <form
          className="student-login-card"
          onSubmit={
            handleSubmit
          }
        >
          <span>
            WELCOME BACK
          </span>

          <h2>
            Sign in to AIMERS OS
          </h2>

          <p>
            Continue from the exact place you stopped.
          </p>

          <label>
            <span>
              Email address
            </span>

            <div>
              <Mail size={17} />

              <input
                required
                autoFocus
                autoComplete="email"
                type="email"
                value={email}
                placeholder="student@example.com"
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
              />
            </div>
          </label>

          <label>
            <span>
              Password
            </span>

            <div>
              <LockKeyhole size={17} />

              <input
                required
                autoComplete="current-password"
                type="password"
                value={password}
                placeholder="Enter your password"
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
              className="student-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            disabled={
              loading ||
              status ===
                "loading"
            }
            type="submit"
          >
            {loading
              ? "Signing in…"
              : "Open student workspace"}

            <ArrowRight size={16} />
          </button>

          <small className="student-login-security">
            Your refresh session is stored in a
            secure HTTP-only cookie.
          </small>
        </form>
      </section>
    </main>
  );
}
