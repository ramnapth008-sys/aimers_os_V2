#!/usr/bin/env bash

set -euo pipefail

echo "Adding demo authentication to parent and institution portals..."

# ============================================================
# PARENT PROTECTED ROUTE
# ============================================================

cat > apps/parent/src/app/router/ParentProtectedRoute.tsx <<'EOF'
import {
  Navigate,
  Outlet,
} from "react-router-dom";

const SESSION_KEY =
  "aimers_parent_session";

export function ParentProtectedRoute() {
  const rawSession =
    localStorage.getItem(SESSION_KEY);

  if (!rawSession) {
    return (
      <Navigate
        replace
        to="/login"
      />
    );
  }

  try {
    const session = JSON.parse(
      rawSession,
    ) as {
      expiresAt?: number;
    };

    if (
      !session.expiresAt ||
      session.expiresAt < Date.now()
    ) {
      localStorage.removeItem(
        SESSION_KEY,
      );

      return (
        <Navigate
          replace
          to="/login"
        />
      );
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);

    return (
      <Navigate
        replace
        to="/login"
      />
    );
  }

  return <Outlet />;
}
EOF

# ============================================================
# PARENT LOGIN
# ============================================================

cat > apps/parent/src/pages/auth/ParentLoginPage.tsx <<'EOF'
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
EOF

# ============================================================
# PARENT ROUTER
# ============================================================

python3 - <<'PY'
from pathlib import Path

path = Path(
    "apps/parent/src/app/router/ParentRouter.tsx"
)

text = path.read_text()

if 'ParentProtectedRoute' not in text:
    text = text.replace(
        'import { ParentShell } from "../shell/ParentShell";',
        'import { ParentShell } from "../shell/ParentShell";\n'
        'import { ParentProtectedRoute } from "./ParentProtectedRoute";'
    )

text = text.replace(
    '<Route element={<ParentShell />}>',
    '<Route element={<ParentProtectedRoute />}>\n'
    '          <Route element={<ParentShell />}>'
)

old_end = '''          <Route
            path="*"
            element={
              <Navigate
                replace
                to="/dashboard"
              />
            }
          />
        </Route>'''

new_end = '''          <Route
            path="*"
            element={
              <Navigate
                replace
                to="/dashboard"
              />
            }
          />
          </Route>
        </Route>'''

if old_end in text:
    text = text.replace(
        old_end,
        new_end,
    )

path.write_text(text)
PY

# ============================================================
# PARENT LOGOUT
# ============================================================

python3 - <<'PY'
from pathlib import Path

path = Path(
    "apps/parent/src/components/navigation/ParentSidebar.tsx"
)

text = path.read_text()

text = text.replace(
    'import { NavLink } from "react-router-dom";',
    'import {\n'
    '  NavLink,\n'
    '  useNavigate,\n'
    '} from "react-router-dom";'
)

text = text.replace(
    '}: ParentSidebarProps) {\n  return (',
    '}: ParentSidebarProps) {\n'
    '  const navigate = useNavigate();\n\n'
    '  function handleLogout() {\n'
    '    localStorage.removeItem(\n'
    '      "aimers_parent_session",\n'
    '    );\n\n'
    '    navigate("/login", {\n'
    '      replace: true,\n'
    '    });\n'
    '  }\n\n'
    '  return ('
)

text = text.replace(
    '''          <button
            type="button"
            aria-label="Log out"
          >
            <LogOut size={15} />
          </button>''',
    '''          <button
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
          >
            <LogOut size={15} />
          </button>'''
)

path.write_text(text)
PY

# ============================================================
# INSTITUTION PROTECTED ROUTE
# ============================================================

cat > apps/institution/src/app/router/InstitutionProtectedRoute.tsx <<'EOF'
import {
  Navigate,
  Outlet,
} from "react-router-dom";

const SESSION_KEY =
  "aimers_institution_session";

export function InstitutionProtectedRoute() {
  const rawSession =
    localStorage.getItem(SESSION_KEY);

  if (!rawSession) {
    return (
      <Navigate
        replace
        to="/login"
      />
    );
  }

  try {
    const session = JSON.parse(
      rawSession,
    ) as {
      expiresAt?: number;
    };

    if (
      !session.expiresAt ||
      session.expiresAt < Date.now()
    ) {
      localStorage.removeItem(
        SESSION_KEY,
      );

      return (
        <Navigate
          replace
          to="/login"
        />
      );
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);

    return (
      <Navigate
        replace
        to="/login"
      />
    );
  }

  return <Outlet />;
}
EOF

