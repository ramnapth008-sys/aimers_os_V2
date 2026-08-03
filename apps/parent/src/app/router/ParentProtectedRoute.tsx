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
