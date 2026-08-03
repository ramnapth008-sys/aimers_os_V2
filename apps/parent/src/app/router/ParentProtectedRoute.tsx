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
