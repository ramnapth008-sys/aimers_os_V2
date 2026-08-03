import {
  ArrowRight,
  Brain,
  Check,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "react-router-dom";

export function AuthPage() {
  const location = useLocation();

  const register =
    location.pathname === "/register";

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

          <form
            onSubmit={(event) =>
              event.preventDefault()
            }
          >
            {register && (
              <label>
                <span>Full name</span>

                <div>
                  <User size={16} />

                  <input
                    type="text"
                    placeholder="Your name"
                  />
                </div>
              </label>
            )}

            <label>
              <span>Email address</span>

              <div>
                <Mail size={16} />

                <input
                  type="email"
                  placeholder="student@example.com"
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

            {!register && (
              <div className="auth-form-options">
                <label>
                  <input type="checkbox" />
                  Remember me
                </label>

                <Link to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              className="marketing-primary-button"
              type="submit"
            >
              {register
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
