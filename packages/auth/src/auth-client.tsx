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
