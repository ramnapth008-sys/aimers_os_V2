#!/usr/bin/env bash
set -euo pipefail

ROOT="${HOME}/Desktop/AIMERS_OS_V2"
cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: Git working tree is not clean."
  echo "Commit the current authentication milestone before running this script:"
  echo '  git add .'
  echo '  git commit -m "feat(auth): add JWT login and rotating database sessions"'
  echo '  git push'
  exit 1
fi

echo "Creating shared frontend authentication and connecting AIMERS portals..."

mkdir -p \
  packages/auth/src \
  apps/api/scripts \
  apps/admin/src/pages/auth

cat > packages/auth/package.json <<'JSON'
{
  "name": "@aimers/auth",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc --noEmit -p tsconfig.json",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-router-dom": "^7.18.2"
  },
  "devDependencies": {
    "@types/react": "^19.2.18",
    "typescript": "^7.0.2"
  }
}
JSON

cat > packages/auth/tsconfig.json <<'JSON'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
JSON

cat > packages/auth/src/auth.types.ts <<'TS'
export type UserRole =
  | "STUDENT"
  | "PARENT"
  | "MENTOR"
  | "TEACHER"
  | "STAFF"
  | "INSTITUTION_ADMIN"
  | "ADMIN"
  | "SUPER_ADMIN";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "anonymous";

export interface OrganizationMembership {
  organizationId: string;
  role: UserRole;
  status: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  displayName: string | null;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  roles: UserRole[];
  organizationMemberships: OrganizationMembership[];
}

export interface AuthSessionResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}
TS

cat > packages/auth/src/auth-client.tsx <<'TSX'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import type {
  AuthSessionResponse,
  AuthStatus,
  AuthUser,
  LoginInput,
  RegisterInput,
  UserRole,
} from "./auth.types";

interface AuthContextValue {
  apiUrl: string;
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  login(input: LoginInput): Promise<AuthSessionResponse>;
  register(
    input: RegisterInput,
  ): Promise<AuthSessionResponse>;
  refresh(): Promise<AuthSessionResponse | null>;
  logout(): Promise<void>;
  apiFetch<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T>;
  hasAnyRole(
    roles: readonly UserRole[],
  ): boolean;
}

interface AuthProviderProps {
  apiUrl: string;
  children: ReactNode;
}

interface RequireAuthProps {
  roles?: readonly UserRole[];
  loginUrl: string;
  children?: ReactNode;
}

interface RuntimeSession {
  apiUrl: string | null;
  accessToken: string | null;
  user: AuthUser | null;
  bootstrapPromise:
    | Promise<AuthSessionResponse | null>
    | null;
  refreshPromise:
    | Promise<AuthSessionResponse | null>
    | null;
}

const runtime: RuntimeSession = {
  apiUrl: null,
  accessToken: null,
  user: null,
  bootstrapPromise: null,
  refreshPromise: null,
};

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

export class AuthApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

function normalizeApiUrl(
  apiUrl: string,
): string {
  return apiUrl.replace(/\/+$/, "");
}

async function readResponse<T>(
  response: Response,
): Promise<T> {
  const body = await response
    .json()
    .catch(() => null) as
    | Record<string, unknown>
    | null;

  if (!response.ok) {
    const rawMessage =
      body?.message;

    const message =
      Array.isArray(rawMessage)
        ? rawMessage.join(" ")
        : typeof rawMessage === "string"
          ? rawMessage
          : typeof body?.error === "string"
            ? body.error
            : `Request failed with status ${response.status}.`;

    throw new AuthApiError(
      message,
      response.status,
    );
  }

  return body as T;
}

async function requestSession(
  apiUrl: string,
  path: string,
  init: RequestInit,
): Promise<AuthSessionResponse> {
  const response = await fetch(
    `${apiUrl}${path}`,
    {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
      },
    },
  );

  const session =
    await readResponse<AuthSessionResponse>(
      response,
    );

  runtime.apiUrl = apiUrl;
  runtime.accessToken =
    session.accessToken;
  runtime.user = session.user;

  return session;
}