# ============================================================
# INSTITUTION LOGIN
# ============================================================

cat > apps/institution/src/pages/auth/InstitutionLoginPage.tsx <<'EOF'
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
EOF

# ============================================================
# INSTITUTION ROUTER
# ============================================================

python3 - <<'PY'
from pathlib import Path

path = Path(
    "apps/institution/src/app/router/InstitutionRouter.tsx"
)

text = path.read_text()

if 'InstitutionProtectedRoute' not in text:
    text = text.replace(
        'import { InstitutionShell } from "../shell/InstitutionShell";',
        'import { InstitutionShell } from "../shell/InstitutionShell";\n'
        'import { InstitutionProtectedRoute } from "./InstitutionProtectedRoute";'
    )

text = text.replace(
    '<Route\n          element={<InstitutionShell />}\n        >',
    '<Route element={<InstitutionProtectedRoute />}>\n'
    '          <Route\n'
    '            element={<InstitutionShell />}\n'
    '          >'
)

old_end = '''          <Route
            path="*"
            element={
              <Navigate
                replace
                to="/dashboard"
              />
            }
          />
        </Route>'''

new_end = '''          <Route
            path="*"
            element={
              <Navigate
                replace
                to="/dashboard"
              />
            }
          />
          </Route>
        </Route>'''

if old_end in text:
    text = text.replace(
        old_end,
        new_end,
    )

path.write_text(text)
PY

# ============================================================
# INSTITUTION LOGOUT
# ============================================================

python3 - <<'PY'
from pathlib import Path

path = Path(
    "apps/institution/src/components/navigation/InstitutionSidebar.tsx"
)

text = path.read_text()

text = text.replace(
    'import { NavLink } from "react-router-dom";',
    'import {\n'
    '  NavLink,\n'
    '  useNavigate,\n'
    '} from "react-router-dom";'
)

text = text.replace(
    '}: InstitutionSidebarProps) {\n  return (',
    '}: InstitutionSidebarProps) {\n'
    '  const navigate = useNavigate();\n\n'
    '  function handleLogout() {\n'
    '    localStorage.removeItem(\n'
    '      "aimers_institution_session",\n'
    '    );\n\n'
    '    navigate("/login", {\n'
    '      replace: true,\n'
    '    });\n'
    '  }\n\n'
    '  return ('
)

text = text.replace(
    '''          <button
            type="button"
            aria-label="Log out"
          >
            <LogOut size={15} />
          </button>''',
    '''          <button
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
          >
            <LogOut size={15} />
          </button>'''
)

path.write_text(text)
PY

# ============================================================
# LOGIN STYLES
# ============================================================

cat >> apps/parent/src/styles/parent.css <<'EOF'

.parent-demo-credentials {
  display: grid;
  gap: 4px;
  border: 1px solid
    rgba(139, 92, 246, 0.2);
  border-radius: 11px;
  margin-bottom: 20px;
  padding: 11px 13px;
  color: var(--aimers-text-secondary);
  background:
    rgba(139, 92, 246, 0.055);
  font-size: 9px;
}

.parent-demo-credentials strong {
  margin-bottom: 2px;
  color: #c49aff;
}

.parent-login-error {
  border: 1px solid
    rgba(239, 71, 111, 0.25);
  border-radius: 10px;
  padding: 10px 12px;
  color: #ff8296;
  background:
    rgba(239, 71, 111, 0.07);
  font-size: 9px;
}

.parent-login-form button:disabled {
  cursor: wait;
  opacity: 0.7;
}
EOF

cat >> apps/institution/src/styles/institution.css <<'EOF'

.institution-demo-credentials {
  display: grid;
  gap: 4px;
  border: 1px solid
    rgba(139, 92, 246, 0.2);
  border-radius: 11px;
  margin-bottom: 20px;
  padding: 11px 13px;
  color: var(--aimers-text-secondary);
  background:
    rgba(139, 92, 246, 0.055);
  font-size: 9px;
}

.institution-demo-credentials strong {
  margin-bottom: 2px;
  color: #c49aff;
}

.institution-login-error {
  border: 1px solid
    rgba(239, 71, 111, 0.25);
  border-radius: 10px;
  padding: 10px 12px;
  color: #ff8296;
  background:
    rgba(239, 71, 111, 0.07);
  font-size: 9px;
}

.institution-login-form button:disabled {
  cursor: wait;
  opacity: 0.7;
}
EOF

echo "Demo authentication added successfully."
