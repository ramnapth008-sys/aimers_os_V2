import {
  useAuth,
} from "@aimers/auth";

import {
  ArrowRight,
  Brain,
  Check,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

const STUDENT_APP_URL =
  import.meta.env.VITE_STUDENT_APP_URL ??
  "http://localhost:5173/dashboard";

function resolveDestination(
  search: string,
): string {
  const returnTo =
    new URLSearchParams(search)
      .get("returnTo");

  if (!returnTo) {
    return STUDENT_APP_URL;
  }

  try {
    const destination =
      new URL(returnTo);

    const studentOrigin =
      new URL(
        STUDENT_APP_URL,
      ).origin;

    return destination.origin ===
      studentOrigin
      ? destination.toString()
      : STUDENT_APP_URL;
  } catch {
    return STUDENT_APP_URL;
  }
}

export function AuthPage() {
  const location = useLocation();

  const {
    login,
    register: createAccount,
    status,
  } = useAuth();

  const register =
    location.pathname ===
    "/register";

  const destination =
    useMemo(
      () =>
        resolveDestination(
          location.search,
        ),
      [location.search],
    );

  const [fullName, setFullName] =
    useState("");

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
      window.location.replace(
        destination,
      );
    }
  }, [
    status,
    loading,
    destination,
  ]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (register) {
        const parts =
          fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        const firstName =
          parts.shift() ?? "";

        const lastName =
          parts.join(" ");

        await createAccount({
          email,
          password,
          firstName,
          ...(lastName
            ? {
                lastName,
              }
            : {}),
        });
      } else {
        await login({
          email,
          password,
        });
      }

      window.location.assign(
        destination,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to continue.",
      );

      setLoading(false);
    }
  }

  return (
    <div className="marketing-auth-page">
      <section className="auth-visual-panel">
        <Link
          className="marketing-brand"
          to="/"
        >
          <span>
            <Brain size={26} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Your AI Education OS
            </small>
          </div>
        </Link>

        <div>
          <span className="section-label">
            PERSONAL LEARNING INTELLIGENCE
          </span>

          <h1>
            Your goals deserve a system built
            around you.
          </h1>

          <p>
            Plan better, learn with AI,
            practise intelligently and improve
            using evidence from your own
            progress.
          </p>

          <div className="auth-benefits">
            <span>
              <Check size={14} />
              Personalised learning profile
            </span>

            <span>
              <Check size={14} />
              Connected study modules
            </span>

            <span>
              <Check size={14} />
              Privacy and consent controls
            </span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-card">
          <span>
            {register
              ? "CREATE YOUR AIMERS ACCOUNT"
              : "WELCOME BACK"}
          </span>

          <h2>
            {register
              ? "Start your learning system"
              : "Sign in to AIMERS OS"}
          </h2>

          <p>
            {register
              ? "Start free. Payment details are not required."
              : "Continue where you stopped and open your Command Center."}
          </p>

          <form onSubmit={handleSubmit}>
            {register && (
              <label>
                <span>Full name</span>

                <div>
                  <User size={16} />

                  <input
                    required
                    minLength={2}
                    autoComplete="name"
                    type="text"
                    value={fullName}
                    placeholder="Your name"
                    onChange={(event) =>
                      setFullName(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </label>
            )}

            <label>
              <span>Email address</span>

              <div>
                <Mail size={16} />

                <input
                  required
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
              <span>Password</span>

              <div>
                <LockKeyhole size={16} />

                <input
                  required
                  minLength={register ? 12 : 1}
                  autoComplete={
                    register
                      ? "new-password"
                      : "current-password"
                  }
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

            {!register && (
              <div className="auth-form-options">
                <span>
                  Secure refresh session
                </span>

                <Link to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <div
                className="marketing-auth-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="marketing-primary-button"
              type="submit"
            >
              {loading
                ? "Please wait..."
                : register
                  ? "Create free account"
                  : "Sign in"}

              <ArrowRight size={15} />
            </button>
          </form>

          <footer>
            {register
              ? "Already have an account?"
              : "New to AIMERS?"}

            <Link
              to={
                register
                  ? "/login"
                  : "/register"
              }
            >
              {register
                ? "Sign in"
                : "Create account"}
            </Link>
          </footer>
        </div>
      </section>
    </div>
  );
}