async function performRefresh(
  apiUrl: string,
): Promise<AuthSessionResponse | null> {
  if (runtime.refreshPromise) {
    return runtime.refreshPromise;
  }

  runtime.refreshPromise = (
    async () => {
      try {
        return await requestSession(
          apiUrl,
          "/auth/refresh",
          {
            method: "POST",
          },
        );
      } catch (error) {
        if (
          error instanceof AuthApiError &&
          error.status === 401
        ) {
          runtime.accessToken = null;
          runtime.user = null;
          return null;
        }

        throw error;
      } finally {
        runtime.refreshPromise = null;
      }
    }
  )();

  return runtime.refreshPromise;
}

export function AuthProvider({
  apiUrl: apiUrlInput,
  children,
}: AuthProviderProps) {
  const apiUrl =
    normalizeApiUrl(apiUrlInput);

  const [status, setStatus] =
    useState<AuthStatus>("loading");

  const [user, setUser] =
    useState<AuthUser | null>(
      runtime.apiUrl === apiUrl
        ? runtime.user
        : null,
    );

  const [accessToken, setAccessToken] =
    useState<string | null>(
      runtime.apiUrl === apiUrl
        ? runtime.accessToken
        : null,
    );

  const mounted =
    useRef(true);

  const applySession =
    useCallback(
      (
        session:
          | AuthSessionResponse
          | null,
      ) => {
        if (!mounted.current) {
          return;
        }

        setUser(
          session?.user ?? null,
        );

        setAccessToken(
          session?.accessToken ?? null,
        );

        setStatus(
          session
            ? "authenticated"
            : "anonymous",
        );
      },
      [],
    );

  useEffect(() => {
    mounted.current = true;

    if (runtime.apiUrl !== apiUrl) {
      runtime.apiUrl = apiUrl;
      runtime.accessToken = null;
      runtime.user = null;
      runtime.bootstrapPromise = null;
      runtime.refreshPromise = null;
    }

    if (!runtime.bootstrapPromise) {
      runtime.bootstrapPromise =
        runtime.user &&
        runtime.accessToken
          ? Promise.resolve({
              accessToken:
                runtime.accessToken,
              tokenType: "Bearer",
              expiresIn: 0,
              user: runtime.user,
            })
          : performRefresh(apiUrl);
    }

    void runtime.bootstrapPromise
      .then(applySession)
      .catch(() => {
        applySession(null);
      });

    return () => {
      mounted.current = false;
    };
  }, [apiUrl, applySession]);

  const login =
    useCallback(
      async (
        input: LoginInput,
      ) => {
        const session =
          await requestSession(
            apiUrl,
            "/auth/login",
            {
              method: "POST",
              body: JSON.stringify(
                input,
              ),
            },
          );

        runtime.bootstrapPromise =
          Promise.resolve(session);

        applySession(session);

        return session;
      },
      [apiUrl, applySession],
    );

  const register =
    useCallback(
      async (
        input: RegisterInput,
      ) => {
        const session =
          await requestSession(
            apiUrl,
            "/auth/register",
            {
              method: "POST",
              body: JSON.stringify(
                input,
              ),
            },
          );

        runtime.bootstrapPromise =
          Promise.resolve(session);

        applySession(session);

        return session;
      },
      [apiUrl, applySession],
    );

  const refresh =
    useCallback(
      async () => {
        const session =
          await performRefresh(
            apiUrl,
          );

        runtime.bootstrapPromise =
          Promise.resolve(session);

        applySession(session);

        return session;
      },
      [apiUrl, applySession],
    );

  const logout =
    useCallback(
      async () => {
        try {
          await fetch(
            `${apiUrl}/auth/logout`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );
        } finally {
          runtime.accessToken = null;
          runtime.user = null;
          runtime.bootstrapPromise =
            Promise.resolve(null);

          applySession(null);
        }
      },
      [apiUrl, applySession],
    );

  const apiFetch =
    useCallback(
      async <T,>(
        path: string,
        init: RequestInit = {},
      ): Promise<T> => {
        const execute =
          async (
            token: string | null,
          ) =>
            fetch(
              `${apiUrl}${
                path.startsWith("/")
                  ? path
                  : `/${path}`
              }`,
              {
                ...init,
                credentials:
                  "include",
                headers: {
                  Accept:
                    "application/json",
                  ...(init.body
                    ? {
                        "Content-Type":
                          "application/json",
                      }
                    : {}),
                  ...(token
                    ? {
                        Authorization:
                          `Bearer ${token}`,
                      }
                    : {}),
                  ...init.headers,
                },
              },
            );

        let response =
          await execute(
            runtime.accessToken,
          );

        if (
          response.status === 401
        ) {
          const session =
            await performRefresh(
              apiUrl,
            );

          applySession(session);

          if (session) {
            response =
              await execute(
                session.accessToken,
              );
          }
        }

        return readResponse<T>(
          response,
        );
      },
      [apiUrl, applySession],
    );

  const hasAnyRole =
    useCallback(
      (
        roles:
          readonly UserRole[],
      ) =>
        Boolean(
          user &&
          roles.some((role) =>
            user.roles.includes(
              role,
            ),
          ),
        ),
      [user],
    );

  const value =
    useMemo<AuthContextValue>(
      () => ({
        apiUrl,
        status,
        user,
        accessToken,
        login,
        register,
        refresh,
        logout,
        apiFetch,
        hasAnyRole,
      }),
      [
        apiUrl,
        status,
        user,
        accessToken,
        login,
        register,
        refresh,
        logout,
        apiFetch,
        hasAnyRole,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth():
  AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}

export function RequireAuth({
  roles = [],
  loginUrl,
  children,
}: RequireAuthProps) {
  const {
    status,
    user,
    logout,
  } = useAuth();

  useEffect(() => {
    if (status !== "anonymous") {
      return;
    }

    const target =
      new URL(
        loginUrl,
        window.location.origin,
      );

    target.searchParams.set(
      "returnTo",
      window.location.href,
    );

    window.location.replace(
      target.toString(),
    );
  }, [status, loginUrl]);

  if (
    status === "loading" ||
    status === "anonymous"
  ) {
    return (
      <main style={pendingStyle}>
        <div style={pendingCardStyle}>
          <strong>
            Verifying secure session
          </strong>

          <span>
            Connecting to AIMERS OS…
          </span>
        </div>
      </main>
    );
  }

  const permitted =
    roles.length === 0 ||
    roles.some((role) =>
      user?.roles.includes(role),
    );

  if (!permitted) {
    return (
      <main style={pendingStyle}>
        <div style={pendingCardStyle}>
          <strong>
            Access not permitted
          </strong>

          <span>
            This account does not have
            permission to open this portal.
          </span>

          <button
            type="button"
            onClick={() => {
              void logout().finally(
                () => {
                  window.location.replace(
                    loginUrl,
                  );
                },
              );
            }}
            style={buttonStyle}
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return children
    ? <>{children}</>
    : <Outlet />;
}

const pendingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  background:
    "radial-gradient(circle at 20% 10%, rgba(116, 76, 255, 0.18), transparent 35%), #070914",
  color: "#f7f8ff",
  fontFamily:
    "Inter, system-ui, sans-serif",
} as const;

const pendingCardStyle = {
  width: "min(420px, 100%)",
  display: "grid",
  gap: "12px",
  padding: "28px",
  border:
    "1px solid rgba(144, 125, 255, 0.24)",
  borderRadius: "20px",
  background:
    "rgba(15, 18, 37, 0.82)",
  boxShadow:
    "0 24px 80px rgba(0, 0, 0, 0.36)",
} as const;

const buttonStyle = {
  marginTop: "8px",
  minHeight: "44px",
  border: 0,
  borderRadius: "12px",
  cursor: "pointer",
  color: "white",
  background:
    "linear-gradient(135deg, #765cff, #377dff)",
} as const;
TSX

cat > packages/auth/src/index.ts <<'TS'
export {
  AuthApiError,
  AuthProvider,
  RequireAuth,
  useAuth,
} from "./auth-client";

export type {
  AuthSessionResponse,
  AuthStatus,
  AuthUser,
  LoginInput,
  OrganizationMembership,
  RegisterInput,
  UserRole,
} from "./auth.types";
TS

python3 - <<'PY'
import json
from pathlib import Path

apps = [
    "web",
    "admin",
    "staff",
    "parent",
    "institution",
    "marketing",
]

for app in apps:
    path = Path(f"apps/{app}/package.json")
    data = json.loads(path.read_text())
    deps = data.setdefault("dependencies", {})
    deps["@aimers/auth"] = "workspace:*"
    data["dependencies"] = dict(
        sorted(deps.items())
    )
    path.write_text(
        json.dumps(data, indent=2) + "\n"
    )

    env = Path(f"apps/{app}/.env.example")
    lines = (
        env.read_text().splitlines()
        if env.exists()
        else []
    )

    values = {
        "VITE_API_URL":
            "http://localhost:4000/api/v1",
    }

    if app == "marketing":
        values["VITE_STUDENT_APP_URL"] = \
            "http://localhost:5173/dashboard"

    existing = {
        line.split("=", 1)[0]
        for line in lines
        if "=" in line
    }

    for key, value in values.items():
        if key not in existing:
            lines.append(f"{key}={value}")

    env.write_text(
        "\n".join(lines).strip() + "\n"
    )
PY

cat > apps/web/src/app/App.tsx <<'TSX'
import { AuthProvider } from "@aimers/auth";

import { AppRouter } from "./router/AppRouter";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000/api/v1";

export function App() {
  return (
    <AuthProvider apiUrl={API_URL}>
      <AppRouter />
    </AuthProvider>
  );
}
TSX

cat > apps/admin/src/app/App.tsx <<'TSX'
import { AuthProvider } from "@aimers/auth";

import { AdminRouter } from "./router/AdminRouter";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000/api/v1";

export function App() {
  return (
    <AuthProvider apiUrl={API_URL}>
      <AdminRouter />
    </AuthProvider>
  );
}
TSX

cat > apps/staff/src/app/App.tsx <<'TSX'
import { AuthProvider } from "@aimers/auth";

import { StaffRouter } from "./router/StaffRouter";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000/api/v1";

export function App() {
  return (
    <AuthProvider apiUrl={API_URL}>
      <StaffRouter />
    </AuthProvider>
  );
}
TSX

cat > apps/parent/src/app/App.tsx <<'TSX'
import { AuthProvider } from "@aimers/auth";

import { ParentRouter } from "./router/ParentRouter";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000/api/v1";

export function App() {
  return (
    <AuthProvider apiUrl={API_URL}>
      <ParentRouter />
    </AuthProvider>
  );
}
TSX

cat > apps/institution/src/app/App.tsx <<'TSX'
import { AuthProvider } from "@aimers/auth";

import { InstitutionRouter } from "./router/InstitutionRouter";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000/api/v1";

export function App() {
  return (
    <AuthProvider apiUrl={API_URL}>
      <InstitutionRouter />
    </AuthProvider>
  );
}
TSX

cat > apps/marketing/src/app/App.tsx <<'TSX'
import { AuthProvider } from "@aimers/auth";

import { MarketingRouter } from "./router/MarketingRouter";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000/api/v1";

export function App() {
  return (
    <AuthProvider apiUrl={API_URL}>
      <MarketingRouter />
    </AuthProvider>
  );
}
TSX

python3 - <<'PY'
from pathlib import Path


def add_import(
    path: Path,
    statement: str,
) -> str:
    text = path.read_text()

    if statement not in text:
        text = statement + "\n\n" + text

    return text


def close_wrapper(
    text: str,
    path: Path,
) -> str:
    needle = (
        "        </Route>\n"
        "      </Routes>"
    )

    if needle not in text:
        raise SystemExit(
            f"Could not locate router closing block in {path}"
        )

    before, after = text.rsplit(
        needle,
        1,
    )

    return before + (
        "        </Route>\n"
        "        </Route>\n"
        "      </Routes>"
    ) + after


path = Path(
    "apps/web/src/app/router/AppRouter.tsx"
)
text = add_import(
    path,
    'import { RequireAuth } from "@aimers/auth";',
)
needle = '        <Route element={<AppShell />}>'
replacement = '''        <Route
          element={
            <RequireAuth
              roles={["STUDENT"]}
              loginUrl="http://localhost:5174/login"
            />
          }
        >
          <Route element={<AppShell />}>'''

if needle not in text:
    raise SystemExit(
        "Could not locate AppShell route in student router."
    )

text = text.replace(
    needle,
    replacement,
    1,
)
text = close_wrapper(text, path)
path.write_text(text)


path = Path(
    "apps/admin/src/app/router/AdminRouter.tsx"
)
text = add_import(
    path,
    'import { RequireAuth } from "@aimers/auth";',
)

admin_import = (
    'import { AdminLoginPage } from '
    '"../../pages/auth/AdminLoginPage";'
)

if admin_import not in text:
    marker = (
        'import { AdminShell } from '
        '"../shell/AdminShell";'
    )

    if marker not in text:
        raise SystemExit(
            "Could not locate AdminShell import."
        )

    text = text.replace(
        marker,
        marker + "\n\n" + admin_import,
        1,
    )

needle = (
    "      <Routes>\n"
    "        <Route element={<AdminShell />}>"
)

replacement = '''      <Routes>
        <Route
          path="/login"
          element={<AdminLoginPage />}
        />

        <Route
          element={
            <RequireAuth
              roles={["ADMIN", "SUPER_ADMIN"]}
              loginUrl="/login"
            />
          }
        >
          <Route element={<AdminShell />}>'''

if needle not in text:
    raise SystemExit(
        "Could not locate AdminShell route."
    )

text = text.replace(
    needle,
    replacement,
    1,
)
text = close_wrapper(text, path)
path.write_text(text)


path = Path(
    "apps/staff/src/app/router/StaffRouter.tsx"
)
text = add_import(
    path,
    'import { RequireAuth } from "@aimers/auth";',
)

needle = '        <Route element={<StaffShell />}>'
replacement = '''        <Route
          element={
            <RequireAuth
              roles={["MENTOR", "TEACHER", "STAFF"]}
              loginUrl="/login"
            />
          }
        >
          <Route element={<StaffShell />}>'''

if needle not in text:
    raise SystemExit(
        "Could not locate StaffShell route."
    )

text = text.replace(
    needle,
    replacement,
    1,
)
text = close_wrapper(text, path)
path.write_text(text)
PY

cat > apps/parent/src/app/router/ParentProtectedRoute.tsx <<'TSX'
import {
  RequireAuth,
} from "@aimers/auth";

export function ParentProtectedRoute() {
  return (
    <RequireAuth
      roles={["PARENT"]}
      loginUrl="/login"
    />
  );
}
TSX

cat > apps/institution/src/app/router/InstitutionProtectedRoute.tsx <<'TSX'
import {
  RequireAuth,
} from "@aimers/auth";

export function InstitutionProtectedRoute() {
  return (
    <RequireAuth
      roles={["INSTITUTION_ADMIN"]}
      loginUrl="/login"
    />
  );
}
TSX

cat > apps/staff/src/pages/auth/StaffLoginPage.tsx <<'TSX'
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
TSX

cat > apps/parent/src/pages/auth/ParentLoginPage.tsx <<'TSX'
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
TSX

cat > apps/institution/src/pages/auth/InstitutionLoginPage.tsx <<'TSX'
import {
  useAuth,
} from "@aimers/auth";

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

import {
  useNavigate,
} from "react-router-dom";

export function InstitutionLoginPage() {
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
          "INSTITUTION_ADMIN",
        )
      ) {
        await logout();

        setError(
          "This account is not authorised for the institution portal.",
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
                views are securely controlled.
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
              ? "Signing in..."
              : "Open institution workspace"}

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
TSX

cat > apps/admin/src/pages/auth/AdminLoginPage.tsx <<'TSX'
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
TSX

cat >> apps/admin/src/styles/admin.css <<'CSS'

/* Real API administrator login */
.admin-login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
  background:
    radial-gradient(circle at 10% 12%, rgba(115, 83, 255, 0.24), transparent 34%),
    radial-gradient(circle at 76% 88%, rgba(29, 125, 255, 0.15), transparent 34%),
    #070914;
  color: #f7f8ff;
}

.admin-login-visual,
.admin-login-form {
  min-height: 100vh;
  padding: clamp(32px, 6vw, 88px);
}

.admin-login-visual {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-login-brand > span {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: linear-gradient(135deg, #785cff, #2589ff);
  box-shadow: 0 18px 55px rgba(74, 78, 255, 0.34);
}

.admin-login-brand strong,
.admin-login-brand small {
  display: block;
}

.admin-login-visual > div:last-child {
  max-width: 720px;
}

.admin-login-visual > div:last-child > span,
.admin-login-form form > span {
  color: #8f9bff;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.admin-login-visual h1 {
  max-width: 760px;
  margin: 18px 0;
  font-size: clamp(2.5rem, 5.4vw, 5.6rem);
  line-height: 0.98;
}

.admin-login-visual p,
.admin-login-form p {
  color: #a7aec7;
  line-height: 1.7;
}

.admin-login-visual section {
  width: fit-content;
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding: 16px 18px;
  border: 1px solid rgba(132, 115, 255, 0.22);
  border-radius: 16px;
  background: rgba(16, 19, 40, 0.72);
}

.admin-login-visual section strong,
.admin-login-visual section small {
  display: block;
}

.admin-login-visual section small {
  margin-top: 4px;
  color: #8f96ae;
}

.admin-login-form {
  display: grid;
  place-items: center;
}

.admin-login-form form {
  width: min(440px, 100%);
  display: grid;
  gap: 18px;
  padding: clamp(26px, 4vw, 42px);
  border: 1px solid rgba(143, 122, 255, 0.2);
  border-radius: 24px;
  background: rgba(13, 16, 33, 0.82);
  box-shadow: 0 30px 100px rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(24px);
}

.admin-login-form h2 {
  margin: 0;
  font-size: 2rem;
}

.admin-login-form label {
  display: grid;
  gap: 8px;
  color: #d6daf0;
  font-size: 0.86rem;
}

.admin-login-form label > div {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.035);
}

.admin-login-form input {
  width: 100%;
  border: 0;
  outline: 0;
  color: white;
  background: transparent;
}

.admin-login-form button {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 13px;
  cursor: pointer;
  color: white;
  font-weight: 800;
  background: linear-gradient(135deg, #765cff, #247eff);
}

.admin-login-form button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.admin-login-error {
  padding: 12px 14px;
  border: 1px solid rgba(255, 87, 126, 0.3);
  border-radius: 12px;
  color: #ff9caf;
  background: rgba(255, 54, 103, 0.08);
}

@media (max-width: 900px) {
  .admin-login-page {
    grid-template-columns: 1fr;
  }

  .admin-login-visual {
    min-height: auto;
    gap: 70px;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .admin-login-form {
    min-height: auto;
  }
}
CSS

cat > apps/marketing/src/pages/auth/AuthPage.tsx <<'TSX'
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
TSX

cat >> apps/marketing/src/styles/marketing.css <<'CSS'

.marketing-auth-error {
  padding: 12px 14px;
  border: 1px solid rgba(255, 87, 126, 0.3);
  border-radius: 12px;
  color: #ff9caf;
  background: rgba(255, 54, 103, 0.08);
}

.auth-form-card button:disabled {
  cursor: wait;
  opacity: 0.65;
}
CSS

cat > apps/api/scripts/seed-dev-users.ts <<'TS'
import {
  hash,
} from "@node-rs/argon2";

import {
  MembershipStatus,
  OrganizationType,
  PrismaClient,
  UserRole,
  UserStatus,
} from "@aimers/database";

import {
  randomBytes,
} from "node:crypto";

import {
  chmod,
  readFile,
  writeFile,
} from "node:fs/promises";

import {
  resolve,
} from "node:path";

interface Credential {
  email: string;
  password: string;
  firstName: string;
  role: UserRole;
}

type CredentialMap =
  Record<string, Credential>;

const database =
  new PrismaClient();

const credentialPath =
  resolve(
    process.cwd(),
    ".dev-auth-credentials.json",
  );

function createPassword():
  string {
  return (
    "Aimers!" +
    randomBytes(15)
      .toString("base64url")
  );
}

async function loadCredentials():
  Promise<CredentialMap> {
  try {
    return JSON.parse(
      await readFile(
        credentialPath,
        "utf8",
      ),
    ) as CredentialMap;
  } catch {
    const credentials:
      CredentialMap = {
        student: {
          email:
            "student@aimers.local",
          password:
            createPassword(),
          firstName:
            "Student",
          role:
            UserRole.STUDENT,
        },

        parent: {
          email:
            "parent@aimers.local",
          password:
            createPassword(),
          firstName:
            "Parent",
          role:
            UserRole.PARENT,
        },

        staff: {
          email:
            "mentor@aimers.local",
          password:
            createPassword(),
          firstName:
            "Mentor",
          role:
            UserRole.MENTOR,
        },

        institution: {
          email:
            "institution@aimers.local",
          password:
            createPassword(),
          firstName:
            "Institution",
          role:
            UserRole.INSTITUTION_ADMIN,
        },

        admin: {
          email:
            "admin@aimers.local",
          password:
            createPassword(),
          firstName:
            "Admin",
          role:
            UserRole.ADMIN,
        },
      };

    await writeFile(
      credentialPath,
      JSON.stringify(
        credentials,
        null,
        2,
      ) + "\n",
      "utf8",
    );

    await chmod(
      credentialPath,
      0o600,
    );

    return credentials;
  }
}

async function ensureRole(
  userId: string,
  role: UserRole,
): Promise<void> {
  const existing =
    await database
      .globalRoleAssignment
      .findFirst({
        where: {
          userId,
          role,
        },
      });

  if (!existing) {
    await database
      .globalRoleAssignment
      .create({
        data: {
          userId,
          role,
        },
      });
  }
}

async function ensureMembership(
  userId: string,
  organizationId: string,
  role: UserRole,
): Promise<void> {
  const existing =
    await database
      .organizationMembership
      .findFirst({
        where: {
          userId,
          organizationId,
          role,
        },
      });

  if (existing) {
    await database
      .organizationMembership
      .update({
        where: {
          id: existing.id,
        },

        data: {
          status:
            MembershipStatus.ACTIVE,
          joinedAt:
            existing.joinedAt ??
            new Date(),
        },
      });

    return;
  }

  await database
    .organizationMembership
    .create({
      data: {
        userId,
        organizationId,
        role,
        status:
          MembershipStatus.ACTIVE,
        joinedAt:
          new Date(),
      },
    });
}

async function run():
  Promise<void> {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    throw new Error(
      "Development users cannot be seeded in production.",
    );
  }

  const credentials =
    await loadCredentials();

  const academy =
    await database.organization
      .upsert({
        where: {
          slug:
            "aimers-academy-trivandrum",
        },

        update: {},

        create: {
          name:
            "AIMERS Academy Trivandrum",
          slug:
            "aimers-academy-trivandrum",
          type:
            OrganizationType
              .COACHING_INSTITUTE,
          timezone:
            "Asia/Kolkata",
          country:
            "IN",
        },
      });

  for (
    const credential of
    Object.values(credentials)
  ) {
    const passwordHash =
      await hash(
        credential.password,
        {
          memoryCost:
            19 * 1024,
          timeCost:
            2,
          parallelism:
            1,
          outputLen:
            32,
        },
      );

    const user =
      await database.user
        .upsert({
          where: {
            email:
              credential.email,
          },

          update: {
            passwordHash,
            firstName:
              credential.firstName,
            displayName:
              credential.firstName,
            status:
              UserStatus.ACTIVE,
          },

          create: {
            email:
              credential.email,
            passwordHash,
            firstName:
              credential.firstName,
            displayName:
              credential.firstName,
            status:
              UserStatus.ACTIVE,
          },
        });

    await ensureRole(
      user.id,
      credential.role,
    );

    if (
      credential.role ===
        UserRole.STUDENT ||
      credential.role ===
        UserRole.MENTOR ||
      credential.role ===
        UserRole.INSTITUTION_ADMIN
    ) {
      await ensureMembership(
        user.id,
        academy.id,
        credential.role,
      );
    }

    if (
      credential.role ===
      UserRole.STUDENT
    ) {
      const profile =
        await database
          .studentProfile
          .findFirst({
            where: {
              userId:
                user.id,
              organizationId:
                academy.id,
            },
          });

      if (!profile) {
        await database
          .studentProfile
          .create({
            data: {
              userId:
                user.id,
              organizationId:
                academy.id,
              examTarget:
                "NEET",
              targetYear:
                2027,
            },
          });
      }
    }
  }

  console.log(
    "\nDevelopment portal accounts",
  );

  console.log(
    "Stored locally at:",
    credentialPath,
  );

  for (
    const [
      portal,
      credential,
    ] of Object.entries(
      credentials,
    )
  ) {
    console.log(
      `\n${portal.toUpperCase()}`,
    );

    console.log(
      `Email: ${credential.email}`,
    );

    console.log(
      `Password: ${credential.password}`,
    );

    console.log(
      `Role: ${credential.role}`,
    );
  }

  console.log(
    "\nThese credentials are local development data and must never be committed.",
  );
}

run()
  .catch((error: unknown) => {
    console.error(
      "Development user seed failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
TS

python3 - <<'PY'
import json
from pathlib import Path

path = Path(
    "apps/api/package.json",
)
data = json.loads(
    path.read_text(),
)

data.setdefault(
    "scripts",
    {},
)["seed:dev-users"] = (
    "dotenv -e .env -- "
    "tsx scripts/seed-dev-users.ts"
)

path.write_text(
    json.dumps(
        data,
        indent=2,
    ) + "\n",
)

gitignore = Path(
    ".gitignore",
)

text = (
    gitignore.read_text()
    if gitignore.exists()
    else ""
)

rule = (
    "\n# Local development portal credentials\n"
    "apps/api/.dev-auth-credentials.json\n"
)

if (
    "apps/api/.dev-auth-credentials.json"
    not in text
):
    gitignore.write_text(
        text.rstrip() +
        rule,
    )
PY

pnpm --filter @aimers/api add -D dotenv-cli
pnpm install

echo
echo "Frontend authentication files created."
echo
echo "Next commands:"
echo "  pnpm --filter @aimers/api seed:dev-users"
echo "  pnpm --filter @aimers/auth typecheck"
echo "  pnpm --filter @aimers/web typecheck"
echo "  pnpm --filter @aimers/marketing typecheck"
echo "  pnpm --filter @aimers/admin typecheck"
echo "  pnpm --filter @aimers/staff typecheck"
echo "  pnpm --filter @aimers/parent typecheck"
echo "  pnpm --filter @aimers/institution typecheck"
